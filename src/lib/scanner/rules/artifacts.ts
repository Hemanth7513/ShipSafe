import { Finding } from '@/lib/types/scanner';

/**
 * Checks whether the response is an HTML page (such as an SPA catch-all 404/200).
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

/**
 * Validates whether a response body matches a genuine .env file structure.
 * Must have at least 2 distinct KEY=VALUE assignments and NOT be HTML.
 */
export function verifyDotEnvSignature(body: string, contentType?: string): boolean {
  if (!body || isHtmlResponse(contentType, body)) return false;

  const matches = body.match(/^\s*[A-Za-z0-9_]{3,40}\s*=\s*['"]?[^\r\n]+/gm);
  return matches !== null && matches.length >= 2;
}

/**
 * Validates whether a response body matches a genuine Git repository configuration.
 */
export function verifyGitConfigSignature(body: string, contentType?: string): boolean {
  if (!body || isHtmlResponse(contentType, body)) return false;

  return body.includes('[core]') && body.includes('repositoryformatversion');
}

/**
 * Validates whether a response body matches a public OpenAPI/Swagger definition.
 */
export function verifySwaggerSignature(body: string, contentType?: string): boolean {
  if (!body || isHtmlResponse(contentType, body)) return false;

  try {
    const json = JSON.parse(body);
    return typeof json === 'object' && json !== null && ('openapi' in json || 'swagger' in json);
  } catch {
    return false;
  }
}

/**
 * Validates whether a response body is a valid production source map (.js.map).
 */
export function verifySourceMapSignature(body: string, contentType?: string): boolean {
  if (!body || isHtmlResponse(contentType, body)) return false;

  try {
    const json = JSON.parse(body);
    return (
      typeof json === 'object' &&
      json !== null &&
      json.version === 3 &&
      Array.isArray(json.sources) &&
      json.sources.length > 0
    );
  } catch {
    return false;
  }
}

/**
 * Analyzes responses from targeted polite artifact checks.
 */
export function analyzeArtifactResponse(
  checkedPath: string,
  statusCode: number,
  body: string,
  contentType?: string
): Finding | null {
  // Only 200 OK responses can represent active leaks
  if (statusCode !== 200 || !body) return null;

  // SPA catch-all filter: if it's HTML, it's not a leaked raw artifact
  if (isHtmlResponse(contentType, body)) return null;

  // 1. Exposed /.env check
  if (checkedPath.endsWith('/.env') || checkedPath.endsWith('/.env.local')) {
    if (verifyDotEnvSignature(body, contentType)) {
      return {
        id: 'ARTIFACT-EXPOSED-DOTENV',
        category: 'artifacts',
        severity: 'critical',
        deduction: 40,
        title: 'Publicly Accessible Production .env File',
        owaspMapping: 'OWASP A05:2021 - Security Misconfiguration',
        impact: 'Your production environment file is publicly downloadable over HTTP. Anyone can read your database connection strings, JWT signing keys, and third-party API credentials.',
        remediationSummary: 'Immediately remove the .env file from your public web root and rotate all secrets contained inside it.',
        maskedEvidence: body.split('\n').slice(0, 3).map(line => line.split('=')[0] + '=••••••••••••').join('\n'),
        assetUrl: checkedPath,
        fixPrompt: `My production .env file is publicly accessible over HTTP at ${checkedPath}.
Please help me:
1. Show me how to configure Next.js or my web server (nginx/Vercel) so that dotfiles (.env) are strictly blocked from being served statically.
2. Provide a checklist of environment variables that must be rotated immediately.`
      };
    }
  }

  // 2. Exposed /.git/config check
  if (checkedPath.endsWith('/.git/config')) {
    if (verifyGitConfigSignature(body, contentType)) {
      return {
        id: 'ARTIFACT-EXPOSED-GIT-CONFIG',
        category: 'artifacts',
        severity: 'critical',
        deduction: 40,
        title: 'Publicly Accessible .git/config Repository Metadata',
        owaspMapping: 'OWASP A05:2021 - Security Misconfiguration',
        impact: 'Your .git metadata directory is publicly exposed. Attackers can reconstruct your entire private source code repository, commit history, and internal developer notes.',
        remediationSummary: 'Configure your web server to block access to all /.git paths immediately.',
        maskedEvidence: '[core]\n\trepositoryformatversion = 0\n\t••••••••••••',
        assetUrl: checkedPath,
        fixPrompt: `My .git folder is exposed at ${checkedPath}. 
Provide web server rules (for Vercel, Netlify, or Nginx) to permanently block access to all /.git/* directories and hidden files.`
      };
    }
  }

  // 3. Exposed Swagger / OpenAPI JSON check
  if (checkedPath.endsWith('/swagger.json') || checkedPath.endsWith('/api-docs')) {
    if (verifySwaggerSignature(body, contentType)) {
      return {
        id: 'ARTIFACT-EXPOSED-SWAGGER-DOCS',
        category: 'artifacts',
        severity: 'high',
        deduction: 25,
        title: 'Unauthenticated Public OpenAPI / Swagger Specification',
        owaspMapping: 'OWASP A01:2021 - Broken Access Control',
        impact: 'Exposes your complete internal API route architecture, schema definitions, parameter types, and administrative endpoints without authentication.',
        remediationSummary: 'Restrict API documentation routes behind developer authentication or disable them in production builds.',
        maskedEvidence: body.slice(0, 100) + '...',
        assetUrl: checkedPath,
        fixPrompt: `My OpenAPI / Swagger documentation is publicly accessible at ${checkedPath} in production.
Show me how to disable Swagger documentation in production builds or restrict it behind authentication middleware.`
      };
    }
  }

  // 4. Exposed Source Map check
  if (checkedPath.endsWith('.map')) {
    if (verifySourceMapSignature(body, contentType)) {
      return {
        id: 'ARTIFACT-EXPOSED-SOURCE-MAP',
        category: 'artifacts',
        severity: 'high',
        deduction: 25,
        title: 'Exposed Production Source Map (.js.map)',
        owaspMapping: 'OWASP A05:2021 - Security Misconfiguration',
        impact: 'Production source maps allow any user or competitor to reverse-engineer and inspect your original unminified TypeScript/React source code, internal comments, and hidden routes.',
        remediationSummary: 'Disable production source maps in your bundler (e.g. productionBrowserSourceMaps: false in Next.js).',
        maskedEvidence: `{"version":3,"sources":["..."]}`,
        assetUrl: checkedPath,
        fixPrompt: `My production source maps (.js.map) are publicly downloadable at ${checkedPath}.
How do I disable client source maps in my Next.js (next.config.js) production build (set productionBrowserSourceMaps: false)?`
      };
    }
  }

  return null;
}
