import { 
  scanSourceForSecrets, 
  decodeJwtPayload, 
  inspectSupabaseJwt 
} from '../src/lib/scanner/rules/secrets';

function runSecretsTests() {
  console.log('🧪 Starting BaaS & Secret Rules Defensive Test Suite...\n');

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

  // Helper to generate mock base64url JWT
  function createMockJwt(payload: Record<string, unknown>): string {
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signature = 'abcdefghijklmnopqrstuvwxyz0123456789_SIGNATURE';
    return `${header}.${body}.${signature}`;
  }

  // 1. Supabase JWT Disambiguation Tests
  const serviceRoleJwt = createMockJwt({
    iss: 'supabase',
    ref: 'project-xyz-123',
    role: 'service_role',
    iat: 1600000000,
    exp: 1900000000
  });

  const anonJwt = createMockJwt({
    iss: 'supabase',
    ref: 'project-xyz-123',
    role: 'anon',
    iat: 1600000000,
    exp: 1900000000
  });

  const serviceRoleFinding = inspectSupabaseJwt(serviceRoleJwt);
  assert(
    serviceRoleFinding !== null && serviceRoleFinding.severity === 'critical',
    'Identifies Supabase service_role JWT as CRITICAL severity'
  );
  assert(
    serviceRoleFinding?.deduction === 40,
    'Applies 40-point deduction to Supabase service_role leak'
  );

  const anonFinding = inspectSupabaseJwt(anonJwt);
  assert(
    anonFinding !== null && anonFinding.severity === 'info',
    'Identifies Supabase anon JWT as INFO severity (no false alert)'
  );
  assert(
    anonFinding?.deduction === 0,
    'Applies 0-point deduction to intended public anon key'
  );

  // 2. OpenAI Modern Project Key Detection
  const mockOpenAIKey = [
    'sk',
    'proj',
    '9A8b7C6d5E4f3G2h1I0jKlMnOpQrStUvWxYz_1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890abcdefghijklmnopqrstuvwxyz'
  ].join('-');
  const openAIBundle = `const aiClient = new OpenAI({ apiKey: "${mockOpenAIKey}" });`;
  const openAIFindings = scanSourceForSecrets(openAIBundle);
  assert(
    openAIFindings.some(f => f.id === 'SEC-OPENAI-PROJECT-KEY'),
    'Detects modern 150+ char OpenAI Project key'
  );
  assert(
    openAIFindings.find(f => f.id === 'SEC-OPENAI-PROJECT-KEY')?.severity === 'critical',
    'Assigns critical severity to leaked OpenAI Project key'
  );

  // 3. Stripe Key Disambiguation
  const mockStripeSecret = ['sk', 'live', '51M0abc89XYZ234019283746501928374'].join('_');
  const mockStripePublic = ['pk', 'live', '51M0abc89XYZ234019283746501928374'].join('_');
  const stripeBundle = `
    const stripeSec = "${mockStripeSecret}";
    const stripePub = "${mockStripePublic}";
  `;
  const stripeFindings = scanSourceForSecrets(stripeBundle);
  assert(
    stripeFindings.some(f => f.id === 'SEC-STRIPE-LIVE-SECRET' && f.severity === 'critical'),
    'Detects Stripe sk_live_ key as CRITICAL leak'
  );
  assert(
    stripeFindings.some(f => f.id === 'SEC-STRIPE-PUBLISHABLE' && f.severity === 'info'),
    'Detects Stripe pk_live_ key as INFO (Safe public client key)'
  );

  // 4. AWS Access Key Detection
  const awsBundle = `const s3 = new AWS.S3({ accessKeyId: "AKIAIOSFODNN7EXAMPLE" });`;
  const awsFindings = scanSourceForSecrets(awsBundle);
  assert(
    awsFindings.some(f => f.id === 'SEC-AWS-ACCESS-KEY' && f.severity === 'high'),
    'Detects AWS Access Key ID (AKIA...) as HIGH severity'
  );

  // 5. Placeholders are Ignored
  const placeholderBundle = `const key = "YOUR_API_KEY_HERE"; const s = "insert_your_key_here";`;
  const placeholderFindings = scanSourceForSecrets(placeholderBundle);
  assert(
    placeholderFindings.length === 0,
    'Ignores template placeholder keys with 0 findings generated'
  );

  // 6. Evidence Masking Verification
  const criticalFinding = openAIFindings.find(f => f.id === 'SEC-OPENAI-PROJECT-KEY');
  assert(
    criticalFinding?.maskedEvidence?.includes('••••••••••••') === true,
    'Ensures secret evidence is masked with bullets'
  );
  assert(
    !criticalFinding?.maskedEvidence?.includes('9A8b7C6d5E4f3G2h1I0jKlMnOpQrStUv'),
    'Ensures raw sensitive body is stripped from evidence'
  );

  console.log(`\n========================================`);
  console.log(`Total: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runSecretsTests();
