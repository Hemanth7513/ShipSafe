'use client';

import React, { useState } from 'react';
import { Check, BarChart3 } from 'lucide-react';

interface FindingSimItem {
  id: string;
  category: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  deduction: number;
  selected: boolean;
}

const DEFAULT_FINDINGS: FindingSimItem[] = [
  {
    id: 'f1',
    category: 'BaaS & Secrets',
    severity: 'critical',
    title: 'Leaked Supabase service_role Key in Client Bundle',
    deduction: 40,
    selected: true,
  },
  {
    id: 'f2',
    category: 'Build Artifacts',
    severity: 'high',
    title: 'Exposed Production Source Map (.js.map)',
    deduction: 25,
    selected: true,
  },
  {
    id: 'f3',
    category: 'Secrets',
    severity: 'high',
    title: 'Leaked Third-Party API Key (Stripe / OpenAI)',
    deduction: 25,
    selected: false,
  },
  {
    id: 'f4',
    category: 'Headers',
    severity: 'medium',
    title: 'Missing Content-Security-Policy (CSP)',
    deduction: 12,
    selected: true,
  },
  {
    id: 'f5',
    category: 'Headers',
    severity: 'medium',
    title: 'Missing Strict-Transport-Security (HSTS)',
    deduction: 12,
    selected: false,
  },
  {
    id: 'f6',
    category: 'Cookies',
    severity: 'low',
    title: 'Session Cookie Missing HttpOnly Directive',
    deduction: 8,
    selected: false,
  },
  {
    id: 'f7',
    category: 'Headers',
    severity: 'low',
    title: 'Missing X-Content-Type-Options: nosniff',
    deduction: 5,
    selected: true,
  },
];

function calculateGrade(score: number): { grade: string; color: string; bg: string; border: string; desc: string } {
  if (score >= 95) return { grade: 'A+', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', desc: 'Flawless institutional hygiene' };
  if (score >= 85) return { grade: 'A', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', desc: 'Robust defense-in-depth posture' };
  if (score >= 70) return { grade: 'B', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30', desc: 'Acceptable hygiene with minor gaps' };
  if (score >= 50) return { grade: 'C', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30', desc: 'Moderate hygiene deficiencies' };
  if (score >= 30) return { grade: 'D', color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30', desc: 'Vulnerable rapid-prototype posture' };
  return { grade: 'F', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30', desc: 'Critical exposure: immediate remediation needed' };
}

export default function ScoringSimulator() {
  const [items, setItems] = useState<FindingSimItem[]>(DEFAULT_FINDINGS);

  const toggleItem = (id: string) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, selected: !item.selected } : item));
  };

  const totalDeductions = items.filter(i => i.selected).reduce((acc, curr) => acc + curr.deduction, 0);
  const score = Math.max(0, 100 - totalDeductions);
  const gradeInfo = calculateGrade(score);

  const selectedCount = items.filter(i => i.selected).length;

  const setPreset = (mode: 'clean' | 'typical' | 'compromised') => {
    if (mode === 'clean') {
      setItems(items.map(i => ({ ...i, selected: false })));
    } else if (mode === 'typical') {
      setItems(items.map(i => ({ ...i, selected: ['f1', 'f2', 'f4', 'f7'].includes(i.id) })));
    } else {
      setItems(items.map(i => ({ ...i, selected: true })));
    }
  };

  return (
    <div className="rounded-3xl border border-white/10 bg-[#0B0D11]/90 backdrop-blur-2xl p-6 md:p-8 space-y-6 shadow-2xl relative overflow-hidden shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="inline-flex items-center space-x-2 text-[11px] font-mono text-neutral-400">
            <BarChart3 className="h-3.5 w-3.5 text-white" />
            <span>Interactive Algorithmic Model</span>
          </div>
          <h3 className="text-lg md:text-xl font-bold text-white tracking-tight">
            Deterministic Scoring &amp; Letter Grade Simulator
          </h3>
          <p className="text-xs text-neutral-400 max-w-xl">
            Toggle simulated security gaps to observe how weighted deductions dynamically impact your application’s final hygiene rating.
          </p>
        </div>

        <div className="flex items-center space-x-1.5">
          <button
            type="button"
            onClick={() => setPreset('clean')}
            className="text-[10px] font-mono px-2.5 py-1 rounded bg-white/[0.04] hover:bg-white/[0.08] text-neutral-300 border border-white/10 transition-colors"
          >
            Clean (A+)
          </button>
          <button
            type="button"
            onClick={() => setPreset('typical')}
            className="text-[10px] font-mono px-2.5 py-1 rounded bg-white/[0.04] hover:bg-white/[0.08] text-neutral-300 border border-white/10 transition-colors"
          >
            Vibe MVP (D)
          </button>
          <button
            type="button"
            onClick={() => setPreset('compromised')}
            className="text-[10px] font-mono px-2.5 py-1 rounded bg-white/[0.04] hover:bg-white/[0.08] text-neutral-300 border border-white/10 transition-colors"
          >
            Breached (F)
          </button>
        </div>
      </div>

      {/* Live Score Output Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-5 rounded-2xl bg-[#050608] border border-white/[0.08] items-center">
        {/* Score */}
        <div className="flex items-center space-x-4 sm:border-r sm:border-white/[0.06] pr-4">
          <div className="text-4xl md:text-5xl font-black font-mono text-white tracking-tight">
            {score}
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 block">
              Calculated Score
            </span>
            <span className="text-xs text-neutral-400 font-mono">
              Base 100 - {totalDeductions} pts
            </span>
          </div>
        </div>

        {/* Grade */}
        <div className="flex items-center space-x-4 sm:border-r sm:border-white/[0.06] pr-4">
          <div className={`px-4 py-2 rounded-2xl border font-black text-2xl font-mono ${gradeInfo.bg} ${gradeInfo.border} ${gradeInfo.color}`}>
            {gradeInfo.grade}
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 block">
              Hygiene Grade
            </span>
            <span className="text-xs text-neutral-300 font-medium">
              {gradeInfo.desc}
            </span>
          </div>
        </div>

        {/* Selected findings count */}
        <div className="space-y-1 sm:pl-2">
          <div className="flex items-center justify-between text-xs font-mono text-neutral-400">
            <span>Deductions Active:</span>
            <span className="text-white font-bold">{selectedCount} findings</span>
          </div>
          <div className="h-2 w-full bg-white/[0.05] rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 rounded-full ${
                score >= 85 ? 'bg-emerald-400' : score >= 50 ? 'bg-amber-400' : 'bg-red-500'
              }`}
              style={{ width: `${score}%` }}
            />
          </div>
        </div>
      </div>

      {/* Checkboxes List */}
      <div className="space-y-2">
        <span className="text-[11px] font-mono text-neutral-500 block">
          Simulate Hygiene Gaps (Click to Toggle):
        </span>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {items.map((item) => (
            <div
              key={item.id}
              onClick={() => toggleItem(item.id)}
              className={`cursor-pointer rounded-xl border p-3 transition-all flex items-center justify-between select-none ${
                item.selected
                  ? 'bg-white/[0.04] border-white/20 text-white'
                  : 'bg-[#050608]/60 border-white/[0.05] text-neutral-400 hover:border-white/10 hover:text-neutral-300'
              }`}
            >
              <div className="flex items-center space-x-3 min-w-0 pr-2">
                <div className={`h-4 w-4 rounded flex items-center justify-center border shrink-0 transition-colors ${
                  item.selected ? 'bg-white border-white text-black' : 'border-white/20 bg-transparent'
                }`}>
                  {item.selected && <Check className="h-3 w-3 stroke-[3]" />}
                </div>

                <div className="truncate">
                  <span className={`text-xs font-mono truncate block ${item.selected ? 'text-white' : 'text-neutral-400'}`}>
                    {item.title}
                  </span>
                  <span className="text-[10px] text-neutral-500 font-mono">
                    {item.category}
                  </span>
                </div>
              </div>

              <span className={`text-xs font-mono font-bold shrink-0 px-2 py-0.5 rounded border ${
                item.severity === 'critical'
                  ? 'bg-red-500/10 text-red-400 border-red-500/20'
                  : item.severity === 'high'
                  ? 'bg-orange-500/10 text-orange-400 border-orange-500/20'
                  : item.severity === 'medium'
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  : 'bg-neutral-500/10 text-neutral-400 border-white/10'
              }`}>
                -{item.deduction}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
