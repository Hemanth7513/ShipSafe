/**
 * Shannon Information Entropy & Secret Masking Utilities
 * Used to distinguish high-randomness cryptographic secrets from code identifiers,
 * CSS hash chunks, and dictionary strings.
 */

/**
 * Calculates the Shannon Information Entropy H(X) of a string:
 * H(X) = -sum( P(x_i) * log2(P(x_i)) )
 * Returns value typically between 0.0 (uniform string) and ~6.0 (high randomness).
 */
export function calculateShannonEntropy(str: string): number {
  if (!str || str.length <= 1) return 0.0;

  const len = str.length;
  const frequencies = new Map<string, number>();

  for (let i = 0; i < len; i++) {
    const char = str[i];
    frequencies.set(char, (frequencies.get(char) || 0) + 1);
  }

  let entropy = 0.0;
  frequencies.forEach((count) => {
    const p = count / len;
    entropy -= p * Math.log2(p);
  });

  return entropy;
}

/**
 * Checks whether a candidate string contains a diverse character set
 * typical of generated cryptographic tokens (e.g., both letters AND numbers).
 * Natural language identifiers (e.g. "handleSubmitOnClickWithParams") only use letters.
 */
export function hasCryptographicCharacterSet(str: string): boolean {
  const hasLetters = /[a-zA-Z]/.test(str);
  const hasDigits = /[0-9]/.test(str);
  return hasLetters && hasDigits;
}

const KNOWN_PLACEHOLDERS = new Set([
  'your_api_key_here',
  'your_secret_key_here',
  'insert_your_key_here',
  'replace_with_your_key',
  'example_api_key',
  'pk_test_sample',
  'sk_test_sample',
  'your-project-id',
  'your-anon-key',
  'your-service-role-key',
]);

/**
 * Checks whether a candidate secret is an obvious documentation or test placeholder.
 */
export function isPlaceholder(str: string): boolean {
  const lower = str.toLowerCase();
  
  if (KNOWN_PLACEHOLDERS.has(lower)) return true;
  
  // Repetitive character strings (e.g., xxxxxxxx, 00000000, 12345678)
  if (/^([a-z0-9])\1{7,}$/i.test(str)) return true;

  // Obvious placeholder keywords
  if (
    lower.includes('placeholder') ||
    lower.includes('your_key') ||
    lower.includes('replace_me') ||
    lower.includes('insert_key') ||
    lower.includes('example_key')
  ) {
    return true;
  }

  return false;
}

/**
 * Securely masks a detected secret in memory so the raw sensitive credential
 * is never logged, stored in databases, or rendered directly in the UI.
 *
 * Example: 'sk_test_••••••••••••9a2f'
 */
export function maskSecret(secret: string): string {
  if (!secret) return '';

  const len = secret.length;

  if (len <= 8) {
    return '••••••••';
  }

  // Preserve standard known prefix if present (e.g., sk_live_, sk-proj-, ghp_)
  const prefixMatch = secret.match(/^(sk_live_|rk_live_|whsec_|sk-proj-|sk-ant-|ghp_|AKIA)/);
  const prefixLen = prefixMatch ? prefixMatch[0].length : Math.min(6, Math.floor(len / 4));
  const suffixLen = Math.min(4, Math.floor(len / 6));

  const prefix = secret.slice(0, prefixLen);
  const suffix = secret.slice(-suffixLen);

  return `${prefix}••••••••••••${suffix}`;
}

/**
 * Safely extracts candidate string tokens from raw JavaScript bundle text.
 * Avoids ReDoS by tokenizing on common delimiters (quotes, semicolons, whitespace, braces)
 * before testing candidate strings against regexes and entropy filters.
 */
export function extractCandidateTokens(
  source: string,
  minLen: number = 20,
  maxLen: number = 200
): string[] {
  if (!source) return [];

  // Match string literals enclosed in single quotes, double quotes, or backticks
  const candidates: string[] = [];
  const stringRegex = /(?:["'`])([A-Za-z0-9_\-\.\/+=]{20,200})(?:["'`])/g;

  let match: RegExpExecArray | null;
  while ((match = stringRegex.exec(source)) !== null) {
    const token = match[1];
    if (token.length >= minLen && token.length <= maxLen) {
      candidates.push(token);
    }
  }

  return candidates;
}
