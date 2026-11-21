'use client';

import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Link from 'next/link';
import { 
  ArrowLeft, 
  ListChecks, 
  CheckCircle2, 
  RotateCcw, 
  ShieldCheck, 
  Shield, 
  AlertCircle,
  Copy,
  Check,
  CheckCheck
} from 'lucide-react';

interface ChecklistItem {
  id: string;
  title: string;
  category: string;
  description: string;
  recommendation: string;
  owasp: string;
}

const CHECKLIST_ITEMS: ChecklistItem[] = [
  {
    id: 'rls',
    title: 'Row-Level Security (RLS) Active on All Tables',
    category: 'Database / BaaS',
    description: 'Verify RLS is explicitly enabled across all Supabase and PostgreSQL tables. Even if client-side anon keys are discovered, active RLS policies prevent unauthorized data exfiltration or table dumps.',
    recommendation: 'Run `ALTER TABLE <table_name> ENABLE ROW LEVEL SECURITY;` and author granular SELECT/INSERT policies.',
    owasp: 'A01: Broken Access Control',
  },
  {
    id: 'sourcemaps',
    title: 'Production JavaScript Source Maps Disabled',
    category: 'Bundles & Build Artifacts',
    description: 'Ensure client-side bundles do not expose `.js.map` endpoints that disclose unminified TypeScript/JSX source code, internal API endpoints, and developer notes.',
    recommendation: 'Configure `productionBrowserSourceMaps: false` in `next.config.js` or `build.sourcemap = false` in `vite.config.ts`.',
    owasp: 'A05: Security Misconfiguration',
  },
  {
    id: 'env_prefix',
    title: 'Environment Variable Prefix Isolation',
    category: 'Secrets & Cryptography',
    description: 'Never prefix private database connection strings, administrative service role keys, or Stripe webhook signing secrets with public prefixes (`NEXT_PUBLIC_` or `VITE_`).',
    recommendation: 'Audit `.env` declarations. Variables with public prefixes are compiled directly into publicly downloadable client bundles.',
    owasp: 'A07: Identification & Authentication Failures',
  },
  {
    id: 'csp',
    title: 'Content-Security-Policy (CSP) Script Boundary Active',
    category: 'Headers & Framing',
    description: 'Restrict script execution origins and eliminate unhashed/unnonced `unsafe-inline` directives in `script-src` to prevent cross-site scripting (XSS) vectors.',
    recommendation: 'Configure strict CSP headers in edge middleware or server configuration with nonces for dynamic scripts.',
    owasp: 'A05: Security Misconfiguration',
  },
  {
    id: 'hsts',
    title: 'HSTS with 2-Year Max-Age & Preload Enforced',
    category: 'Transport Security',
    description: 'Enforce protocol downgrade prevention and SSL-stripping protection across root domains and all subdomains.',
    recommendation: 'Set `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload` header on all HTTPS responses.',
    owasp: 'A02: Cryptographic Failures',
  },
  {
    id: 'ratelimit',
    title: 'API Mutation Route Rate Limiting',
    category: 'Application Logic',
    description: 'Protect authentication, registration, password reset, and expensive AI generation routes against automated brute-force attacks.',
    recommendation: 'Deploy memory or Redis-backed sliding window rate limiters (e.g., 5-10 requests/min per IP on sensitive routes).',
    owasp: 'A04: Insecure Design',
  },
  {
    id: 'cors',
    title: 'Explicit Origin CORS Restrictions',
    category: 'API Security',
    description: 'Avoid wildcard `Access-Control-Allow-Origin: *` headers on authenticated REST and GraphQL endpoints that handle credentials or session cookies.',
    recommendation: 'Restrict CORS headers to explicit trusted origins and validate the incoming `Origin` header dynamically against an allowlist.',
    owasp: 'A01: Broken Access Control',
  },
];

const STORAGE_KEY = 'shipsafe_launch_checklist';

export default function ProtocolPage() {
  const [checkedIds, setCheckedIds] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setCheckedIds(JSON.parse(stored));
      }
    } catch {
      // ignore
    }
  }, []);

  const toggleItem = (id: string) => {
    const next = checkedIds.includes(id)
      ? checkedIds.filter((item) => item !== id)
      : [...checkedIds, id];

    setCheckedIds(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  };

  const handleVerifyAll = () => {
    const allIds = CHECKLIST_ITEMS.map(i => i.id);
    setCheckedIds(allIds);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(allIds));
    } catch {
      // ignore
    }
  };

  const handleReset = () => {
    setCheckedIds([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  const handleCopyAttestation = () => {
    const lines = [
      '# ShipSafe Pre-Launch Security Attestation Report',
      `*Generated on: ${new Date().toISOString()}*`,
      `*Status: ${checkedIds.length} of ${CHECKLIST_ITEMS.length} verified (${Math.round((checkedIds.length / CHECKLIST_ITEMS.length) * 100)}%)*`,
      '',
      '### Checkpoint Status:',
      ...CHECKLIST_ITEMS.map(item => {
        const mark = checkedIds.includes(item.id) ? '[x]' : '[ ]';
        return `- ${mark} **${item.title}** (${item.owasp})\n  Category: ${item.category}\n  Directive: ${item.recommendation}`;
      }),
      '',
      '---',
      '*Verified with ShipSafe Passive Security Hygiene Auditor*'
    ];
    navigator.clipboard.writeText(lines.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const total = CHECKLIST_ITEMS.length;
  const completed = checkedIds.length;
  const percentage = Math.round((completed / total) * 100);

  const categories = ['all', ...Array.from(new Set(CHECKLIST_ITEMS.map(i => i.category)))];

  const filteredItems = selectedCategory === 'all'
    ? CHECKLIST_ITEMS
    : CHECKLIST_ITEMS.filter(i => i.category === selectedCategory);

  return (
    <div className="min-h-screen bg-black text-neutral-100 flex flex-col selection:bg-white selection:text-black relative overflow-x-hidden">
      {/* Top Ambient Spotlight Glow */}
      <div className="pointer-events-none absolute -top-36 left-1/2 -translate-x-1/2 w-[750px] h-[350px] bg-gradient-to-b from-white/[0.08] via-white/[0.02] to-transparent rounded-full blur-3xl z-0" />

      <Header />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8 md:py-14 z-10 space-y-10">
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
            Institutional Hardening Checklist
          </span>
        </div>

        {/* Hero Section */}
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-white/[0.04] border border-white/10 text-xs font-mono text-neutral-300">
            <ListChecks className="h-3.5 w-3.5 text-white" />
            <span>Pre-Deployment Hygiene Standards</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
            Pre-Launch Security Protocol
          </h1>
          <p className="text-xs md:text-sm text-neutral-400 leading-relaxed">
            Verify every critical hygiene checkpoint before pointing live traffic or customer data at your application. Progress is automatically persisted in your local browser session.
          </p>
        </div>

        {/* Progress Tracker Card */}
        <div className="rounded-3xl border border-white/10 bg-[#0B0D11]/90 backdrop-blur-2xl p-6 md:p-8 space-y-5 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-xl bg-white/[0.05] border border-white/10 flex items-center justify-center text-white">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white tracking-tight">
                  Hardening Conformance Status
                </h2>
                <span className="text-xs font-mono text-neutral-400">
                  {completed} of {total} Checkpoints Verified ({percentage}%)
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleCopyAttestation}
                className="text-xs font-mono text-neutral-300 hover:text-white flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] transition-all"
                title="Copy attestation checklist for Pull Requests or audits"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copied ? 'Copied Attestation' : 'Copy Attestation'}</span>
              </button>

              <button
                type="button"
                onClick={handleVerifyAll}
                className="text-xs font-mono text-neutral-300 hover:text-white flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] transition-all"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                <span>Verify All</span>
              </button>

              {completed > 0 && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="text-xs font-mono text-neutral-400 hover:text-white flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-white/10 hover:bg-white/[0.05] transition-all"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Reset</span>
                </button>
              )}
            </div>
          </div>

          <div className="h-2.5 w-full bg-[#050608] rounded-full overflow-hidden border border-white/[0.06]">
            <div
              className={`h-full transition-all duration-300 rounded-full ${
                percentage === 100
                  ? 'bg-emerald-400'
                  : percentage >= 50
                  ? 'bg-white'
                  : 'bg-neutral-500'
              }`}
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-xl text-xs font-mono transition-all capitalize shrink-0 ${
                selectedCategory === cat
                  ? 'bg-white text-black font-semibold'
                  : 'bg-white/[0.03] text-neutral-400 hover:text-white hover:bg-white/[0.06] border border-white/[0.06]'
              }`}
            >
              {cat === 'all' ? `All (${total})` : cat}
            </button>
          ))}
        </div>

        {/* Interactive Checklist Cards */}
        <div className="space-y-3.5">
          {filteredItems.map((item) => {
            const isChecked = mounted && checkedIds.includes(item.id);
            return (
              <div
                key={item.id}
                onClick={() => toggleItem(item.id)}
                className={`cursor-pointer group rounded-2xl border p-5 transition-all select-none ${
                  isChecked
                    ? 'bg-[#0B0D11]/90 border-white/20 shadow-lg'
                    : 'bg-[#0B0D11]/60 border-white/[0.08] hover:border-white/15'
                }`}
              >
                <div className="flex items-start space-x-4">
                  <div className="pt-0.5 shrink-0">
                    <div
                      className={`h-5 w-5 rounded-md flex items-center justify-center border transition-all ${
                        isChecked
                          ? 'bg-white border-white text-black'
                          : 'border-white/30 group-hover:border-white/60 bg-transparent'
                      }`}
                    >
                      {isChecked && <CheckCircle2 className="h-4 w-4 text-black stroke-[3]" />}
                    </div>
                  </div>

                  <div className="flex-1 space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <span
                        className={`text-sm font-semibold transition-colors ${
                          isChecked ? 'text-neutral-400 line-through' : 'text-white'
                        }`}
                      >
                        {item.title}
                      </span>
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.04] border border-white/[0.08] text-neutral-400">
                          {item.category}
                        </span>
                        <span className="text-[10px] font-mono text-neutral-400">
                          {item.owasp}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-neutral-400 leading-relaxed">
                      {item.description}
                    </p>

                    <div className="text-[11px] font-mono text-neutral-300 bg-[#050608] p-3 rounded-xl border border-white/[0.06] mt-2">
                      <span className="text-neutral-400 font-semibold">Remediation Directive: </span>
                      {item.recommendation}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Persistence Notice */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] text-xs text-neutral-400">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 text-neutral-400" />
            <span>Progress automatically synced to local browser storage</span>
          </div>
          <Link
            href="/"
            className="inline-flex items-center space-x-1.5 text-xs text-white hover:underline font-mono"
          >
            <Shield className="h-3.5 w-3.5" />
            <span>Run Auditor Now</span>
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-white/[0.08] bg-black py-8 mt-20 text-center text-xs text-neutral-400 font-mono z-10">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span>ShipSafe v1.0 • Pre-Launch Security Protocol</span>
          <span>Mapped to OWASP Top 10 (2021) &amp; OWASP ASVS v4.0</span>
        </div>
      </footer>
    </div>
  );
}
