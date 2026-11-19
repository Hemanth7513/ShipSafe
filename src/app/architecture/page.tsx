'use client';

import React from 'react';
import Header from '@/components/Header';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Cpu, 
  ShieldAlert, 
  Eye, 
  Lock, 
  Binary, 
  ShieldCheck, 
  ArrowRight 
} from 'lucide-react';

const ARCH_PILLARS = [
  {
    icon: ShieldAlert,
    tag: 'Network Boundary Defense',
    title: 'Strict SSRF Guard & Anti-DNS Rebinding',
    specs: ['RFC 6890 & RFC 1918 CIDR Blocklist', 'Pre-flight DNS Resolution', 'Per-Redirect Hop Revalidation'],
    description: `To prevent Server-Side Request Forgery (SSRF) and Cloud Metadata Exfiltration, ShipSafe enforces strict sandbox boundaries before dispatching any network request. Every target hostname is pre-resolved to its underlying IP address, which is evaluated against comprehensive CIDR blocklists covering loopback (127.0.0.0/8), private subnets (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16), link-local addresses, and AWS/GCP cloud metadata endpoints (169.254.169.254). Crucially, this resolution check is re-executed on every single HTTP redirect hop to neutralize DNS rebinding attacks.`,
  },
  {
    icon: Cpu,
    tag: 'Identity & Access Control',
    title: 'In-Memory BaaS JWT Claims Disambiguation',
    specs: ['Supabase Client Decoupling', 'JWT Payload Parsing (Zero-Network)', 'RLS Policy Verification'],
    description: `Many security scanners trigger false alerts on Supabase or Firebase client keys because they lack token awareness. Supabase client tokens are base64-encoded JWTs. ShipSafe unpacks the token payload strictly in-memory without transmitting it externally and examines the token role claim: tokens where role === "anon" are classified as expected public client identifiers (0 deduction, informative RLS reminder), whereas tokens with role === "service_role" are flagged with maximum Critical severity (-40 points) because they bypass all Row-Level Security.`,
  },
  {
    icon: Binary,
    tag: 'Heuristic Cryptography',
    title: 'Shannon Entropy & Cryptographic Character-Set Validation',
    specs: ['Shannon Entropy (H >= 3.6)', 'Mixed Alphanumeric Density', 'Template Placeholder Masking'],
    description: `High-entropy string detection often misclassifies long camelCase identifiers, hash digests, or CSS classes as leaked secrets. ShipSafe combines standard Shannon Entropy calculations with a dual-stage cryptographic character filter. A candidate string is only flagged if its entropy exceeds H >= 3.6 and its character composition exhibits true pseudo-random dispersion across uppercase, lowercase, and numeric ranges. Known placeholder tokens (e.g., YOUR_API_KEY_HERE) are automatically filtered out.`,
  },
  {
    icon: Eye,
    tag: 'False Positive Elimination',
    title: 'SPA Catch-All Route Disambiguation',
    specs: ['Content Signature Verification', 'MIME Type Inspection', 'Zero Blind 200 OK Reliances'],
    description: `Modern Single Page Applications (Next.js App Router, Vite, Nuxt) implement wildcard client-side catch-all routes. Requesting /.env or /.git/config on an SPA typically returns HTTP 200 with an HTML fallback page. Naive vulnerability scanners report these as critical credential exposures. ShipSafe eliminates this false-positive vector by inspecting content structure: /.env responses must conform to key-value formatting without HTML doctypes, while .js.map endpoints require valid JSON structures with sources and mappings keys.`,
  },
  {
    icon: Lock,
    tag: 'Hygiene & Cryptography',
    title: 'Transport Layer & Defense-in-Depth Assessment',
    specs: ['HSTS 2-Year Preload Verification', 'CSP Script Directive Auditing', 'Cookie Directive Enforcement'],
    description: `ShipSafe evaluates HTTP response headers against OWASP ASVS v4.0 benchmarks. Content-Security-Policy (CSP) headers are parsed to detect unhashed unsafe-inline directives in script-src, Strict-Transport-Security (HSTS) is audited for two-year max-age (63072000s) with includeSubDomains and preload, and Set-Cookie directives are inspected for HttpOnly, Secure, and SameSite flags on sensitive session identifiers.`,
  },
];

export default function ArchitecturePage() {
  return (
    <div className="min-h-screen bg-black text-neutral-100 flex flex-col selection:bg-white selection:text-black relative overflow-x-hidden">
      {/* Top Ambient Spotlight Glow */}
      <div className="pointer-events-none absolute -top-36 left-1/2 -translate-x-1/2 w-[750px] h-[350px] bg-gradient-to-b from-white/[0.08] via-white/[0.02] to-transparent rounded-full blur-3xl z-0" />

      <Header />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8 md:py-14 z-10 space-y-12">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center space-x-1.5 text-xs font-mono text-neutral-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Return to Auditor</span>
          </Link>

          <span className="text-xs font-mono text-neutral-500">
            System Architecture &amp; Defensive Pipeline
          </span>
        </div>

        {/* Hero Section */}
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-white/[0.04] border border-white/10 text-xs font-mono text-neutral-300">
            <Cpu className="h-3.5 w-3.5 text-white" />
            <span>Core Engineering Specifications</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
            Defensive Security Architecture
          </h1>
          <p className="text-xs md:text-sm text-neutral-400 leading-relaxed">
            ShipSafe is engineered from first principles to provide enterprise-grade passive security auditing with zero false alarms, strict network boundaries, and ephemeral in-memory analysis.
          </p>
        </div>

        {/* Pillars Grid */}
        <div className="space-y-6">
          {ARCH_PILLARS.map((pillar, i) => {
            const Icon = pillar.icon;
            return (
              <div
                key={pillar.title}
                className="rounded-3xl border border-white/10 bg-[#0B0D11]/90 backdrop-blur-2xl p-6 md:p-8 space-y-4 shadow-xl hover:border-white/20 transition-all shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 rounded-xl bg-white/[0.05] border border-white/10 flex items-center justify-center text-white shrink-0">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="text-[11px] font-mono text-neutral-400 block">
                        Pillar 0{i + 1} • {pillar.tag}
                      </span>
                      <h2 className="text-base md:text-lg font-bold text-white tracking-tight">
                        {pillar.title}
                      </h2>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    {pillar.specs.map((spec) => (
                      <span
                        key={spec}
                        className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.04] border border-white/[0.08] text-neutral-300"
                      >
                        {spec}
                      </span>
                    ))}
                  </div>
                </div>

                <p className="text-xs md:text-sm text-neutral-400 leading-relaxed">
                  {pillar.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Scoring Engine Breakdown */}
        <div className="rounded-3xl border border-white/10 bg-[#0B0D11]/90 backdrop-blur-2xl p-6 md:p-8 space-y-4 shadow-xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-white/[0.05] border border-white/10 flex items-center justify-center text-white shrink-0">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[11px] font-mono text-neutral-400 block">Deterministic Scoring Model</span>
              <h2 className="text-base md:text-lg font-bold text-white tracking-tight">
                Weighted Algorithmic Deductions &amp; Letter Grading
              </h2>
            </div>
          </div>

          <p className="text-xs md:text-sm text-neutral-400 leading-relaxed">
            ShipSafe calculates scores using a deterministic baseline penalty formula:
          </p>

          <div className="bg-[#050608] p-4 rounded-xl border border-white/[0.08] font-mono text-xs text-neutral-300 space-y-1.5">
            <div className="text-neutral-500">{'// Scoring Formula'}</div>
            <div>Score = max(0, 100 - Σ(deductions))</div>
            <div className="text-neutral-400 pt-1">
              • Critical: -40 pts (Service Role Bypass, Exposed .env) → Automatically triggers Grade D or F
            </div>
            <div className="text-neutral-400">
              • High: -18 pts (Exposed Production Source Maps, Insecure CORS with Credentials)
            </div>
            <div className="text-neutral-400">
              • Medium: -8 to -12 pts (Missing CSP, Absent HSTS, Insecure Cookies)
            </div>
            <div className="text-neutral-400">
              • Low: -3 to -5 pts (Verbose Server Disclosures, Permissive Referrer Policy)
            </div>
            <div className="text-neutral-400">
              • Info: 0 pts (Intended Public BaaS Anon Keys, Architectural Checklists)
            </div>
          </div>
        </div>

        {/* Bottom CTA to Audit Target */}
        <div className="rounded-3xl border border-white/10 bg-[#0B0D11]/90 backdrop-blur-2xl p-8 text-center space-y-4 max-w-2xl mx-auto shadow-2xl">
          <h3 className="text-lg font-bold text-white tracking-tight">
            Execute a Security Hygiene Audit
          </h3>
          <p className="text-xs text-neutral-400 leading-relaxed">
            Test any public web application URL against ShipSafe’s defensive pipeline with instantaneous results.
          </p>
          <div className="pt-2">
            <Link
              href="/"
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-white hover:bg-neutral-200 text-black text-xs font-semibold transition-all shadow-sm active:scale-[0.98]"
            >
              <span>Launch Auditor</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-white/[0.08] bg-black py-8 mt-20 text-center text-xs text-neutral-400 font-mono z-10">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span>ShipSafe v1.0 • Defensive System Architecture</span>
          <span>Mapped to OWASP Top 10 (2021) &amp; OWASP ASVS v4.0</span>
        </div>
      </footer>
    </div>
  );
}
