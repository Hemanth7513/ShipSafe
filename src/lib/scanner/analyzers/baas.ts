import { Finding } from '@/lib/types/scan';
import { maskSecret } from '../utils/redact';

/**
 * Decodes a JWT payload without requiring signature verification keys.
 */
export function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    let b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    while (b64.length % 4 !== 0) {
      b64 += '=';
    }

    const jsonStr = Buffer.from(b64, 'base64').toString('utf8');
    return JSON.parse(jsonStr) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/**
 * Specialized BaaS Disambiguator:
 * Inspects candidate JWTs for Supabase claims to distinguish critical admin leaks
 * from intended public anonymous keys.
 */
export function inspectSupabaseJwt(token: string, assetUrl?: string): Finding | null {
  const payload = decodeJwtPayload(token);
  if (!payload) return null;

  const isSupabase = payload.iss === 'supabase' || payload.ref !== undefined || payload.role !== undefined;
  if (!isSupabase) return null;

  const role = payload.role;

  // Case 1: CRITICAL service_role leak (Bypasses Row-Level Security entirely)
  if (role === 'service_role') {
    return {
      id: 'SEC-SUPABASE-SERVICE-ROLE',
      category: 'baas',
      severity: 'critical',
      deduction: 40,
      title: 'Critical Secret Leak: Supabase service_role Admin Key in Client Bundle',
      owaspMapping: 'OWASP A01:2021 - Broken Access Control',
      impact: 'The service_role key bypasses all PostgreSQL Row Level Security (RLS) policies. Anyone can query, alter, or delete all records in your database.',
      remediationSummary: 'Rotate your service_role key immediately in the Supabase Dashboard and remove it from all frontend code and client environment variables.',
      maskedEvidence: maskSecret(token),
      assetUrl,
      fixPrompt: `I accidentally leaked my Supabase service_role key in my client frontend bundle.
Help me fix this:
1. Explain how to rotate the service_role key in the Supabase Project Dashboard (Settings -> API).
2. Ensure my client code uses ONLY NEXT_PUBLIC_SUPABASE_ANON_KEY.
3. Show me how to move all privileged database operations (that legitimately need service_role) into secure Next.js Server Actions or Route Handlers where the key is read strictly from process.env.SUPABASE_SERVICE_ROLE_KEY without the NEXT_PUBLIC_ prefix.`
    };
  }

  // Case 2: Standard anon public key (Intended for client use, but requires RLS policies)
  if (role === 'anon') {
    return {
      id: 'INFO-SUPABASE-ANON-KEY',
      category: 'baas',
      severity: 'info',
      deduction: 0,
      title: 'Supabase Anonymous Client Key Detected (Public Key)',
      owaspMapping: 'OWASP ASVS V14 - Configuration',
      impact: 'The anon key is intended to be public on the client. However, every database table must have Row-Level Security (RLS) enabled to prevent unauthorized reads and writes.',
      remediationSummary: 'Verify that Row Level Security (RLS) is enabled on all tables in your Supabase database schema.',
      maskedEvidence: maskSecret(token),
      assetUrl,
      fixPrompt: `I am using the public Supabase anon key on my frontend.
Please provide:
1. A SQL script to verify that Row-Level Security (RLS) is enabled on all tables in my public schema.
2. An example of secure RLS policies for authenticated vs anonymous user access.
3. Steps to ensure no sensitive columns (like email addresses or private metadata) are exposed via public SELECT policies.`
    };
  }

  return null;
}
