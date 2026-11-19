import { Finding } from '@/lib/types/scan';
import { SECRET_RULES } from '../rules/secrets';
import { calculateShannonEntropy, hasCryptographicCharacterSet, extractCandidateTokens } from '../utils/entropy';
import { maskSecret, isPlaceholder } from '../utils/redact';
import { inspectSupabaseJwt } from './baas';

/**
 * Scans a JavaScript source bundle text against the secret rules and BaaS inspector.
 */
export function scanSourceForSecrets(sourceCode: string, assetUrl?: string): Finding[] {
  if (!sourceCode) return [];

  const findings: Finding[] = [];
  const candidateTokens = extractCandidateTokens(sourceCode);
  const seenRuleIds = new Set<string>();

  // 1. Inspect tokens for JWTs (Supabase disambiguation)
  for (const token of candidateTokens) {
    if (/^eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(token)) {
      const supabaseFinding = inspectSupabaseJwt(token, assetUrl);
      if (supabaseFinding && !seenRuleIds.has(supabaseFinding.id)) {
        findings.push(supabaseFinding);
        seenRuleIds.add(supabaseFinding.id);
      }
    }
  }

  // 2. Inspect against curated Secret Rules
  for (const rule of SECRET_RULES) {
    if (seenRuleIds.has(rule.id)) continue;

    const match = sourceCode.match(rule.pattern);
    if (match) {
      const matchedStr = match[0];

      // Ignore known false-positive placeholders
      if (isPlaceholder(matchedStr)) continue;

      // Check entropy threshold if specified
      if (rule.minEntropy !== undefined) {
        const entropy = calculateShannonEntropy(matchedStr);
        if (entropy < rule.minEntropy) continue;
      }

      // Check mixed charset if specified
      if (rule.requiresMixedCharset && !hasCryptographicCharacterSet(matchedStr)) {
        continue;
      }

      findings.push({
        id: rule.id,
        category: 'secrets',
        severity: rule.severity,
        deduction: rule.deduction,
        title: rule.title,
        owaspMapping: rule.owaspMapping,
        impact: rule.impact,
        remediationSummary: rule.remediationSummary,
        maskedEvidence: maskSecret(matchedStr),
        assetUrl,
        fixPrompt: rule.fixPrompt
      });

      seenRuleIds.add(rule.id);
    }
  }

  return findings;
}
