'use client';

import React, { useEffect, useState } from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';

interface TerminalStepperProps {
  targetUrl: string;
}

const STEPS = [
  { id: 'ssrf', text: 'Resolving DNS and enforcing SSRF boundary (RFC 6890 / 1918)...' },
  { id: 'headers', text: 'Inspecting HTTP response headers and Set-Cookie directives...' },
  { id: 'scripts', text: 'Parsing HTML structure to locate client-side JavaScript bundles...' },
  { id: 'secrets', text: 'Analyzing scripts with Shannon Entropy (H >= 3.6) & BaaS disambiguator...' },
  { id: 'artifacts', text: 'Probing build artifact signatures (/.env, /.git, .js.map)...' },
  { id: 'scoring', text: 'Computing weighted score, assigning letter grade & generating AI fix prompts...' },
];

export default function TerminalStepper({ targetUrl }: TerminalStepperProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStepIndex((prev) => {
        if (prev < STEPS.length - 1) return prev + 1;
        return prev;
      });
    }, 450);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full max-w-3xl mx-auto my-8">
      <div className="rounded-2xl border border-white/10 bg-slate-950/80 backdrop-blur-2xl shadow-2xl overflow-hidden">
        {/* Terminal Title Bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.08] bg-white/[0.02]">
          <div className="flex items-center space-x-2">
            <div className="h-3 w-3 rounded-full bg-red-500/80"></div>
            <div className="h-3 w-3 rounded-full bg-yellow-500/80"></div>
            <div className="h-3 w-3 rounded-full bg-emerald-500/80"></div>
            <span className="text-xs font-mono text-slate-500 ml-2">shipsafe-agent --audit</span>
          </div>
          <div className="flex items-center space-x-1.5 text-[11px] font-mono text-slate-400">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-ping"></span>
            <span>Target: {targetUrl}</span>
          </div>
        </div>

        {/* Terminal Logs Body */}
        <div className="p-6 font-mono text-xs space-y-3 min-h-[260px]">
          {STEPS.slice(0, currentStepIndex + 1).map((step, idx) => {
            const isCompleted = idx < currentStepIndex;
            const isCurrent = idx === currentStepIndex;

            return (
              <div key={step.id} className="flex items-start space-x-3 transition-opacity duration-300">
                <span className="text-slate-600 select-none">
                  [00:0{idx + 1}]
                </span>

                {isCompleted ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : isCurrent ? (
                  <Loader2 className="h-4 w-4 text-cyan-400 animate-spin shrink-0 mt-0.5" />
                ) : null}

                <span className={isCompleted ? 'text-slate-300' : 'text-cyan-300 font-medium'}>
                  {step.text}
                </span>
              </div>
            );
          })}
        </div>

        {/* Progress Bar */}
        <div className="h-1 w-full bg-slate-900 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 via-cyan-500 to-indigo-500 transition-all duration-300 shadow-[0_0_12px_rgba(6,182,212,0.8)]"
            style={{ width: `${Math.round(((currentStepIndex + 1) / STEPS.length) * 100)}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
}
