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
    title: 'BaaS Administrative Key Leakage in Client Bundles',
    tag: 'BaaS & Secrets',
    vulnerableLabel: 'Unvalidated Rapid Prototype Pattern',
    vulnerableCode: `// [SECURITY VULNERABILITY] Sensitive administrative secret compiled into client bundle
// app/components/UserDirectory.tsx ('use client')
import { createClient } from '@supabase/supabase-js';

// Leaking service_role key with complete Row-Level Security bypass:
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY! // Full administrative access!
);

export default function UserDirectory() {
  // Client bundle exposes service_role key to any public browser inspection
}`,
    vulnerableExplanation: 'Prefixing private administrative secrets with NEXT_PUBLIC_ forces bundlers to inject live credentials into public JavaScript chunks.',
    hardenedLabel: 'ShipSafe Hardened Architecture',
    hardenedCode: `// [HARDENED IMPLEMENTATION] Server-side runtime isolation
// app/actions/users.ts ('use server')
import { createClient } from '@supabase/supabase-js';

// Server-only runtime: private key is strictly isolated in backend memory
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Isolated in Node runtime
);

export async function getAuthorizedDirectory() {
  const session = await auth();
  if (!session?.user?.isAdmin) throw new Error('Unauthorized');
  return supabaseAdmin.from('users').select('*');
}`,
    hardenedExplanation: 'Administrative keys remain strictly in isolated server memory; public clients receive only authenticated, policy-filtered data.',
  },
  {
    id: 'sourcemaps',
    title: 'Public Production Source Map Exposure',
    tag: 'Build Artifacts',
    vulnerableLabel: 'Permissive Build Configuration',
    vulnerableCode: `// [SECURITY VULNERABILITY] next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Exposes complete unminified TypeScript source code,
  // proprietary logic, and internal API routes via .js.map endpoints:
  productionBrowserSourceMaps: true,
};

export default nextConfig;`,
    vulnerableExplanation: 'Publicly reachable .js.map files enable reverse engineering of your entire proprietary codebase, internal schemas, and developer comments.',
    hardenedLabel: 'ShipSafe Hardened Architecture',
    hardenedCode: `// [HARDENED IMPLEMENTATION] Production build hardening
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Strips all production source maps from publicly accessible assets
  productionBrowserSourceMaps: false,
  poweredByHeader: false,
  compress: true,
};

export default nextConfig;`,
    hardenedExplanation: 'Completely strips source maps from public distribution while retaining private, authenticated server-side telemetry in monitoring services.',
  },
  {
    id: 'headers',
    title: 'Absence of Defense-in-Depth HTTP Headers',
    tag: 'Transport & Framing',
    vulnerableLabel: 'Default Framework Configuration',
    vulnerableCode: `// [SECURITY VULNERABILITY] No defense-in-depth security headers configured
// Unconfigured HTTP response behavior permits:
// 1. UI Redressing & Clickjacking attacks (iframe encapsulation)
// 2. Protocol Downgrade attacks (lack of HSTS preload enforcement)
// 3. Script injection and XSS execution (absence of Content-Security-Policy)
// 4. MIME-type sniffing by malicious external assets`,
    vulnerableExplanation: 'Default Next.js and Vite scaffolding deploy with zero defense-in-depth headers unless institutional security middleware is applied.',
    hardenedLabel: 'ShipSafe Hardened Architecture',
    hardenedCode: `// [HARDENED IMPLEMENTATION] next.config.mjs Security Headers
const headers = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'Content-Security-Policy', value: "default-src 'self'; script-src 'self' 'unsafe-eval'; frame-ancestors 'none';" },
];`,
    hardenedExplanation: 'Enforces anti-clickjacking, strict HTTPS preload, MIME conformance, and origin restrictions at the HTTP transport boundary.',
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
          <span>Vulnerability Analysis &amp; Hardening</span>
        </div>
        <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
          Common AI-Generated Architecture Vulnerabilities
        </h2>
        <p className="text-xs md:text-sm text-neutral-400">
          Rapid-prototyping tooling frequently optimizes for instantaneous execution over defensive design. Examine side-by-side comparative implementations:
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
            <span className="text-red-300 font-semibold">Vulnerability Vector: </span>
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
              title="Copy hardened implementation"
            >
              {copied ? (
                <>
                  <Check className="h-3 w-3 text-emerald-400" />
                  <span className="text-emerald-400 text-[11px]">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3 text-neutral-400" />
                  <span className="text-[11px]">Copy Pattern</span>
                </>
              )}
            </button>
          </div>

          <pre className="text-xs font-mono text-neutral-200 bg-[#050608] p-4 rounded-xl border border-white/[0.06] overflow-x-auto leading-relaxed max-h-[300px]">
            {currentSample.hardenedCode}
          </pre>

          <p className="text-xs text-neutral-400 leading-relaxed bg-emerald-500/[0.04] p-3 rounded-xl border border-emerald-500/10">
            <span className="text-emerald-300 font-semibold">Hardening Pattern: </span>
            {currentSample.hardenedExplanation}
          </p>
        </div>
      </div>
    </div>
  );
}
