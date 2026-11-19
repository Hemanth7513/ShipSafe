'use client';

import React, { useState } from 'react';
import { ChevronDown, HelpCircle, Shield, Lock, Zap, FileCode } from 'lucide-react';

interface FaqItem {
  question: string;
  answer: string;
  icon: React.ComponentType<{ className?: string }>;
}

const FAQS: FaqItem[] = [
  {
    question: 'How is ShipSafe different from active penetration scanners like OWASP ZAP or Burp Suite?',
    answer: 'ShipSafe is strictly passive and zero-setup. Unlike active scanners, it never injects malicious payloads, performs SQL fuzzing, or attempts brute-force authentication. It inspects public assets (HTTP headers, client JavaScript chunks, robots.txt, and public endpoint configurations) exactly like a browser or search engine crawler would. There is zero risk of crashing databases or corrupting live user state.',
    icon: Shield,
  },
  {
    question: 'How does ShipSafe prevent false positives on modern Single Page Applications (Next.js, Vite, React)?',
    answer: 'Traditional scanners check if a request to /.env or /.git/config returns HTTP 200. On modern SPAs with wildcard catch-all routing (e.g. Next.js App Router or Vite rewrites), 404 pages often return HTTP 200 HTML templates, causing false alarms. ShipSafe inspects structural signatures, MIME types, and Shannon character entropy to verify that an artifact is genuinely an env or source map file, not an HTML error page.',
    icon: FileCode,
  },
  {
    question: 'Why doesn’t ShipSafe flag normal Supabase anon keys as security vulnerabilities?',
    answer: 'Supabase anon keys are intended to be public client tokens. Flagging them indiscriminately creates noise. ShipSafe decodes the JWT payload in-memory without contacting external servers and checks the token role: `role === "anon"` is marked as INFO (with an RLS reminder), whereas `role === "service_role"` (which bypasses all Row-Level Security) is flagged as a CRITICAL 40-point deduction.',
    icon: Zap,
  },
  {
    question: 'Are audited URLs, target tokens, or customer data stored on your servers?',
    answer: 'No. ShipSafe follows an ephemeral execution model. Audit inspections run purely in-memory in isolated serverless runtime instances. Target assets, headers, and decoded tokens are immediately discarded from memory once the report response is returned. Only your local browser storage keeps your recent scan history if you choose to save it.',
    icon: Lock,
  },
];

export default function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <div className="space-y-6 pt-4">
      <div className="text-center space-y-2 max-w-2xl mx-auto">
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-white/[0.04] border border-white/10 text-xs font-mono text-neutral-300">
          <HelpCircle className="h-3.5 w-3.5 text-white" />
          <span>Architecture &amp; Safety FAQ</span>
        </div>
        <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
          Frequently Asked Questions
        </h2>
        <p className="text-xs md:text-sm text-neutral-400">
          Everything you need to know about passive hygiene auditing, safety guarantees, and how ShipSafe operates:
        </p>
      </div>

      <div className="max-w-3xl mx-auto space-y-3">
        {FAQS.map((faq, index) => {
          const isOpen = openIndex === index;
          const Icon = faq.icon;
          return (
            <div
              key={faq.question}
              className={`rounded-2xl border transition-all overflow-hidden ${
                isOpen 
                  ? 'bg-[#0B0D11] border-white/20 shadow-lg' 
                  : 'bg-[#0B0D11]/60 border-white/[0.08] hover:border-white/15'
              }`}
            >
              <button
                type="button"
                onClick={() => toggle(index)}
                className="w-full p-5 text-left flex items-center justify-between gap-4 select-none"
              >
                <div className="flex items-center space-x-3.5">
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 border transition-colors ${
                    isOpen ? 'bg-white text-black border-white' : 'bg-white/[0.05] text-neutral-300 border-white/10'
                  }`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <h3 className="text-sm md:text-base font-semibold text-white">
                    {faq.question}
                  </h3>
                </div>

                <div className={`transform transition-transform shrink-0 text-neutral-400 ${isOpen ? 'rotate-180' : ''}`}>
                  <ChevronDown className="h-4 w-4" />
                </div>
              </button>

              {isOpen && (
                <div className="px-5 pb-5 pt-1 text-xs md:text-sm text-neutral-400 leading-relaxed border-t border-white/[0.04]">
                  {faq.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
