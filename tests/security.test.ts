import { validateScanRequest } from '../src/lib/security/validate';
import { checkRateLimit, getClientIp, pruneExpiredEntries, resetRateLimits } from '../src/lib/security/rate-limit';

function runSecurityTests() {
  console.log('🧪 Starting Security & Rate-Limiter Defensive Test Suite...\n');

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

  // 1. Validation Schema Tests
  const missingUrl = validateScanRequest('', true);
  assert(!missingUrl.valid, 'Rejects empty URL');

  const missingOwnership = validateScanRequest('https://example.com', false);
  assert(!missingOwnership.valid, 'Rejects scan without ownership confirmation');

  const invalidScheme = validateScanRequest('ftp://example.com', true);
  assert(!invalidScheme.valid, 'Rejects non-HTTP(S) protocol');

  const disallowedPort = validateScanRequest('https://example.com:8443', true);
  assert(!disallowedPort.valid, 'Rejects non-standard port 8443');

  const validUrl = validateScanRequest('example.com', true);
  assert(validUrl.valid && validUrl.normalizedUrl === 'https://example.com/', 'Normalizes bare domain to https://');

  const demoSubstrUrl = validateScanRequest('https://democracynow.org', true);
  assert(demoSubstrUrl.valid && demoSubstrUrl.normalizedUrl === 'https://democracynow.org/', 'Validates domains containing demo substring as genuine targets');

  // 2. Rate Limiting Tests (10 scans per IP)
  resetRateLimits();
  const testIp = '198.51.100.99';
  let allowedCount = 0;

  for (let i = 0; i < 10; i++) {
    const res = checkRateLimit(testIp);
    if (res.allowed) allowedCount++;
  }
  assert(allowedCount === 10, 'Allows first 10 scans within rate limit window');

  const eleventhScan = checkRateLimit(testIp);
  assert(!eleventhScan.allowed, 'Blocks 11th scan exceeding rate limit cap');
  assert(eleventhScan.remaining === 0, 'Reports 0 remaining scans when capped');
  assert(eleventhScan.resetInSeconds > 0, 'Provides valid reset countdown in seconds');

  // 3. Memory leak & pruning test
  const pruned = pruneExpiredEntries(Date.now() + 2 * 60 * 60 * 1000); // 2 hours in the future
  assert(pruned >= 1, 'Prunes expired rate limit entries from memory');

  // 4. Client IP Extraction Tests (Trusted edge headers vs spoofable fallback)
  function createMockRequest(headers: Record<string, string>): any {
    return {
      headers: {
        get(name: string) {
          return headers[name.toLowerCase()] ?? null;
        }
      }
    };
  }

  const cfReq = createMockRequest({ 'cf-connecting-ip': '203.0.113.50', 'x-forwarded-for': '198.51.100.1' });
  assert(getClientIp(cfReq) === '203.0.113.50', 'Prioritizes cf-connecting-ip over x-forwarded-for');

  const realIpReq = createMockRequest({ 'x-real-ip': '198.51.100.75', 'x-forwarded-for': '1.2.3.4, 5.6.7.8' });
  assert(getClientIp(realIpReq) === '198.51.100.75', 'Prioritizes x-real-ip over x-forwarded-for');

  const xffReq = createMockRequest({ 'x-forwarded-for': '192.0.2.1, 10.0.0.1' });
  assert(getClientIp(xffReq) === '192.0.2.1', 'Safely extracts client IP from x-forwarded-for list');

  const defaultReq = createMockRequest({});
  assert(getClientIp(defaultReq) === '127.0.0.1', 'Falls back to 127.0.0.1 when no IP headers present');

  console.log(`\n========================================`);
  console.log(`Total: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runSecurityTests();
