import { NextRequest, NextResponse } from 'next/server';
import { executePassiveScan } from '@/lib/scanner/fetcher/client';
import { calculateScoreAndGrade } from '@/lib/scanner/scoring/engine';
import { Finding, ScanResult } from '@/lib/types/scanner';

/**
 * Pre-computed deterministic demo results for 1-click recruiter and reviewer tests.
 * Guaranteed 0ms network latency and showcases all detection categories safely.
 */
function getDemoTargetScanResult(): ScanResult {
  const demoFindings: Finding[] = [
    {
      id: 'SEC-SUPABASE-SERVICE-ROLE',
      category: 'baas',
      severity: 'critical',
      deduction: 40,
      title: 'Critical Secret Leak: Supabase service_role Key in Client Bundle',
      owaspMapping: 'OWASP A01:2021 - Broken Access Control',
      impact: 'The service_role administrative key bypasses all PostgreSQL Row-Level Security (RLS) policies. Anyone can query, modify, or drop your entire production database.',
      remediationSummary: 'Immediately rotate your service_role key in the Supabase Dashboard and remove it from all frontend code and NEXT_PUBLIC_ variables.',
      maskedEvidence: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJvbGUiOiJzZXJ2aWNlX3JvbGUiLCJleHAiOjE5••••••••••••8f2a',
      assetUrl: 'https://demo-vibe-app.internal/static/chunks/app-bundle.js',
      fixPrompt: `I accidentally bundled my Supabase service_role key in my client frontend code.
Please help me:
1. Explain how to rotate the service_role key in the Supabase Project Dashboard (Settings -> API).
2. Refactor my code so that the client strictly uses only NEXT_PUBLIC_SUPABASE_ANON_KEY.
3. Move all administrative operations to a Next.js Server Action or API Route Handler where the key is read securely from server-only process.env.SUPABASE_SERVICE_ROLE_KEY.`
    },
    {
      id: 'ARTIFACT-EXPOSED-SOURCE-MAP',
      category: 'artifacts',
      severity: 'high',
      deduction: 25,
      title: 'Exposed Production Source Map (.js.map)',
      owaspMapping: 'OWASP A05:2021 - Security Misconfiguration',
      impact: 'Production source maps allow any visitor to reverse-engineer your original unminified TypeScript/React source code, revealing internal API contracts, comments, and unreleased feature routes.',
      remediationSummary: 'Disable production browser source maps in your bundler configuration.',
      maskedEvidence: '{"version":3,"sources":["src/app/page.tsx","src/lib/supabase.ts"]}',
      assetUrl: 'https://demo-vibe-app.internal/static/chunks/app-bundle.js.map',
      fixPrompt: `My production source maps (.js.map) are publicly downloadable.
In my Next.js next.config.js, show me how to ensure productionBrowserSourceMaps: false is set and verify that build output excludes .map files from static hosting.`
    },
    {
      id: 'HDR-MISSING-CSP',
      category: 'headers',
      severity: 'medium',
      deduction: 12,
      title: 'Missing Content-Security-Policy (CSP)',
      owaspMapping: 'OWASP A05:2021 - Security Misconfiguration',
      impact: 'Without a Content-Security-Policy, the browser cannot restrict script execution origins, leaving the application vulnerable to Cross-Site Scripting (XSS) and malicious data injection.',
      remediationSummary: 'Add a Content-Security-Policy header restricting script, style, and iframe sources.',
      fixPrompt: `Add a robust Content-Security-Policy header to my Next.js (next.config.js) configuration.
The policy should allow self-hosted scripts, styles, and images, permit Google Fonts, and restrict iframe framing to self.`
    },
    {
      id: 'HDR-MISSING-HSTS',
      category: 'headers',
      severity: 'medium',
      deduction: 12,
      title: 'Missing Strict-Transport-Security (HSTS)',
      owaspMapping: 'OWASP A02:2021 - Cryptographic Failures',
      impact: 'Without HSTS, visitors can be downgraded to cleartext HTTP via SSL-stripping and man-in-the-middle attacks.',
      remediationSummary: 'Configure Strict-Transport-Security: max-age=63072000; includeSubDomains; preload.',
      fixPrompt: `Configure Strict-Transport-Security in my Next.js headers with a 2-year max-age, includeSubDomains, and preload flags.`
    },
    {
      id: 'HDR-MISSING-CONTENT-TYPE-OPTIONS',
      category: 'headers',
      severity: 'low',
      deduction: 5,
      title: 'Missing X-Content-Type-Options: nosniff',
      owaspMapping: 'OWASP A05:2021 - Security Misconfiguration',
      impact: 'Without nosniff, browsers may attempt to guess (MIME-sniff) non-executable files as JavaScript, leading to drive-by code execution.',
      remediationSummary: 'Add the X-Content-Type-Options: nosniff header.',
      fixPrompt: `Configure X-Content-Type-Options: nosniff on all routes in my Next.js configuration.`
    },
    {
      id: 'INFO-SUPABASE-ANON-KEY',
      category: 'baas',
      severity: 'info',
      deduction: 0,
      title: 'Supabase Anonymous Client Key Detected (Public Key)',
      owaspMapping: 'OWASP ASVS V14 - Configuration',
      impact: 'The anon key is intended to be public on the client. However, every database table must have Row-Level Security (RLS) enabled to prevent unauthorized reads and writes.',
      remediationSummary: 'Verify that Row-Level Security (RLS) policies are active on all database tables.',
      maskedEvidence: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJvbGUiOiJhbm9uIiwiZXhwIjoxOTAw••••••••••••3d1b',
      assetUrl: 'https://demo-vibe-app.internal/static/chunks/app-bundle.js',
      fixPrompt: `I am using the public Supabase anon key on my frontend.
Please provide:
1. A SQL script to verify that Row-Level Security (RLS) is enabled on all tables in my public schema.
2. An example of secure RLS policies for authenticated vs anonymous user access.`
    }
  ];

  const { overallScore, grade, severityCounts } = calculateScoreAndGrade(demoFindings);

  return {
    scanId: 'demo-scan-' + Date.now(),
    targetUrl: 'https://demo-vibe-target.internal',
    targetHost: 'demo-vibe-target.internal',
    resolvedIp: '198.51.100.42 (Sandboxed Mock IP)',
    scannedAt: new Date().toISOString(),
    durationMs: 1420,
    overallScore,
    grade,
    severityCounts,
    findings: demoFindings,
    scannedAssets: [
      { url: 'https://demo-vibe-target.internal/', sizeBytes: 14200, type: 'html', status: 200 },
      { url: 'https://demo-vibe-target.internal/static/chunks/app-bundle.js', sizeBytes: 184000, type: 'script', status: 200 },
      { url: 'https://demo-vibe-target.internal/static/chunks/app-bundle.js.map', sizeBytes: 420000, type: 'map', status: 200 },
    ],
    frameworkDetected: 'Next.js (App Router)',
    isDemoTarget: true
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url, isDemo, confirmedOwnership } = body;

    // 1. Instant Safe Demo Mode
    if (isDemo || url === 'demo' || url?.includes('demo-target')) {
      // Simulate brief realistic scan delay for terminal UX
      await new Promise(r => setTimeout(r, 800));
      return NextResponse.json(getDemoTargetScanResult());
    }

    // 2. Validate URL presence
    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { error: 'A valid target URL is required.' },
        { status: 400 }
      );
    }

    // 3. Authorization check
    if (!confirmedOwnership) {
      return NextResponse.json(
        { error: 'You must confirm domain ownership or explicit audit authorization before scanning.' },
        { status: 403 }
      );
    }

    let normalizedUrl = url.trim();
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
      normalizedUrl = `https://${normalizedUrl}`;
    }

    const startTime = Date.now();
    const parsedTarget = new URL(normalizedUrl);

    // 4. Execute passive scan
    const scanData = await executePassiveScan(normalizedUrl, {
      perRequestTimeoutMs: 5000,
      maxScripts: 15,
      maxTotalBytes: 5 * 1024 * 1024,
    });

    const durationMs = Date.now() - startTime;
    const { overallScore, grade, severityCounts } = calculateScoreAndGrade(scanData.findings);

    const result: ScanResult = {
      scanId: `scan-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      targetUrl: normalizedUrl,
      targetHost: parsedTarget.hostname,
      resolvedIp: scanData.resolvedIp,
      scannedAt: new Date().toISOString(),
      durationMs,
      overallScore,
      grade,
      severityCounts,
      findings: scanData.findings,
      scannedAssets: scanData.scannedAssets,
      frameworkDetected: scanData.frameworkDetected,
      isDemoTarget: false,
    };

    return NextResponse.json(result);

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Scan execution failed.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
