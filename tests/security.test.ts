import { validateScanRequest } from '../src/lib/security/validate';
import { checkRateLimit } from '../src/lib/security/rate-limit';

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

  // 2. Rate Limiting Tests (10 scans per IP)
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

  console.log(`\n========================================`);
  console.log(`Total: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runSecurityTests();
