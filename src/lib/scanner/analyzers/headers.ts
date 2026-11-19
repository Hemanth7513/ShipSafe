import { Finding } from '@/lib/types/scan';

export interface HeaderAnalysisInput {
  url: string;
  headers: Record<string, string | string[] | undefined>;
}

function getHeaderValue(
  headers: Record<string, string | string[] | undefined>,
  name: string
): string | undefined {
  const target = name.toLowerCase();
  for (const [key, value] of Object.entries(headers)) {
    if (key.toLowerCase() === target) {
      if (Array.isArray(value)) return value.join(', ');
      return value;
    }
  }
  return undefined;
}

function getSetCookieHeaders(
  headers: Record<string, string | string[] | undefined>
): string[] {
  for (const [key, value] of Object.entries(headers)) {
    if (key.toLowerCase() === 'set-cookie') {
      if (Array.isArray(value)) return value;
      if (typeof value === 'string') return [value];
    }
  }
  return [];
}

/**
 * Analyzes HTTP response headers and cookies against OWASP Top 10 A05 & ASVS V14.
 */
export function analyzeHeadersAndCookies(input: HeaderAnalysisInput): Finding[] {
  const { url, headers } = input;
  const findings: Finding[] = [];
  const isHttps = url.toLowerCase().startsWith('https:');

  const csp = getHeaderValue(headers, 'content-security-policy');
  const hsts = getHeaderValue(headers, 'strict-transport-security');
  const xfo = getHeaderValue(headers, 'x-frame-options');
  const xcto = getHeaderValue(headers, 'x-content-type-options');
  const referrerPolicy = getHeaderValue(headers, 'referrer-policy');
  const xPoweredBy = getHeaderValue(headers, 'x-powered-by');
  const serverHeader = getHeaderValue(headers, 'server');
  const corsOrigin = getHeaderValue(headers, 'access-control-allow-origin');
  const corsCredentials = getHeaderValue(headers, 'access-control-allow-credentials');

  // 1. Content-Security-Policy (CSP)
  if (!csp) {
    findings.push({
      id: 'HDR-MISSING-CSP',
      category: 'headers',
      severity: 'medium',
      deduction: 12,
      title: 'Missing Content-Security-Policy (CSP)',
      owaspMapping: 'OWASP A05:2021 - Security Misconfiguration',
      impact: 'Without a Content-Security-Policy, the browser cannot restrict script execution origins, leaving the application vulnerable to Cross-Site Scripting (XSS) and malicious data injection.',
      remediationSummary: 'Add a Content-Security-Policy header in your web server or framework config restricting script, style, and iframe sources.',
      fixPrompt: `Add a robust Content-Security-Policy header to my Next.js (next.config.js) configuration.
The policy should allow self-hosted scripts, styles, and images, permit Google Fonts, and restrict iframe framing to self.`
    });
  } else {
    // Specifically inspect script execution directives (script-src or default-src)
    const scriptDirectiveMatch = csp.match(/(?:script-src|default-src)\s+([^;]+)/i);
    const scriptDirective = scriptDirectiveMatch ? scriptDirectiveMatch[1] : csp;

    if (
      scriptDirective.includes("'unsafe-inline'") &&
      !csp.includes('nonce-') &&
      !csp.includes('sha256-')
    ) {
      findings.push({
        id: 'HDR-WEAK-CSP-UNSAFE-INLINE',
        category: 'headers',
        severity: 'low',
        deduction: 5,
        title: 'Weak Content-Security-Policy (unsafe-inline in script-src)',
        owaspMapping: 'OWASP A05:2021 - Security Misconfiguration',
        impact: "Using 'unsafe-inline' in script-src without cryptographic nonces or hashes allows inline script injection, reducing CSP defense effectiveness against XSS.",
        remediationSummary: 'Migrate to strict nonce-based CSP or remove unsafe-inline from script-src directives.',
        maskedEvidence: csp.slice(0, 80) + '...',
        fixPrompt: `My CSP uses 'unsafe-inline' in script-src. Show me how to configure a nonce-based Content-Security-Policy in Next.js App Router middleware to eliminate 'unsafe-inline'.`
      });
    }
  }

  // 2. Strict-Transport-Security (HSTS) - Only for HTTPS
  if (isHttps) {
    if (!hsts) {
      findings.push({
        id: 'HDR-MISSING-HSTS',
        category: 'headers',
        severity: 'medium',
        deduction: 12,
        title: 'Missing Strict-Transport-Security (HSTS)',
        owaspMapping: 'OWASP A02:2021 - Cryptographic Failures',
        impact: 'Without HSTS, users are vulnerable to SSL-stripping and man-in-the-middle downgrade attacks when visiting via http:// before redirection.',
        remediationSummary: 'Set Strict-Transport-Security: max-age=63072000; includeSubDomains; preload.',
        fixPrompt: `Configure Strict-Transport-Security in my Next.js headers with a 2-year max-age, includeSubDomains, and preload flags.`
      });
    } else {
      const maxAgeMatch = hsts.match(/max-age=(\d+)/i);
      if (maxAgeMatch) {
        const maxAge = parseInt(maxAgeMatch[1], 10);
        if (maxAge < 10368000) {
          findings.push({
            id: 'HDR-SHORT-HSTS',
            category: 'headers',
            severity: 'low',
            deduction: 5,
            title: 'HSTS Duration is Too Short (< 120 days)',
            owaspMapping: 'OWASP A02:2021 - Cryptographic Failures',
            impact: 'HSTS with short duration does not provide persistent long-term protection against network downgrade attacks.',
            remediationSummary: 'Increase max-age to at least 31536000 (1 year) or 63072000 (2 years).',
            maskedEvidence: hsts,
            fixPrompt: `Update my Strict-Transport-Security header in Next.js to max-age=63072000; includeSubDomains; preload.`
          });
        }
      }
    }
  }

  // 3. X-Frame-Options (Clickjacking Protection)
  const hasCspFrameAncestors = csp && /frame-ancestors/i.test(csp);
  if (!xfo && !hasCspFrameAncestors) {
    findings.push({
      id: 'HDR-MISSING-FRAME-OPTIONS',
      category: 'headers',
      severity: 'medium',
      deduction: 10,
      title: 'Missing Anti-Clickjacking Protection (X-Frame-Options)',
      owaspMapping: 'OWASP A05:2021 - Security Misconfiguration',
      impact: 'Allows third-party websites to frame this app in an invisible iframe, enabling Clickjacking attacks where users are tricked into clicking sensitive buttons.',
      remediationSummary: "Add X-Frame-Options: DENY (or SAMEORIGIN), or frame-ancestors 'self' in CSP.",
      fixPrompt: `Add X-Frame-Options: DENY to my server response headers in Next.js next.config.js.`
    });
  }

  // 4. X-Content-Type-Options (MIME Sniffing)
  if (!xcto || xcto.toLowerCase() !== 'nosniff') {
    findings.push({
      id: 'HDR-MISSING-CONTENT-TYPE-OPTIONS',
      category: 'headers',
      severity: 'low',
      deduction: 5,
      title: 'Missing X-Content-Type-Options: nosniff',
      owaspMapping: 'OWASP A05:2021 - Security Misconfiguration',
      impact: 'Without nosniff, older browsers may attempt to MIME-sniff non-executable file types into executable scripts, enabling drive-by code execution.',
      remediationSummary: 'Add X-Content-Type-Options: nosniff header.',
      fixPrompt: `Configure X-Content-Type-Options: nosniff on all routes in my Next.js configuration.`
    });
  }

  // 5. Referrer-Policy
  if (!referrerPolicy) {
    findings.push({
      id: 'HDR-MISSING-REFERRER-POLICY',
      category: 'headers',
      severity: 'low',
      deduction: 5,
      title: 'Missing Referrer-Policy Header',
      owaspMapping: 'OWASP A05:2021 - Security Misconfiguration',
      impact: 'Full URLs including sensitive query parameters or internal IDs may be leaked to third-party domains when navigating outbound links.',
      remediationSummary: 'Add Referrer-Policy: strict-origin-when-cross-origin.',
      fixPrompt: `Add Referrer-Policy: strict-origin-when-cross-origin to my Next.js security headers.`
    });
  } else if (referrerPolicy.toLowerCase().includes('unsafe-url')) {
    findings.push({
      id: 'HDR-UNSAFE-REFERRER-POLICY',
      category: 'headers',
      severity: 'low',
      deduction: 5,
      title: 'Insecure Referrer-Policy: unsafe-url',
      owaspMapping: 'OWASP A05:2021 - Security Misconfiguration',
      impact: 'Using unsafe-url leaks complete URLs (including sensitive paths and tokens) to third-party endpoints.',
      remediationSummary: 'Change Referrer-Policy to strict-origin-when-cross-origin or no-referrer.',
      maskedEvidence: referrerPolicy,
      fixPrompt: `Change my Referrer-Policy header to strict-origin-when-cross-origin.`
    });
  }

  // 6. Technology Disclosure Headers
  if (xPoweredBy) {
    findings.push({
      id: 'HDR-LEAK-POWERED-BY',
      category: 'headers',
      severity: 'low',
      deduction: 5,
      title: `Technology Disclosure via X-Powered-By: ${xPoweredBy}`,
      owaspMapping: 'OWASP A05:2021 - Security Misconfiguration',
      impact: 'Explicitly discloses underlying backend frameworks (e.g. Express, Next.js), helping attackers target known version-specific exploits.',
      remediationSummary: 'Disable poweredByHeader: false in your server/framework configuration.',
      maskedEvidence: xPoweredBy,
      fixPrompt: `In my Next.js next.config.js, disable the X-Powered-By header by setting poweredByHeader: false.`
    });
  }

  if (serverHeader && /[0-9]+\.[0-9]+/i.test(serverHeader)) {
    findings.push({
      id: 'HDR-VERBOSE-SERVER-BANNER',
      category: 'headers',
      severity: 'low',
      deduction: 5,
      title: `Verbose Server Version Banner: ${serverHeader}`,
      owaspMapping: 'OWASP A05:2021 - Security Misconfiguration',
      impact: 'Exposes exact web server software versions, allowing attackers to check vulnerability databases (CVEs) for targeted exploits.',
      remediationSummary: 'Configure web server to suppress version details (e.g. server_tokens off).',
      maskedEvidence: serverHeader,
      fixPrompt: `How do I suppress verbose server version numbers from my web server response headers?`
    });
  }

  // 7. CORS Configuration
  if (corsOrigin === '*' && corsCredentials?.toLowerCase() === 'true') {
    findings.push({
      id: 'CORS-WILDCARD-WITH-CREDENTIALS',
      category: 'cors',
      severity: 'high',
      deduction: 25,
      title: 'Dangerous CORS: Wildcard Origin Combined with Credentials',
      owaspMapping: 'OWASP A01:2021 - Broken Access Control',
      impact: 'Allowing all origins (*) while allowing credentials (true) enables malicious third-party websites to make authenticated requests and read sensitive user sessions.',
      remediationSummary: 'Specify explicit trusted origins instead of wildcard * when allowing credentials.',
      fixPrompt: `My CORS configuration permits Access-Control-Allow-Origin: * alongside Allow-Credentials: true.
Fix this in my API route middleware by checking against a strict whitelist of allowed domains.`
    });
  }

  // 8. Cookie Hygiene (Set-Cookie analysis)
  const setCookies = getSetCookieHeaders(headers);
  for (const cookieStr of setCookies) {
    const cookieNameMatch = cookieStr.match(/^([^=;]+)=/);
    const cookieName = cookieNameMatch ? cookieNameMatch[1].trim() : 'Cookie';
    const lowerCookie = cookieStr.toLowerCase();

    const isAuthCookie = /(sess|token|auth|jwt|sid|key)/i.test(cookieName);

    if (isAuthCookie && !lowerCookie.includes('httponly')) {
      findings.push({
        id: `COOKIE-MISSING-HTTPONLY-${cookieName.toUpperCase()}`,
        category: 'cookies',
        severity: 'high',
        deduction: 25,
        title: `Auth Cookie "${cookieName}" Missing HttpOnly Flag`,
        owaspMapping: 'OWASP ASVS V3.4 - Cookie Architecture',
        impact: `Because "${cookieName}" lacks the HttpOnly directive, any client-side JavaScript or XSS vulnerability can read this authentication token and hijack the user session.`,
        remediationSummary: 'Add the HttpOnly directive to all session and authentication cookies.',
        fixPrompt: `Ensure the cookie "${cookieName}" is set with httpOnly: true, secure: true, and sameSite: 'lax' (or 'strict') in my Next.js / server cookie settings.`
      });
    }

    if (isHttps && !lowerCookie.includes('secure')) {
      findings.push({
        id: `COOKIE-MISSING-SECURE-${cookieName.toUpperCase()}`,
        category: 'cookies',
        severity: 'medium',
        deduction: 10,
        title: `Cookie "${cookieName}" Missing Secure Flag on HTTPS`,
        owaspMapping: 'OWASP ASVS V3.4 - Cookie Architecture',
        impact: 'Cookies without the Secure flag can be transmitted in cleartext over unencrypted HTTP, risking interception.',
        remediationSummary: 'Add the Secure flag to all cookies served over HTTPS.',
        fixPrompt: `Ensure my cookie "${cookieName}" has secure: true enabled in production.`
      });
    }

    if (!lowerCookie.includes('samesite')) {
      findings.push({
        id: `COOKIE-MISSING-SAMESITE-${cookieName.toUpperCase()}`,
        category: 'cookies',
        severity: 'medium',
        deduction: 10,
        title: `Cookie "${cookieName}" Missing SameSite Attribute`,
        owaspMapping: 'OWASP ASVS V3.4 - Cookie Architecture',
        impact: 'Cookies without SameSite flags may be sent in cross-site requests, exposing the application to Cross-Site Request Forgery (CSRF).',
        remediationSummary: 'Add SameSite=Lax or SameSite=Strict to cookie directives.',
        fixPrompt: `Set sameSite: 'lax' on the "${cookieName}" cookie in my application.`
      });
    }
  }

  return findings;
}
