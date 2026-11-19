import { validateUrlForSSRF, isPrivateIPv4, isPrivateIPv6 } from '../src/lib/scanner/ssrf/guard';

async function runSSRFTests() {
  console.log('🧪 Starting SSRF Guard Defensive Test Suite...\n');

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

  // 1. Direct IPv4 Check Tests
  assert(isPrivateIPv4('127.0.0.1'), 'Blocks 127.0.0.1 (Loopback)');
  assert(isPrivateIPv4('169.254.169.254'), 'Blocks 169.254.169.254 (Cloud Metadata)');
  assert(isPrivateIPv4('10.0.1.50'), 'Blocks 10.0.1.50 (Class A Private)');
  assert(isPrivateIPv4('172.20.10.2'), 'Blocks 172.20.10.2 (Class B Private)');
  assert(isPrivateIPv4('192.168.1.1'), 'Blocks 192.168.1.1 (Class C Private)');
  assert(isPrivateIPv4('0.0.0.0'), 'Blocks 0.0.0.0 (Unspecified)');
  assert(!isPrivateIPv4('93.184.216.34'), 'Allows 93.184.216.34 (Public IP)');
  assert(!isPrivateIPv4('1.1.1.1'), 'Allows 1.1.1.1 (Public IP)');

  // 2. Direct IPv6 Check Tests
  assert(isPrivateIPv6('::1'), 'Blocks ::1 (IPv6 Loopback)');
  assert(isPrivateIPv6('::'), 'Blocks :: (IPv6 Unspecified)');
  assert(isPrivateIPv6('::ffff:127.0.0.1'), 'Blocks ::ffff:127.0.0.1 (IPv4-mapped IPv6)');
  assert(isPrivateIPv6('::ffff:169.254.169.254'), 'Blocks ::ffff:169.254.169.254 (IPv4-mapped Metadata)');
  assert(isPrivateIPv6('fe80::1'), 'Blocks fe80::1 (Link-local IPv6)');
  assert(isPrivateIPv6('fc00::1'), 'Blocks fc00::1 (Unique Local IPv6)');

  // 3. Full URL Validation Tests
  const blockedUrls = [
    { url: 'http://localhost', reason: 'Localhost domain' },
    { url: 'http://localhost:3000', reason: 'Localhost with port' },
    { url: 'http://127.0.0.1', reason: 'Loopback IP literal' },
    { url: 'http://169.254.169.254', reason: 'AWS metadata IP literal' },
    { url: 'http://10.0.0.1', reason: 'Private network literal' },
    { url: 'http://[::1]', reason: 'IPv6 loopback URL' },
    { url: 'http://admin:secret@example.com', reason: 'Embedded credentials' },
    { url: 'ftp://example.com', reason: 'Non-HTTP protocol' },
    { url: 'http://example.com:22', reason: 'Disallowed SSH port 22' },
    { url: 'http://example.com:8080', reason: 'Disallowed port 8080' },
  ];

  for (const item of blockedUrls) {
    const res = await validateUrlForSSRF(item.url);
    assert(!res.allowed, `Blocks ${item.url}`, `Expected blocked: ${item.reason}, got error: ${res.error}`);
  }

  // 4. Allowed Public URL Test
  const publicRes = await validateUrlForSSRF('https://example.com');
  assert(publicRes.allowed, 'Allows public https://example.com', publicRes.error);

  console.log(`\n========================================`);
  console.log(`Total: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runSSRFTests().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
