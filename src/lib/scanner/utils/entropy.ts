/**
 * Shannon Information Entropy & Token Extraction Primitives
 */

/**
 * Calculates the Shannon Information Entropy H(X) of a string:
 * H(X) = -sum( P(x_i) * log2(P(x_i)) )
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
 * Checks whether a candidate string contains diverse character sets
 * (both letters AND digits) typical of generated cryptographic secrets.
 */
export function hasCryptographicCharacterSet(str: string): boolean {
  const hasLetters = /[a-zA-Z]/.test(str);
  const hasDigits = /[0-9]/.test(str);
  return hasLetters && hasDigits;
}

/**
 * Safely extracts candidate string literals from JavaScript text.
 */
export function extractCandidateTokens(
  source: string,
  minLen = 20,
  maxLen = 200
): string[] {
  if (!source) return [];

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
