import { validateUrlForSSRF } from '../ssrf/guard';

export interface FetchResult {
  status: number;
  headers: Record<string, string | string[]>;
  body: string;
  finalUrl: string;
}

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

// Re-export framework detection & master orchestrator
export { detectFramework, runPassiveAudit as executePassiveScan } from '../orchestrator';
