import * as cheerio from 'cheerio';
import { validateUrlForSSRF } from '../ssrf/guard';
import { analyzeHeadersAndCookies } from '../rules/headers';
import { scanSourceForSecrets } from '../rules/secrets';
import { analyzeArtifactResponse } from '../rules/artifacts';
import { Finding, ScannedAsset, ScanProgressEvent } from '@/lib/types/scanner';

export interface FetchResult {
  status: number;
  headers: Record<string, string | string[]>;
  body: string;
  finalUrl: string;
}

export interface OrchestratorOptions {
  onProgress?: (event: ScanProgressEvent) => void;
  maxScripts?: number;
  maxTotalBytes?: number;
  perRequestTimeoutMs?: number;
}

const DEFAULT_MAX_SCRIPTS = 15;
const DEFAULT_MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const DEFAULT_TIMEOUT_MS = 5000;

/**
 * Sandboxed safe fetcher that manually intercepts redirects and verifies
 * SSRF boundaries on EVERY single redirect hop before establishing a connection.
 */
export async function safeFetch(
  rawUrl: string,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  maxRedirects = 5
): Promise<FetchResult> {
  let currentUrl = rawUrl;
  let redirectsRemaining = maxRedirects;

  while (redirectsRemaining >= 0) {
    // 1. SSRF check before every connection attempt
    const ssrfCheck = await validateUrlForSSRF(currentUrl);
    if (!ssrfCheck.allowed) {
      throw new Error(`SSRF Guard blocked request: ${ssrfCheck.error}`);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(currentUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'ShipSafe-Hygiene-Auditor/1.0 (+https://shipsafe.dev; passive security check)',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        redirect: 'manual', // Intercept redirects manually
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Handle Redirects (301, 302, 307, 308)
      if ([301, 302, 303, 307, 308].includes(response.status)) {
        const location = response.headers.get('location');
        if (!location) {
          throw new Error(`Received redirect status ${response.status} with no Location header.`);
        }

        // Construct absolute target URL for next hop
        currentUrl = new URL(location, currentUrl).toString();
        redirectsRemaining--;
        continue;
      }

      // Convert Headers to standard record
      const headersRecord: Record<string, string | string[]> = {};
      response.headers.forEach((value, key) => {
        headersRecord[key] = value;
      });

      // Special handling for Set-Cookie header array
      const rawSetCookie = response.headers.getSetCookie ? response.headers.getSetCookie() : [];
      if (rawSetCookie.length > 0) {
        headersRecord['set-cookie'] = rawSetCookie;
      }

      const body = await response.text();

      return {
        status: response.status,
        headers: headersRecord,
        body,
        finalUrl: currentUrl,
      };

    } catch (err: unknown) {
      clearTimeout(timeoutId);
      if (err instanceof Error && err.name === 'AbortError') {
        throw new Error(`Request timed out after ${timeoutMs}ms.`);
      }
      throw err;
    }
  }

  throw new Error(`Exceeded maximum redirect limit (${maxRedirects}).`);
}

/**
 * Detects frontend framework based on HTML signatures and script paths.
 */
export function detectFramework(html: string, scriptUrls: string[]): string {
  if (html.includes('id="__NEXT_DATA__"') || scriptUrls.some(s => s.includes('/_next/'))) {
    return 'Next.js';
  }
  if (html.includes('window.__remixContext') || scriptUrls.some(s => s.includes('/build/entry.client-'))) {
    return 'Remix';
  }
  if (html.includes('__NUXT__') || scriptUrls.some(s => s.includes('/_nuxt/'))) {
    return 'Nuxt';
  }
  if (html.includes('id="root"') && scriptUrls.some(s => s.includes('/assets/index-') || s.includes('@vite/client'))) {
    return 'Vite';
  }
  return 'Generic Web App';
}

/**
 * Master Scanner Orchestrator:
 * Executes the complete passive inspection flow across headers, bundles, secrets, and artifacts.
 */
export async function executePassiveScan(
  targetUrl: string,
  options: OrchestratorOptions = {}
): Promise<{
  findings: Finding[];
  scannedAssets: ScannedAsset[];
  frameworkDetected: string;
  resolvedIp: string;
}> {
  const findings: Finding[] = [];
  const scannedAssets: ScannedAsset[] = [];
  let totalBytes = 0;

  const maxScripts = options.maxScripts ?? DEFAULT_MAX_SCRIPTS;
  const maxBytes = options.maxTotalBytes ?? DEFAULT_MAX_BYTES;

  // Step 1: Initial SSRF check on target URL
  options.onProgress?.({
    step: 'resolving_ssrf',
    message: 'Validating DNS resolution and enforcing SSRF boundary...',
    timestamp: Date.now(),
    progressPercent: 15
  });

  const ssrfResult = await validateUrlForSSRF(targetUrl);
  if (!ssrfResult.allowed) {
    throw new Error(ssrfResult.error || 'Target blocked by SSRF Guard.');
  }

  const resolvedIp = ssrfResult.resolvedIp || 'Unknown';

  // Step 2: Fetch Root HTML & Analyze Headers
  options.onProgress?.({
    step: 'fetching_headers',
    message: 'Inspecting HTTP response headers and Set-Cookie directives...',
    timestamp: Date.now(),
    progressPercent: 30
  });

  const rootFetch = await safeFetch(targetUrl, options.perRequestTimeoutMs);
  totalBytes += Buffer.byteLength(rootFetch.body, 'utf8');

  scannedAssets.push({
    url: rootFetch.finalUrl,
    sizeBytes: Buffer.byteLength(rootFetch.body, 'utf8'),
    type: 'html',
    status: rootFetch.status
  });

  // Run Module 1: Headers & Cookies
  const headerFindings = analyzeHeadersAndCookies({
    url: rootFetch.finalUrl,
    headers: rootFetch.headers
  });
  findings.push(...headerFindings);

  // Step 3: Discover Script Bundles in HTML
  options.onProgress?.({
    step: 'discovering_scripts',
    message: 'Parsing HTML structure to discover client JavaScript bundles...',
    timestamp: Date.now(),
    progressPercent: 45
  });

  const $ = cheerio.load(rootFetch.body);
  const targetParsedUrl = new URL(rootFetch.finalUrl);
  const discoveredScriptUrls: string[] = [];

  $('script[src]').each((_, el) => {
    const src = $(el).attr('src');
    if (!src) return;

    try {
      const fullUrl = new URL(src, rootFetch.finalUrl).toString();
      const parsedFull = new URL(fullUrl);

      // Only inspect scripts from same origin or standard app asset subpaths
      if (parsedFull.origin === targetParsedUrl.origin) {
        if (!discoveredScriptUrls.includes(fullUrl)) {
          discoveredScriptUrls.push(fullUrl);
        }
      }
    } catch {
      // Ignore invalid script src attributes
    }
  });

  const frameworkDetected = detectFramework(rootFetch.body, discoveredScriptUrls);

  // Step 4: Download & Inspect JavaScript Bundles
  options.onProgress?.({
    step: 'analyzing_secrets',
    message: `Inspecting ${Math.min(discoveredScriptUrls.length, maxScripts)} client script bundles for secrets and source maps...`,
    timestamp: Date.now(),
    progressPercent: 65
  });

  const scriptSlice = discoveredScriptUrls.slice(0, maxScripts);
  const sourceMapUrlsToCheck: string[] = [];

  for (const scriptUrl of scriptSlice) {
    if (totalBytes >= maxBytes) break;

    try {
      const scriptRes = await safeFetch(scriptUrl, options.perRequestTimeoutMs);
      const scriptBytes = Buffer.byteLength(scriptRes.body, 'utf8');
      totalBytes += scriptBytes;

      scannedAssets.push({
        url: scriptUrl,
        sizeBytes: scriptBytes,
        type: 'script',
        status: scriptRes.status
      });

      // Run Module 2: Secrets & BaaS Disambiguation
      const secretFindings = scanSourceForSecrets(scriptRes.body, scriptUrl);
      findings.push(...secretFindings);

      // Check for source map reference in the script
      const mapMatch = scriptRes.body.match(/\/\/#\s*sourceMappingURL=([^\s]+)/);
      if (mapMatch && mapMatch[1]) {
        try {
          const mapFullUrl = new URL(mapMatch[1], scriptUrl).toString();
          if (!sourceMapUrlsToCheck.includes(mapFullUrl)) {
            sourceMapUrlsToCheck.push(mapFullUrl);
          }
        } catch {
          // Ignore invalid map url
        }
      }

    } catch {
      // Individual script fetch failure should not abort the entire scan
    }
  }

  // Step 5: Check Build Artifacts & Source Maps
  options.onProgress?.({
    step: 'verifying_artifacts',
    message: 'Checking for exposed production artifacts (.env, .git, source maps)...',
    timestamp: Date.now(),
    progressPercent: 85
  });

  const artifactPaths = ['/.env', '/.git/config', '/swagger.json'];
  const baseOrigin = targetParsedUrl.origin;

  for (const path of artifactPaths) {
    if (totalBytes >= maxBytes) break;

    const checkUrl = `${baseOrigin}${path}`;
    try {
      const artRes = await safeFetch(checkUrl, options.perRequestTimeoutMs);
      const artBytes = Buffer.byteLength(artRes.body, 'utf8');
      totalBytes += artBytes;

      const contentType = typeof artRes.headers['content-type'] === 'string'
        ? artRes.headers['content-type']
        : undefined;

      const artFinding = analyzeArtifactResponse(checkUrl, artRes.status, artRes.body, contentType);
      if (artFinding) {
        findings.push(artFinding);
      }
    } catch {
      // Path check failure (e.g. 404 connection drop) is normal
    }
  }

  // Check discovered source maps (capped at top 3)
  for (const mapUrl of sourceMapUrlsToCheck.slice(0, 3)) {
    if (totalBytes >= maxBytes) break;

    try {
      const mapRes = await safeFetch(mapUrl, options.perRequestTimeoutMs);
      const contentType = typeof mapRes.headers['content-type'] === 'string'
        ? mapRes.headers['content-type']
        : undefined;

      const mapFinding = analyzeArtifactResponse(mapUrl, mapRes.status, mapRes.body, contentType);
      if (mapFinding) {
        findings.push(mapFinding);
      }
    } catch {
      // Map check failure is normal
    }
  }

  options.onProgress?.({
    step: 'completed',
    message: 'Passive audit complete. Finalizing security scorecard...',
    timestamp: Date.now(),
    progressPercent: 100
  });

  return {
    findings,
    scannedAssets,
    frameworkDetected,
    resolvedIp,
  };
}
