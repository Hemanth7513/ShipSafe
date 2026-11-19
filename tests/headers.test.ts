import { analyzeHeadersAndCookies } from '../src/lib/scanner/rules/headers';

function runHeadersTests() {
  console.log('🧪 Starting HTTP Headers & Cookie Hygiene Test Suite...\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName} ${detail ? `(${detail})` : ''}`);
      failed++;
    }
  }

  // 1. Completely Unhardened Target (Blank Headers)
  const blankFindings = analyzeHeadersAndCookies({
    url: 'https://vulnerable-startup.com',
    headers: {}
  });

  assert(
    blankFindings.some(f => f.id === 'HDR-MISSING-CSP'),
    'Flags missing Content-Security-Policy'
  );
  assert(
    blankFindings.some(f => f.id === 'HDR-MISSING-HSTS'),
    'Flags missing HSTS on HTTPS target'
  );
  assert(
    blankFindings.some(f => f.id === 'HDR-MISSING-FRAME-OPTIONS'),
    'Flags missing X-Frame-Options'
  );
  assert(
    blankFindings.some(f => f.id === 'HDR-MISSING-CONTENT-TYPE-OPTIONS'),
    'Flags missing X-Content-Type-Options: nosniff'
  );
  assert(
    blankFindings.some(f => f.id === 'HDR-MISSING-REFERRER-POLICY'),
    'Flags missing Referrer-Policy'
  );

  // 2. Fully Hardened Reference Target (Zero Findings)
  const hardenedFindings = analyzeHeadersAndCookies({
    url: 'https://hardened-app.com',
    headers: {
      'content-security-policy': "default-src 'self'; script-src 'self'; frame-ancestors 'self';",
      'strict-transport-security': 'max-age=63072000; includeSubDomains; preload',
      'x-frame-options': 'DENY',
      'x-content-type-options': 'nosniff',
      'referrer-policy': 'strict-origin-when-cross-origin'
    }
  });

  assert(
    hardenedFindings.length === 0,
    'Hardened site yields 0 header findings',
    `Got ${hardenedFindings.length} findings: ${hardenedFindings.map(f => f.id).join(', ')}`
  );

  // 3. Information Disclosure & Weak Configurations
  const leakFindings = analyzeHeadersAndCookies({
    url: 'https://leaky-app.com',
    headers: {
      'x-powered-by': 'Express',
      'server': 'Apache/2.4.41 (Ubuntu)',
      'content-security-policy': "default-src 'self' 'unsafe-inline';",
      'strict-transport-security': 'max-age=3600', // Short HSTS
      'x-content-type-options': 'nosniff',
      'referrer-policy': 'strict-origin-when-cross-origin',
      'x-frame-options': 'DENY'
    }
  });

  assert(
    leakFindings.some(f => f.id === 'HDR-LEAK-POWERED-BY'),
    'Flags X-Powered-By disclosure'
  );
  assert(
    leakFindings.some(f => f.id === 'HDR-VERBOSE-SERVER-BANNER'),
    'Flags verbose server version banner'
  );
  assert(
    leakFindings.some(f => f.id === 'HDR-WEAK-CSP-UNSAFE-INLINE'),
    'Flags weak CSP unsafe-inline directive'
  );
  assert(
    leakFindings.some(f => f.id === 'HDR-SHORT-HSTS'),
    'Flags HSTS duration under 120 days'
  );

  // 4. Dangerous CORS combination
  const corsFindings = analyzeHeadersAndCookies({
    url: 'https://cors-leak.com',
    headers: {
      'access-control-allow-origin': '*',
      'access-control-allow-credentials': 'true'
    }
  });

  assert(
    corsFindings.some(f => f.id === 'CORS-WILDCARD-WITH-CREDENTIALS' && f.severity === 'high'),
    'Flags CORS wildcard origin combined with credentials as HIGH severity'
  );

  // 5. Insecure Cookie Directives
  const cookieFindings = analyzeHeadersAndCookies({
    url: 'https://cookie-risk.com',
    headers: {
      'set-cookie': [
        'session_token=xyz123; Path=/', // Missing HttpOnly, Secure, SameSite
        'theme=dark; Path=/; Secure; SameSite=Lax' // Normal non-auth cookie
      ]
    }
  });

  assert(
    cookieFindings.some(f => f.id === 'COOKIE-MISSING-HTTPONLY-SESSION_TOKEN' && f.severity === 'high'),
    'Flags auth cookie missing HttpOnly as HIGH severity'
  );
  assert(
    cookieFindings.some(f => f.id === 'COOKIE-MISSING-SECURE-SESSION_TOKEN'),
    'Flags cookie missing Secure on HTTPS'
  );
  assert(
    cookieFindings.some(f => f.id === 'COOKIE-MISSING-SAMESITE-SESSION_TOKEN'),
    'Flags cookie missing SameSite directive'
  );

  console.log(`\n========================================`);
  console.log(`Total: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runHeadersTests();
