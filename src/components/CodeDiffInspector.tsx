'use client';

import React, { useState } from 'react';
import { ShieldAlert, ShieldCheck, Check, Copy, Code2 } from 'lucide-react';

interface CodeSample {
  id: string;
  title: string;
  tag: string;
  vulnerableLabel: string;
  vulnerableCode: string;
  vulnerableExplanation: string;
  hardenedLabel: string;
  hardenedCode: string;
  hardenedExplanation: string;
}

const SAMPLES: CodeSample[] = [
  {
    id: 'supabase',
    title: 'Supabase Key Leakage in Client Components',
    tag: 'BaaS & Secrets',
    vulnerableLabel: 'AI Generated (Vulnerable)',
    vulnerableCode: `// ❌ AI Tool exported secret to client bundle
// app/components/UserList.tsx ('use client')
import { createClient } from '@supabase/supabase-js';

// Leaking service_role key with admin privileges!
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY! // Bypass RLS!
);

export default function UserList() {
  // Any visitor can dump the entire database
}`,
    vulnerableExplanation: 'Prefixing private admin secrets with NEXT_PUBLIC_ embeds them directly into public client JS bundles.',
    hardenedLabel: 'ShipSafe Hardened',
    hardenedCode: `// ✅ Secure Server Action / Route Handler
// app/actions/users.ts ('use server')
import { createClient } from '@supabase/supabase-js';

// Server-only: private key is never sent to browser
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Protected in Node runtime
);

export async function getPrivilegedUsers() {
  const session = await auth();
  if (!session?.user?.isAdmin) throw new Error('Unauthorized');
  return supabaseAdmin.from('users').select('*');
}`,
    hardenedExplanation: 'Private keys stay strictly on the server; clients only receive verified, authorization-checked responses.',
  },
  {
    id: 'sourcemaps',
    title: 'Production Source Maps Leakage',
    tag: 'Artifacts',
    vulnerableLabel: 'Default Config (Vulnerable)',
    vulnerableCode: `// ❌ next.config.mjs (Default or AI suggested)
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Exposes entire original source code, API routes,
  // and developer comments publicly at .js.map!
  productionBrowserSourceMaps: true,
};

export default nextConfig;`,
    vulnerableExplanation: 'Public source maps allow competitors and attackers to reconstruct your unminified frontend codebase.',
    hardenedLabel: 'ShipSafe Hardened',
    hardenedCode: `// ✅ next.config.mjs (Hardened for Production)
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Strips all production source maps from client assets
  productionBrowserSourceMaps: false,
  poweredByHeader: false,
  compress: true,
};

export default nextConfig;`,
    hardenedExplanation: 'Minifies code and strips .map endpoints from public access while preserving private Sentry server-side error logging.',
  },
  {
    id: 'headers',
    title: 'Content-Security-Policy & Anti-Clickjacking',
    tag: 'Headers',
    vulnerableLabel: 'Missing Headers (Vulnerable)',
    vulnerableCode: `// ❌ No security headers configured in app
// Browser defaults permit:
// - Clickjacking via <iframe> embedding
// - Insecure HTTP downgrade attacks
// - Arbitrary third-party script injection (XSS)
// - MIME-sniffing drive-by downloads`,
    vulnerableExplanation: 'Default Next.js / Vite apps deploy with zero defense-in-depth headers unless explicitly configured.',
    hardenedLabel: 'ShipSafe Hardened',
    hardenedCode: `// ✅ next.config.mjs with Defense-in-Depth Headers
const headers = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'Content-Security-Policy', value: "default-src 'self'; script-src 'self' 'unsafe-eval'; frame-ancestors 'none';" },
];`,
    hardenedExplanation: 'Prevents clickjacking, enforces HTTPS preload, and restricts unauthorized script and frame injection.',
  },
];

export default function CodeDiffInspector() {
  const [activeTab, setActiveTab] = useState(SAMPLES[0].id);
  const [copied, setCopied] = useState(false);

  const currentSample = SAMPLES.find((s) => s.id === activeTab) || SAMPLES[0];

  const handleCopy = () => {
    navigator.clipboard.writeText(currentSample.hardenedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 pt-4">
      <div className="text-center space-y-2 max-w-2xl mx-auto">
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-white/[0.04] border border-white/10 text-xs font-mono text-neutral-300">
          <Code2 className="h-3.5 w-3.5 text-white" />
          <span>Interactive Vulnerability Inspector</span>
        </div>
        <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
          How AI-Built Apps Get Compromised
        </h2>
        <p className="text-xs md:text-sm text-neutral-400">
          Modern AI coding tools prioritize fast prototyping over defensive architecture. Click each scenario to compare the common vulnerability with the hardened pattern:
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-center gap-2 overflow-x-auto pb-1">
        {SAMPLES.map((sample) => (
          <button
            key={sample.id}
            type="button"
            onClick={() => setActiveTab(sample.id)}
            className={`px-3.5 py-2 rounded-xl text-xs font-mono transition-all flex items-center space-x-2 shrink-0 ${
              activeTab === sample.id
                ? 'bg-white text-black font-semibold shadow-md'
                : 'bg-white/[0.03] text-neutral-400 hover:text-white hover:bg-white/[0.06] border border-white/[0.06]'
            }`}
          >
            <span>{sample.title}</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded font-sans ${
              activeTab === sample.id
                ? 'bg-black/10 text-black font-medium'
                : 'bg-white/[0.05] text-neutral-400'
            }`}>
              {sample.tag}
            </span>
          </button>
        ))}
      </div>

      {/* Side-by-Side Diff Container */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Vulnerable Card */}
        <div className="rounded-2xl border border-red-500/20 bg-[#0B0D11]/90 p-5 space-y-3 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between pb-3 border-b border-red-500/10">
            <div className="flex items-center space-x-2">
              <ShieldAlert className="h-4 w-4 text-red-400" />
              <span className="text-xs font-mono font-bold text-red-400">
                {currentSample.vulnerableLabel}
              </span>
            </div>
            <span className="text-[10px] font-mono text-red-400/80 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">
              Risk: High / Critical
            </span>
          </div>

          <pre className="text-xs font-mono text-neutral-300 bg-[#050608] p-4 rounded-xl border border-white/[0.06] overflow-x-auto leading-relaxed max-h-[300px]">
            {currentSample.vulnerableCode}
          </pre>

          <p className="text-xs text-neutral-400 leading-relaxed bg-red-500/[0.04] p-3 rounded-xl border border-red-500/10">
            <span className="text-red-300 font-semibold">The Flaw: </span>
            {currentSample.vulnerableExplanation}
          </p>
        </div>

        {/* Hardened Card */}
        <div className="rounded-2xl border border-emerald-500/20 bg-[#0B0D11]/90 p-5 space-y-3 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between pb-3 border-b border-emerald-500/10">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span className="text-xs font-mono font-bold text-emerald-400">
                {currentSample.hardenedLabel}
              </span>
            </div>

            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-white/[0.06] hover:bg-white/[0.12] text-xs font-mono text-neutral-200 transition-all border border-white/10"
              title="Copy hardened code snippet"
            >
              {copied ? (
                <>
                  <Check className="h-3 w-3 text-emerald-400" />
                  <span className="text-emerald-400 text-[11px]">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3 text-neutral-400" />
                  <span className="text-[11px]">Copy Snippet</span>
                </>
              )}
            </button>
          </div>

          <pre className="text-xs font-mono text-neutral-200 bg-[#050608] p-4 rounded-xl border border-white/[0.06] overflow-x-auto leading-relaxed max-h-[300px]">
            {currentSample.hardenedCode}
          </pre>

          <p className="text-xs text-neutral-400 leading-relaxed bg-emerald-500/[0.04] p-3 rounded-xl border border-emerald-500/10">
            <span className="text-emerald-300 font-semibold">The Fix: </span>
            {currentSample.hardenedExplanation}
          </p>
        </div>
      </div>
    </div>
  );
}
