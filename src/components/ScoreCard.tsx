'use client';

import React, { useState } from 'react';
import { ScanResult, LetterGrade } from '@/lib/types/scanner';
import { generateMarkdownReport } from '@/lib/scanner/scoring/engine';
import { Copy, Check, RotateCcw } from 'lucide-react';

interface ScoreCardProps {
  result: ScanResult;
  onReset: () => void;
}

function getGradeStyles(grade: LetterGrade) {
  switch (grade) {
    case 'A':
      return {
        text: 'text-emerald-400',
        bg: 'bg-emerald-500/10',
        border: 'border-emerald-500/30',
        glow: 'shadow-[0_0_35px_rgba(16,185,129,0.25)]',
        label: 'Production Hardened',
      };
    case 'B':
      return {
        text: 'text-cyan-400',
        bg: 'bg-cyan-500/10',
        border: 'border-cyan-500/30',
        glow: 'shadow-[0_0_35px_rgba(6,182,212,0.25)]',
        label: 'Good Hygiene',
      };
    case 'C':
      return {
        text: 'text-amber-400',
        bg: 'bg-amber-500/10',
        border: 'border-amber-500/30',
        glow: 'shadow-[0_0_35px_rgba(245,158,11,0.25)]',
        label: 'Needs Hardening',
      };
    case 'D':
      return {
        text: 'text-orange-400',
        bg: 'bg-orange-500/10',
        border: 'border-orange-500/30',
        glow: 'shadow-[0_0_35px_rgba(249,115,22,0.25)]',
        label: 'High Risk',
      };
    case 'F':
      return {
        text: 'text-red-400',
        bg: 'bg-red-500/10',
        border: 'border-red-500/30',
        glow: 'shadow-[0_0_35px_rgba(239,68,68,0.3)]',
        label: 'Critical Leaks Detected',
      };
  }
}

export default function ScoreCard({ result, onReset }: ScoreCardProps) {
  const [copied, setCopied] = useState(false);
  const gradeStyle = getGradeStyles(result.grade);

  const handleCopyMarkdown = () => {
    const md = generateMarkdownReport(result);
    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="w-full max-w-5xl mx-auto mb-10">
      <div className="rounded-3xl border border-white/10 bg-slate-900/60 backdrop-blur-2xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent"></div>

        <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
          {/* Left: Grade & Score */}
          <div className="flex items-center space-x-6">
            <div
              className={`h-28 w-28 rounded-2xl flex flex-col items-center justify-center border ${gradeStyle.border} ${gradeStyle.bg} ${gradeStyle.glow} transition-all`}
            >
              <span className={`text-5xl font-black font-mono tracking-tight ${gradeStyle.text}`}>
                {result.grade}
              </span>
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mt-1">
                Score {result.overallScore}/100
              </span>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center space-x-2">
                <span className={`text-sm font-semibold px-2.5 py-0.5 rounded-full border ${gradeStyle.border} ${gradeStyle.bg} ${gradeStyle.text}`}>
                  {gradeStyle.label}
                </span>
                {result.isDemoTarget && (
                  <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    Safe Demo Target
                  </span>
                )}
              </div>

              <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">
                {result.targetHost}
              </h2>

              <p className="text-xs text-slate-400 font-mono">
                Scanned in {(result.durationMs / 1000).toFixed(2)}s • Stack: {result.frameworkDetected || 'Generic Web App'} • IP: {result.resolvedIp}
              </p>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center space-x-3 w-full lg:w-auto justify-end">
            <button
              onClick={handleCopyMarkdown}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 text-xs font-medium text-slate-200 transition-all shadow-sm"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 text-emerald-400" />
                  <span className="text-emerald-400 font-semibold">Report Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 text-slate-400" />
                  <span>Export Markdown</span>
                </>
              )}
            </button>

            <button
              onClick={onReset}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-xs font-medium text-cyan-400 transition-all shadow-sm"
            >
              <RotateCcw className="h-4 w-4" />
              <span>New Audit</span>
            </button>
          </div>
        </div>

        {/* Severity Metrics Bar */}
        <div className="mt-8 pt-6 border-t border-white/[0.08] grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="bg-slate-950/40 rounded-xl p-3 border border-white/[0.05] text-center">
            <div className="text-lg font-bold text-red-400 font-mono">
              {result.severityCounts.critical}
            </div>
            <div className="text-[11px] text-slate-400 uppercase tracking-wider font-medium">Critical</div>
          </div>

          <div className="bg-slate-950/40 rounded-xl p-3 border border-white/[0.05] text-center">
            <div className="text-lg font-bold text-orange-400 font-mono">
              {result.severityCounts.high}
            </div>
            <div className="text-[11px] text-slate-400 uppercase tracking-wider font-medium">High</div>
          </div>

          <div className="bg-slate-950/40 rounded-xl p-3 border border-white/[0.05] text-center">
            <div className="text-lg font-bold text-amber-400 font-mono">
              {result.severityCounts.medium}
            </div>
            <div className="text-[11px] text-slate-400 uppercase tracking-wider font-medium">Medium</div>
          </div>

          <div className="bg-slate-950/40 rounded-xl p-3 border border-white/[0.05] text-center">
            <div className="text-lg font-bold text-cyan-400 font-mono">
              {result.severityCounts.low}
            </div>
            <div className="text-[11px] text-slate-400 uppercase tracking-wider font-medium">Low</div>
          </div>

          <div className="bg-slate-950/40 rounded-xl p-3 border border-white/[0.05] text-center col-span-2 sm:col-span-1">
            <div className="text-lg font-bold text-slate-400 font-mono">
              {result.severityCounts.info}
            </div>
            <div className="text-[11px] text-slate-400 uppercase tracking-wider font-medium">Info / Safe</div>
          </div>
        </div>
      </div>
    </div>
  );
}
