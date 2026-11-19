/**
 * In-memory secret masking & placeholder detection utilities.
 */

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
  
  // Repetitive character strings (e.g. xxxxxxxx, 00000000)
  if (/^([a-z0-9])\1{7,}$/i.test(str)) return true;

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
 * Securely masks a detected secret in memory.
 */
export function maskSecret(secret: string): string {
  if (!secret) return '';

  const len = secret.length;
  if (len <= 8) {
    return '••••••••';
  }

  const prefixMatch = secret.match(/^(sk_live_|rk_live_|whsec_|sk-proj-|sk-ant-|ghp_|AKIA)/);
  const prefixLen = prefixMatch ? prefixMatch[0].length : Math.min(6, Math.floor(len / 4));
  const suffixLen = Math.min(4, Math.floor(len / 6));

  const prefix = secret.slice(0, prefixLen);
  const suffix = secret.slice(-suffixLen);

  return `${prefix}••••••••••••${suffix}`;
}
