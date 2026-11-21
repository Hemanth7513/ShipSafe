import * as cheerio from 'cheerio';
import { validateUrlForSSRF } from './ssrf/guard';
import { safeFetch } from './fetcher/client';
import { analyzeHeadersAndCookies } from './analyzers/headers';
import { scanSourceForSecrets } from './analyzers/bundles';
import { analyzeArtifactResponse } from './analyzers/artifacts';
import { calculateScoreAndGrade } from './scoring/engine';
import { Finding, ScannedAsset, ScanProgressEvent, ScanResult } from '@/lib/types/scan';

export interface OrchestratorOptions {
  onProgress?: (event: ScanProgressEvent) => void;
  maxScripts?: number;
  maxTotalBytes?: number;
  perRequestTimeoutMs?: number;
  concurrency?: number;
}

const DEFAULT_MAX_SCRIPTS = 15;
const DEFAULT_MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const DEFAULT_CONCURRENCY = 4;

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
 * Pipeline runner: Orchestrates the passive security audit across all modules with batch parallelization.
 */
export async function runPassiveAudit(
  targetUrl: string,
  options: OrchestratorOptions = {}
): Promise<ScanResult> {
  const startTime = Date.now();
  const findings: Finding[] = [];
  const scannedAssets: ScannedAsset[] = [];
  let totalBytes = 0;

  const maxScripts = options.maxScripts ?? DEFAULT_MAX_SCRIPTS;
  const maxBytes = options.maxTotalBytes ?? DEFAULT_MAX_BYTES;
  const concurrency = options.concurrency ?? DEFAULT_CONCURRENCY;

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

  // Step 4: Download & Inspect JavaScript Bundles with concurrency batching
  options.onProgress?.({
    step: 'analyzing_secrets',
    message: `Inspecting ${Math.min(discoveredScriptUrls.length, maxScripts)} client script bundles for secrets and source maps...`,
    timestamp: Date.now(),
    progressPercent: 65
  });

  const scriptSlice = discoveredScriptUrls.slice(0, maxScripts);
  const sourceMapUrlsToCheck: string[] = [];

  for (let i = 0; i < scriptSlice.length; i += concurrency) {
    if (totalBytes >= maxBytes) break;

    const batch = scriptSlice.slice(i, i + concurrency);
    const batchResults = await Promise.allSettled(
      batch.map(url => safeFetch(url, options.perRequestTimeoutMs))
    );

    for (let j = 0; j < batch.length; j++) {
      if (totalBytes >= maxBytes) break;
      const result = batchResults[j];
      const scriptUrl = batch[j];

      if (result.status === 'fulfilled') {
        const scriptRes = result.value;
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
      }
    }
  }

  // Step 5: Check Build Artifacts & Source Maps in parallel
  options.onProgress?.({
    step: 'verifying_artifacts',
    message: 'Checking for exposed production artifacts (.env, .git, source maps)...',
    timestamp: Date.now(),
    progressPercent: 85
  });

  const artifactPaths = ['/.env', '/.git/config', '/swagger.json'];
  const baseOrigin = targetParsedUrl.origin;
  const artifactUrls = artifactPaths.map(path => `${baseOrigin}${path}`);

  if (totalBytes < maxBytes) {
    const artifactResults = await Promise.allSettled(
      artifactUrls.map(url => safeFetch(url, options.perRequestTimeoutMs))
    );

    for (let i = 0; i < artifactUrls.length; i++) {
      const checkUrl = artifactUrls[i];
      const res = artifactResults[i];

      if (res.status === 'fulfilled') {
        const artRes = res.value;
        const artBytes = Buffer.byteLength(artRes.body, 'utf8');
        totalBytes += artBytes;

        const contentType = typeof artRes.headers['content-type'] === 'string'
          ? artRes.headers['content-type']
          : undefined;

        const artFinding = analyzeArtifactResponse(checkUrl, artRes.status, artRes.body, contentType);
        if (artFinding) {
          findings.push(artFinding);
        }
      }
    }
  }

  // Check discovered source maps in parallel
  const mapsToCheck = sourceMapUrlsToCheck.slice(0, 3);
  if (mapsToCheck.length > 0 && totalBytes < maxBytes) {
    const mapResults = await Promise.allSettled(
      mapsToCheck.map(mapUrl => safeFetch(mapUrl, options.perRequestTimeoutMs))
    );

    for (let i = 0; i < mapsToCheck.length; i++) {
      const mapUrl = mapsToCheck[i];
      const res = mapResults[i];

      if (res.status === 'fulfilled') {
        const mapRes = res.value;
        const contentType = typeof mapRes.headers['content-type'] === 'string'
          ? mapRes.headers['content-type']
          : undefined;

        const mapFinding = analyzeArtifactResponse(mapUrl, mapRes.status, mapRes.body, contentType);
        if (mapFinding) {
          findings.push(mapFinding);
        }
      }
    }
  }

  options.onProgress?.({
    step: 'completed',
    message: 'Passive audit complete. Finalizing security scorecard...',
    timestamp: Date.now(),
    progressPercent: 100
  });

  const durationMs = Date.now() - startTime;
  const { overallScore, grade, severityCounts } = calculateScoreAndGrade(findings);

  return {
    scanId: `scan-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    targetUrl: rootFetch.finalUrl,
    targetHost: targetParsedUrl.hostname,
    resolvedIp,
    scannedAt: new Date().toISOString(),
    durationMs,
    overallScore,
    grade,
    severityCounts,
    findings,
    scannedAssets,
    frameworkDetected,
    isDemoTarget: false,
  };
}
