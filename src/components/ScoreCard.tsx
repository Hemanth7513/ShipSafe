'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ScanResult, LetterGrade } from '@/lib/types/scan';
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
        bg: 'bg-emerald-500/[0.08]',
        border: 'border-emerald-500/30',
        label: 'Production Hardened',
      };
    case 'B':
      return {
        text: 'text-neutral-200',
        bg: 'bg-white/[0.06]',
        border: 'border-white/20',
        label: 'Good Hygiene',
      };
    case 'C':
      return {
        text: 'text-amber-400',
        bg: 'bg-amber-500/[0.08]',
        border: 'border-amber-500/30',
        label: 'Needs Hardening',
      };
    case 'D':
      return {
        text: 'text-orange-400',
        bg: 'bg-orange-500/[0.08]',
        border: 'border-orange-500/30',
        label: 'High Risk',
      };
    case 'F':
      return {
        text: 'text-red-400',
        bg: 'bg-red-500/[0.08]',
        border: 'border-red-500/30',
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
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="w-full max-w-5xl mx-auto mb-10"
    >
      <div className="rounded-3xl border border-white/10 bg-[#0B0D11]/90 backdrop-blur-2xl p-6 md:p-8 shadow-2xl relative overflow-hidden shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)]">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
          {/* Left: Grade & Score */}
          <div className="flex items-center space-x-6">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
              className={`h-28 w-28 rounded-2xl flex flex-col items-center justify-center border ${gradeStyle.border} ${gradeStyle.bg} transition-all`}
            >
              <span className={`text-5xl font-black font-mono tracking-tight ${gradeStyle.text}`}>
                {result.grade}
              </span>
              <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 mt-1">
                Score {result.overallScore}/100
              </span>
            </motion.div>

            <div className="space-y-1.5">
              <div className="flex items-center space-x-2">
                <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${gradeStyle.border} ${gradeStyle.bg} ${gradeStyle.text}`}>
                  {gradeStyle.label}
                </span>
                {result.isDemoTarget && (
                  <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-white/[0.05] text-neutral-400 border border-white/10">
                    Safe Demo Target
                  </span>
                )}
              </div>

              <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">
                {result.targetHost}
              </h2>

              <p className="text-xs text-neutral-400 font-mono">
                Duration: {(result.durationMs / 1000).toFixed(2)}s • Stack: {result.frameworkDetected || 'Generic Web App'} • IP: {result.resolvedIp}
              </p>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center space-x-3 w-full lg:w-auto justify-end">
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={handleCopyMarkdown}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 text-xs font-medium text-neutral-200 transition-all shadow-sm"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 text-emerald-400" />
                  <span className="text-emerald-400 font-semibold">Report Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 text-neutral-400" />
                  <span>Export Markdown</span>
                </>
              )}
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={onReset}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-white hover:bg-neutral-200 text-black text-xs font-semibold transition-all shadow-md"
            >
              <RotateCcw className="h-4 w-4" />
              <span>New Audit</span>
            </motion.button>
          </div>
        </div>

        {/* Severity Metrics Bar */}
        <div className="mt-8 pt-6 border-t border-white/[0.06] grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="bg-[#050608]/70 rounded-xl p-3.5 border border-white/[0.06] text-center">
            <div className="text-lg font-bold text-red-400 font-mono">
              {result.severityCounts.critical}
            </div>
            <div className="text-[11px] text-neutral-400 uppercase tracking-wider font-medium mt-0.5">Critical</div>
          </div>

          <div className="bg-[#050608]/70 rounded-xl p-3.5 border border-white/[0.06] text-center">
            <div className="text-lg font-bold text-orange-400 font-mono">
              {result.severityCounts.high}
            </div>
            <div className="text-[11px] text-neutral-400 uppercase tracking-wider font-medium mt-0.5">High</div>
          </div>

          <div className="bg-[#050608]/70 rounded-xl p-3.5 border border-white/[0.06] text-center">
            <div className="text-lg font-bold text-amber-400 font-mono">
              {result.severityCounts.medium}
            </div>
            <div className="text-[11px] text-neutral-400 uppercase tracking-wider font-medium mt-0.5">Medium</div>
          </div>

          <div className="bg-[#050608]/70 rounded-xl p-3.5 border border-white/[0.06] text-center">
            <div className="text-lg font-bold text-neutral-200 font-mono">
              {result.severityCounts.low}
            </div>
            <div className="text-[11px] text-neutral-400 uppercase tracking-wider font-medium mt-0.5">Low</div>
          </div>

          <div className="bg-[#050608]/70 rounded-xl p-3.5 border border-white/[0.06] text-center col-span-2 sm:col-span-1">
            <div className="text-lg font-bold text-neutral-400 font-mono">
              {result.severityCounts.info}
            </div>
            <div className="text-[11px] text-neutral-400 uppercase tracking-wider font-medium mt-0.5">Info / Safe</div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
