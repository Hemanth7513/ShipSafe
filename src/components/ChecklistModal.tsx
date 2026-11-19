'use client';

import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, ShieldCheck, RotateCcw, AlertCircle } from 'lucide-react';

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
    title: 'Row-Level Security (RLS) Active',
    category: 'Database / BaaS',
    description: 'Ensure RLS is enabled on all Supabase/Postgres tables. Even if anon keys leak, RLS stops unauthorized table dumps.',
    recommendation: 'Run `ALTER TABLE <table_name> ENABLE ROW LEVEL SECURITY;` and write granular SELECT/INSERT policies.',
    owasp: 'A01: Broken Access Control',
  },
  {
    id: 'sourcemaps',
    title: 'Production Source Maps Disabled',
    category: 'Bundles & Artifacts',
    description: 'Prevent client bundles from exposing `.js.map` files that leak raw TypeScript/JSX source code, backend routes, and internal comments.',
    recommendation: 'Set `productionBrowserSourceMaps: false` in `next.config.js` or `build.sourcemap = false` in `vite.config.ts`.',
    owasp: 'A05: Security Misconfiguration',
  },
  {
    id: 'env_prefix',
    title: 'Secret Prefix Isolation',
    category: 'Secrets & Auth',
    description: 'Never prefix private database URLs, service role keys, or Stripe webhook secrets with `NEXT_PUBLIC_` or `VITE_`.',
    recommendation: 'Audit your `.env` files. Public prefixes are compiled directly into client-side JS bundles.',
    owasp: 'A07: Identification & Auth Failures',
  },
  {
    id: 'csp',
    title: 'Content-Security-Policy (CSP) Active',
    category: 'Headers & XSS',
    description: 'Restrict script execution origins and avoid unhashed/unnonced `unsafe-inline` in `script-src` to mitigate XSS vectors.',
    recommendation: 'Configure strict CSP headers in middleware or server configuration with nonces for dynamic scripts.',
    owasp: 'A05: Security Misconfiguration',
  },
  {
    id: 'hsts',
    title: 'HSTS with 2-Year Preload Configured',
    category: 'Transport Security',
    description: 'Enforce HTTPS downgrade prevention and SSL stripping protection across all subdomains.',
    recommendation: 'Set `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload` header.',
    owasp: 'A02: Cryptographic Failures',
  },
  {
    id: 'ratelimit',
    title: 'API Mutation Rate Limiting',
    category: 'Application Logic',
    description: 'Protect login, sign-up, AI generation endpoints, and checkout flows against automated brute-force and credential stuffing.',
    recommendation: 'Add Upstash Redis or memory-based sliding window rate limiters (e.g., 5-10 req/min per IP on sensitive routes).',
    owasp: 'A04: Insecure Design',
  },
  {
    id: 'cors',
    title: 'Explicit Origin CORS Restrictions',
    category: 'API Security',
    description: 'Avoid wildcard `Access-Control-Allow-Origin: *` on private or authenticated REST/GraphQL API endpoints.',
    recommendation: 'Specify explicit client domain origins and validate `Origin` header dynamically against an allowlist.',
    owasp: 'A01: Broken Access Control',
  },
];

const STORAGE_KEY = 'shipsafe_launch_checklist';

interface ChecklistModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ChecklistModal({ isOpen, onClose }: ChecklistModalProps) {
  const [checkedIds, setCheckedIds] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setCheckedIds(JSON.parse(stored));
      }
    } catch {
      // ignore JSON parse or storage errors
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
      // ignore storage error
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

  if (!isOpen) return null;

  const total = CHECKLIST_ITEMS.length;
  const completed = checkedIds.length;
  const percentage = Math.round((completed / total) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-fadeIn">
      {/* Modal Dialog Card */}
      <div 
        className="w-full max-w-2xl bg-[#0B0D11] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-6 border-b border-white/[0.08] flex items-center justify-between bg-black/40">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-white/[0.06] border border-white/10 flex items-center justify-center">
              <ShieldCheck className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight flex items-center space-x-2">
                <span>Pre-Launch Security Protocol</span>
              </h2>
              <p className="text-xs text-neutral-400">Pre-deployment security hygiene verification for modern web applications</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 flex items-center justify-center text-neutral-400 hover:text-white transition-all"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Progress Tracker */}
        <div className="px-6 py-4 bg-white/[0.02] border-b border-white/[0.06] flex items-center justify-between gap-4">
          <div className="flex-1 space-y-1.5">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-neutral-400">Hardening Conformance:</span>
              <span className="text-white font-semibold">{completed} / {total} Verified ({percentage}%)</span>
            </div>
            <div className="h-2 w-full bg-[#050608] rounded-full overflow-hidden border border-white/[0.06]">
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

          {completed > 0 && (
            <button
              type="button"
              onClick={handleReset}
              className="text-xs font-mono text-neutral-400 hover:text-white flex items-center space-x-1 px-2.5 py-1.5 rounded-lg border border-white/[0.08] hover:bg-white/[0.05] transition-all shrink-0"
              title="Reset checklist"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Reset</span>
            </button>
          )}
        </div>

        {/* Checklist Items Scroll Area */}
        <div className="p-6 overflow-y-auto space-y-3.5 divide-y divide-white/[0.04]">
          {CHECKLIST_ITEMS.map((item) => {
            const isChecked = mounted && checkedIds.includes(item.id);
            return (
              <div
                key={item.id}
                onClick={() => toggleItem(item.id)}
                className={`pt-3.5 first:pt-0 cursor-pointer group flex items-start space-x-3.5 p-3 rounded-2xl transition-all ${
                  isChecked
                    ? 'bg-white/[0.03] border border-white/[0.08]'
                    : 'hover:bg-white/[0.02] border border-transparent'
                }`}
              >
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

                <div className="flex-1 space-y-1">
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

                  <div className="text-[11px] font-mono text-neutral-400 bg-[#050608] p-2 rounded-lg border border-white/[0.04] mt-1.5">
                    <span className="text-neutral-300 font-medium">Directive: </span>
                    {item.recommendation}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-black/60 border-t border-white/[0.08] flex items-center justify-between text-xs text-neutral-400">
          <div className="flex items-center space-x-1.5">
            <AlertCircle className="h-3.5 w-3.5 text-neutral-400" />
            <span>Progress automatically saved to local browser storage</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white hover:bg-neutral-200 text-black font-semibold text-xs transition-all shadow-sm active:scale-[0.98]"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
