/**
 * Detects whether an HTTP response is an HTML page (such as an SPA catch-all 404/200).
 * Prevents false positive alarms when scanning for .env or .git/config on modern SPAs.
 */

export function isHtmlResponse(contentType?: string, body?: string): boolean {
  if (contentType && contentType.toLowerCase().includes('text/html')) {
    return true;
  }
  if (!body) return false;

  const trimmed = body.trim().slice(0, 500).toLowerCase();
  return (
    trimmed.startsWith('<!doctype html') ||
    trimmed.startsWith('<html') ||
    trimmed.includes('<head>') ||
    trimmed.includes('<div id="root">') ||
    trimmed.includes('<div id="__next">')
  );
}
