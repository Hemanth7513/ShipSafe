'use client';

import React from 'react';
import Header from '@/components/Header';
import CodeDiffInspector from '@/components/CodeDiffInspector';
import JwtDisambiguator from '@/components/JwtDisambiguator';
import Link from 'next/link';
import { ArrowLeft, Shield } from 'lucide-react';

export default function VulnerabilitiesPage() {
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
            Vulnerability Analysis Lab
          </span>
        </div>

        {/* Live In-Memory JWT Disambiguator */}
        <JwtDisambiguator />

        {/* Interactive Code Diff Inspector */}
        <CodeDiffInspector />

        {/* Bottom CTA to Audit Target */}
        <div className="rounded-3xl border border-white/10 bg-[#0B0D11]/90 backdrop-blur-2xl p-8 text-center space-y-4 max-w-2xl mx-auto shadow-2xl">
          <h3 className="text-lg font-bold text-white tracking-tight">
            Verify Your Web Application Against These Flaws
          </h3>
          <p className="text-xs text-neutral-400 leading-relaxed">
            Run ShipSafe’s 10-second passive auditor to verify whether your frontend bundles, BaaS tokens, or HTTP headers exhibit these vulnerabilities.
          </p>
          <div className="pt-2">
            <Link
              href="/"
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-white hover:bg-neutral-200 text-black text-xs font-semibold transition-all shadow-sm active:scale-[0.98]"
            >
              <Shield className="h-4 w-4 text-black" />
              <span>Launch Security Assessment</span>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-white/[0.08] bg-black py-8 mt-20 text-center text-xs text-neutral-400 font-mono z-10">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span>ShipSafe v1.0 • Vulnerability Analysis Lab</span>
          <span>Mapped to OWASP Top 10 (2021) &amp; OWASP ASVS v4.0</span>
        </div>
      </footer>
    </div>
  );
}
