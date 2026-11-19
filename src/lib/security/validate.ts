/**
 * Input validation schema & syntax checking for scan targets.
 */

export interface ValidationResult {
  valid: boolean;
  normalizedUrl?: string;
  error?: string;
}

/**
 * Validates target URL syntax and ensures user confirmed audit permission.
 */
export function validateScanRequest(
  rawUrl: unknown,
  confirmedOwnership: unknown
): ValidationResult {
  if (!rawUrl || typeof rawUrl !== 'string' || !rawUrl.trim()) {
    return { valid: false, error: 'A target URL is required.' };
  }

  if (!confirmedOwnership) {
    return {
      valid: false,
      error: 'You must check the authorization box confirming you have explicit permission to audit this domain.',
    };
  }

  let trimmed = rawUrl.trim();
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    trimmed = `https://${trimmed}`;
  }

  try {
    const parsed = new URL(trimmed);

    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return { valid: false, error: 'Only http:// and https:// URLs are permitted.' };
    }

    if (!parsed.hostname || !parsed.hostname.includes('.')) {
      if (parsed.hostname !== 'localhost' && !parsed.hostname.endsWith('.internal')) {
        return { valid: false, error: 'Please enter a valid domain name (e.g., example.com).' };
      }
    }

    if (parsed.port && parsed.port !== '80' && parsed.port !== '443') {
      return { valid: false, error: 'Scans are restricted to standard ports 80 and 443.' };
    }

    return { valid: true, normalizedUrl: parsed.toString() };
  } catch {
    return { valid: false, error: 'Malformed URL provided. Please check the URL syntax.' };
  }
}
