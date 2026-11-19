import { 
  calculateShannonEntropy, 
  extractCandidateTokens,
  hasCryptographicCharacterSet
} from '../src/lib/scanner/utils/entropy';
import { 
  maskSecret, 
  isPlaceholder 
} from '../src/lib/scanner/utils/redact';

function runEntropyTests() {
  console.log('🧪 Starting Shannon Entropy & Masking Defensive Test Suite...\n');

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

  // 1. Uniform / Low-entropy strings & Charset Filtering
  const zeroEntropy = calculateShannonEntropy('AAAAAAAAAAAAAA');
  assert(zeroEntropy === 0.0, 'Calculates 0.0 entropy for repetitive characters');

  // Natural language identifiers lack mixed digits+letters
  const identifier = 'handleSubmitOnClickWithParams';
  assert(
    !hasCryptographicCharacterSet(identifier),
    'Filters out code identifiers lacking mixed alphanumeric characters'
  );

  // 2. High-entropy cryptographic secrets
  const stripeSecret = ['sk', 'live', '51M0abc89XYZ234019283746501928374'].join('_');
  const stripeEntropy = calculateShannonEntropy(stripeSecret);
  assert(stripeEntropy >= 3.6, `Stripe secret entropy >= 3.6 (got ${stripeEntropy.toFixed(2)})`);

  const randomToken = 'x8K9m2PqL0wJ3n4V5t6Y7u8I9o0P1a2S3d4F';
  const tokenEntropy = calculateShannonEntropy(randomToken);
  assert(tokenEntropy >= 4.0, `Random token entropy >= 4.0 (got ${tokenEntropy.toFixed(2)})`);

  // 3. Masking Verification
  const maskedStripe = maskSecret(stripeSecret);
  assert(
    maskedStripe.startsWith('sk_live_') && maskedStripe.endsWith('8374') && maskedStripe.includes('••••••••••••'),
    'Masks Stripe key preserving prefix and suffix',
    `Got: ${maskedStripe}`
  );
  assert(!maskedStripe.includes('51M0abc'), 'Confirms middle secret body is completely redacted');

  const openAiPrefix = ['sk', 'proj'].join('-');
  const maskedOpenAI = maskSecret(`${openAiPrefix}-a1B2c3D4e5F6g7H8i9J0k1L2m3N4o5P6q7R8s9T0u1V2w3X4y5Z`);
  assert(
    maskedOpenAI.startsWith('sk-proj-') && maskedOpenAI.includes('••••••••••••'),
    'Masks OpenAI Project key preserving sk-proj- prefix',
    `Got: ${maskedOpenAI}`
  );

  // 4. Placeholder Detection
  assert(isPlaceholder('YOUR_API_KEY_HERE'), 'Identifies uppercase YOUR_API_KEY_HERE as placeholder');
  assert(isPlaceholder('insert_your_key_here'), 'Identifies insert_your_key_here as placeholder');
  assert(isPlaceholder('0000000000000000'), 'Identifies repetitive zeros as placeholder');
  assert(!isPlaceholder(stripeSecret), 'Does not classify genuine key as placeholder');

  // 5. Candidate Extraction from JS bundle snippet
  const mockBundle = `
    const a = "handleSubmitOnClick";
    const key = "${stripeSecret}";
    const b = "short";
    console.log(key);
  `;
  const candidates = extractCandidateTokens(mockBundle);
  assert(candidates.includes(stripeSecret), 'Extracts candidate key from source text');
  assert(!candidates.includes('short'), 'Filters out tokens shorter than min length');

  console.log(`\n========================================`);
  console.log(`Total: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runEntropyTests();
