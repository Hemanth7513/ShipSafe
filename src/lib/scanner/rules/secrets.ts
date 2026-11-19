import { Finding, FindingSeverity } from '@/lib/types/scanner';
import { 
  calculateShannonEntropy, 
  maskSecret, 
  isPlaceholder, 
  hasCryptographicCharacterSet,
  extractCandidateTokens 
} from '../entropy/shannon';

export interface SecretRule {
  id: string;
  title: string;
  provider: string;
  severity: FindingSeverity;
  deduction: number;
  owaspMapping: string;
  pattern: RegExp;
  minEntropy?: number;
  requiresMixedCharset?: boolean;
  impact: string;
  remediationSummary: string;
  fixPrompt: string;
  isPublicSafe?: boolean;
}

export const SECRET_RULES: SecretRule[] = [
  // 1. OpenAI Project API Key (Modern 2025/2026 format: 120-170 chars)
  {
    id: 'SEC-OPENAI-PROJECT-KEY',
    title: 'Exposed OpenAI Project API Key in Client Code',
    provider: 'OpenAI',
    severity: 'critical',
    deduction: 40,
    owaspMapping: 'OWASP A02:2021 - Cryptographic Failures',
    pattern: /sk-proj-[A-Za-z0-9_-]{80,180}/,
    minEntropy: 3.7,
    impact: 'Attackers can extract this API key and run unauthorized LLM model queries, exhaust your API quota, or incur massive billing charges on your account.',
    remediationSummary: 'Revoke and rotate this project key immediately in the OpenAI platform dashboard and route all AI requests through a secure server-side API endpoint.',
    fixPrompt: `I accidentally committed or bundled my OpenAI API key in my frontend code.
Help me secure this by:
1. Explaining how to safely revoke and rotate this key in the OpenAI platform dashboard.
2. Refactoring my frontend to remove direct OpenAI SDK calls.
3. Creating a Next.js App Router Route Handler (e.g. /api/chat/route.ts) that reads process.env.OPENAI_API_KEY securely on the server and exposes a protected endpoint for my client components.`
  },

  // 2. OpenAI Legacy / Admin / Service Account Key
  {
    id: 'SEC-OPENAI-LEGACY-KEY',
    title: 'Exposed OpenAI Service or Secret Key',
    provider: 'OpenAI',
    severity: 'critical',
    deduction: 40,
    owaspMapping: 'OWASP A02:2021 - Cryptographic Failures',
    pattern: /sk-(?:admin|svcacct)?[A-Za-z0-9_-]{40,90}/,
    minEntropy: 3.8,
    impact: 'Exposes administrative or service-level access to your OpenAI models and fine-tuned deployments.',
    remediationSummary: 'Immediately revoke this key in the OpenAI dashboard and move all model calls to backend-only handlers.',
    fixPrompt: `My OpenAI secret key was leaked in my client bundle. 
Please write a secure server-side route handler in Next.js to proxy my AI calls, and remind me of the steps to rotate this credential.`
  },

  // 3. Stripe Live Secret Key
  {
    id: 'SEC-STRIPE-LIVE-SECRET',
    title: 'Exposed Stripe Live Secret Key (sk_live_...)',
    provider: 'Stripe',
    severity: 'critical',
    deduction: 40,
    owaspMapping: 'OWASP A02:2021 - Cryptographic Failures',
    pattern: /sk_live_[0-9a-zA-Z]{24,40}/,
    minEntropy: 3.6,
    impact: 'Attackers have full programmatic control over your Stripe account to initiate refunds, read customer credit card metadata, or create unauthorized payment intents.',
    remediationSummary: 'Roll this key immediately in the Stripe Dashboard (Developers -> API Keys) and use only pk_live_ keys on the client.',
    fixPrompt: `I exposed my Stripe live secret key (sk_live_...) in my client bundle.
Please help me:
1. Show me how to roll this key in the Stripe Dashboard immediately.
2. Refactor my code so that the client ONLY uses the publishable key (NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = pk_live_...).
3. Move checkout session creation and customer handling to a secure Next.js server route using server-only process.env.STRIPE_SECRET_KEY.`
  },

  // 4. Stripe Restricted Key
  {
    id: 'SEC-STRIPE-RESTRICTED-KEY',
    title: 'Exposed Stripe Restricted Access Key (rk_live_...)',
    provider: 'Stripe',
    severity: 'critical',
    deduction: 40,
    owaspMapping: 'OWASP A02:2021 - Cryptographic Failures',
    pattern: /rk_live_[0-9a-zA-Z]{24,40}/,
    minEntropy: 3.6,
    impact: 'Exposes scoped access to Stripe resources according to this key’s permission grants.',
    remediationSummary: 'Revoke this restricted key in the Stripe Dashboard and keep all restricted API keys server-side.',
    fixPrompt: `My Stripe restricted key was exposed in frontend code. Provide steps to revoke it and move Stripe operations to backend server handlers.`
  },

  // 5. Stripe Webhook Secret
  {
    id: 'SEC-STRIPE-WEBHOOK-SECRET',
    title: 'Exposed Stripe Webhook Secret (whsec_...)',
    provider: 'Stripe',
    severity: 'critical',
    deduction: 40,
    owaspMapping: 'OWASP A02:2021 - Cryptographic Failures',
    pattern: /whsec_[0-9a-zA-Z]{30,45}/,
    minEntropy: 3.6,
    impact: 'Allows malicious actors to forge valid Stripe webhook event payloads (such as marking unpaid invoices as paid).',
    remediationSummary: 'Rotate the webhook endpoint secret in your Stripe Dashboard and keep it strictly on your webhook receiver server.',
    fixPrompt: `I leaked my Stripe webhook secret (whsec_...) in client code. Show me how to regenerate it in Stripe and verify webhook signatures only inside my Next.js /api/webhooks/stripe route.`
  },

  // 6. Stripe Publishable Key (Public - Educational Info Only)
  {
    id: 'SEC-STRIPE-PUBLISHABLE',
    title: 'Stripe Publishable Key Detected (pk_live_...)',
    provider: 'Stripe',
    severity: 'info',
    deduction: 0,
    owaspMapping: 'OWASP ASVS V14 - Configuration',
    pattern: /pk_live_[0-9a-zA-Z]{24,40}/,
    impact: 'Publishable keys are intended to be public on the client. Ensure no sensitive payment logic relies on this key alone.',
    remediationSummary: 'No action required if this is properly paired with a server-side payment intent workflow.',
    fixPrompt: `Verify that my Stripe client setup uses the publishable key solely to mount Stripe Elements, and that all actual payment intents and charges are initiated server-side.`,
    isPublicSafe: true
  },

  // 7. Anthropic API Key
  {
    id: 'SEC-ANTHROPIC-KEY',
    title: 'Exposed Anthropic Claude API Key',
    provider: 'Anthropic',
    severity: 'critical',
    deduction: 40,
    owaspMapping: 'OWASP A02:2021 - Cryptographic Failures',
    pattern: /sk-ant-api03-[A-Za-z0-9_-]{80,120}/,
    minEntropy: 3.7,
    impact: 'Grants full access to Claude 3.5 Sonnet / Opus APIs, risking API quota exhaustion and massive billing charges.',
    remediationSummary: 'Revoke and regenerate this key in the Anthropic Console immediately.',
    fixPrompt: `My Anthropic API key was exposed in client code. Help me rotate this key in Anthropic Console and create a server-side proxy route to stream Claude completions securely.`
  },

  // 8. AWS Access Key ID
  {
    id: 'SEC-AWS-ACCESS-KEY',
    title: 'Exposed AWS Access Key ID (AKIA...)',
    provider: 'AWS',
    severity: 'high',
    deduction: 25,
    owaspMapping: 'OWASP A02:2021 - Cryptographic Failures',
    pattern: /AKIA[0-9A-Z]{16}/,
    minEntropy: 3.0,
    impact: 'Indicates hardcoded AWS IAM credentials, which attackers can test against AWS STS to query permissions and compromise S3 buckets or EC2 instances.',
    remediationSummary: 'Deactivate and delete this IAM Access Key in the AWS Console. Use temporary IAM roles or backend presigned URLs.',
    fixPrompt: `An AWS Access Key ID was leaked in my client bundle. Guide me through:
1. Deactivating and deleting the key in AWS IAM Console.
2. Checking AWS CloudTrail for unauthorized API calls.
3. Generating presigned S3 URLs on the server instead of bundling AWS credentials in the client.`
  },

  // 9. GitHub Personal Access Token
  {
    id: 'SEC-GITHUB-TOKEN',
    title: 'Exposed GitHub Personal Access Token (ghp_...)',
    provider: 'GitHub',
    severity: 'critical',
    deduction: 40,
    owaspMapping: 'OWASP A02:2021 - Cryptographic Failures',
    pattern: /ghp_[0-9a-zA-Z]{36}/,
    minEntropy: 3.6,
    impact: 'Enables unauthorized read/write access to your private GitHub repositories, issue trackers, and organization assets.',
    remediationSummary: 'Revoke this personal access token in GitHub (Settings -> Developer Settings -> Personal Access Tokens).',
    fixPrompt: `My GitHub Personal Access Token was leaked in client-side code. Guide me to revoke it immediately and audit repository access logs.`
  },

  // 10. Slack Incoming Webhook URL
  {
    id: 'SEC-SLACK-WEBHOOK',
    title: 'Exposed Slack Incoming Webhook URL',
    provider: 'Slack',
    severity: 'high',
    deduction: 25,
    owaspMapping: 'OWASP A01:2021 - Broken Access Control',
    pattern: /https:\/\/hooks\.slack\.com\/services\/T[A-Z0-9]{8}\/B[A-Z0-9]{8,12}\/[A-Za-z0-9]{24}/,
    impact: 'Anyone with this webhook URL can send arbitrary, spoofed messages to your team’s internal Slack channels.',
    remediationSummary: 'Delete the webhook integration in your Slack App Directory and recreate it, storing the new URL exclusively in server-side environment variables.',
    fixPrompt: `A Slack webhook URL was exposed in frontend code. How do I delete and recreate this webhook in Slack, and send notifications exclusively via a server-side route handler in Next.js?`
  }
];

/**
 * Safely decodes a JWT payload without requiring signature verification keys.
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

    // Search the source code using the rule pattern
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
