'use client';

import React from 'react';
import Header from '@/components/Header';
import FaqSection from '@/components/FaqSection';
import Link from 'next/link';
import { ArrowLeft, Shield, ArrowRight } from 'lucide-react';

export default function FaqPage() {
  return (
    <div className="min-h-screen bg-black text-neutral-100 flex flex-col selection:bg-white selection:text-black relative overflow-x-hidden">
      {/* Top Ambient Spotlight Glow */}
      <div className="pointer-events-none absolute -top-36 left-1/2 -translate-x-1/2 w-[750px] h-[350px] bg-gradient-to-b from-white/[0.08] via-white/[0.02] to-transparent rounded-full blur-3xl z-0" />

      <Header />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8 md:py-14 z-10 space-y-12">
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
            Security &amp; Safety Documentation
          </span>
        </div>

        {/* FAQ Section */}
        <FaqSection />

        {/* Safety Guarantees Callout */}
        <div className="rounded-3xl border border-white/10 bg-[#0B0D11]/90 backdrop-blur-2xl p-8 space-y-4 shadow-xl">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-white/[0.05] border border-white/10 flex items-center justify-center text-white">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Passive Safety &amp; Non-Destructive Guarantee
              </h3>
              <span className="text-xs font-mono text-neutral-400">Zero Exploit Payloads Policy</span>
            </div>
          </div>
          <p className="text-xs md:text-sm text-neutral-400 leading-relaxed">
            ShipSafe operates strictly as a read-only passive hygiene evaluator. It performs standard HTTP GET and HEAD requests against publicly reachable static assets and endpoints. It does not perform state-mutating requests, database fuzzing, SQL injection testing, or credential brute-forcing. It is safe to run against production environments without degrading availability or triggering WAF blocks.
          </p>
          <div className="pt-2">
            <Link
              href="/"
              className="inline-flex items-center space-x-2 text-xs font-semibold text-black bg-white hover:bg-neutral-200 px-4 py-2 rounded-xl transition-all shadow-sm active:scale-[0.98]"
            >
              <span>Execute Live Audit</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-white/[0.08] bg-black py-8 mt-20 text-center text-xs text-neutral-400 font-mono z-10">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span>ShipSafe v1.0 • Documentation &amp; FAQ</span>
          <span>Mapped to OWASP Top 10 (2021) &amp; OWASP ASVS v4.0</span>
        </div>
      </footer>
    </div>
  );
}
