'use client';

import React, { useState } from 'react';
import { Finding, FindingSeverity } from '@/lib/types/scanner';
import { AlertCircle, AlertTriangle, Info, Check, Copy, ChevronDown, ChevronUp, Bot } from 'lucide-react';

interface FindingCardProps {
  finding: Finding;
  index?: number;
}

function getSeverityBadge(severity: FindingSeverity) {
  switch (severity) {
    case 'critical':
      return {
        text: 'text-red-400',
        bg: 'bg-red-500/10',
        border: 'border-red-500/25',
        label: 'CRITICAL',
        icon: AlertCircle
      };
    case 'high':
      return {
        text: 'text-orange-400',
        bg: 'bg-orange-500/10',
        border: 'border-orange-500/25',
        label: 'HIGH',
        icon: AlertTriangle
      };
    case 'medium':
      return {
        text: 'text-amber-400',
        bg: 'bg-amber-500/10',
        border: 'border-amber-500/25',
        label: 'MEDIUM',
        icon: AlertTriangle
      };
    case 'low':
      return {
        text: 'text-cyan-400',
        bg: 'bg-cyan-500/10',
        border: 'border-cyan-500/25',
        label: 'LOW',
        icon: Info
      };
    case 'info':
      return {
        text: 'text-slate-400',
        bg: 'bg-slate-500/10',
        border: 'border-slate-500/25',
        label: 'INFO',
        icon: Info
      };
  }
}

export default function FindingCard({ finding }: FindingCardProps) {
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [expandedPrompt, setExpandedPrompt] = useState(false);

  const badge = getSeverityBadge(finding.severity);
  const IconComponent = badge.icon;

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(finding.fixPrompt);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2500);
  };

  return (
    <div className="w-full rounded-2xl border border-white/10 bg-slate-900/40 backdrop-blur-xl p-5 md:p-6 shadow-lg hover:border-white/20 transition-all space-y-4">
      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-2.5">
          <span className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-bold border ${badge.border} ${badge.bg} ${badge.text}`}>
            <IconComponent className="h-3.5 w-3.5" />
            <span>{badge.label}</span>
          </span>

          <span className="text-xs font-mono text-slate-500 px-2 py-0.5 rounded-md bg-white/[0.04]">
            {finding.category.toUpperCase()}
          </span>

          {finding.owaspMapping && (
            <span className="hidden md:inline-block text-[11px] font-mono text-slate-500 truncate max-w-[280px]">
              {finding.owaspMapping}
            </span>
          )}
        </div>

        {finding.deduction > 0 && (
          <span className="text-xs font-mono font-semibold text-red-400/90 self-start sm:self-auto">
            -{finding.deduction} pts
          </span>
        )}
      </div>

      {/* Title */}
      <h3 className="text-base md:text-lg font-semibold text-white leading-snug">
        {finding.title}
      </h3>

      {/* Asset location if present */}
      {finding.assetUrl && (
        <div className="flex items-center space-x-2 text-xs font-mono text-slate-400 bg-slate-950/50 rounded-lg px-3 py-1.5 border border-white/[0.04] overflow-x-auto">
          <span className="text-slate-500 shrink-0">Asset:</span>
          <span className="text-cyan-400/90 truncate">{finding.assetUrl}</span>
        </div>
      )}

      {/* Evidence snippet if present */}
      {finding.maskedEvidence && (
        <div className="space-y-1">
          <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500">
            Evidence (Redacted):
          </span>
          <pre className="text-xs font-mono text-amber-300 bg-slate-950/70 p-3 rounded-xl border border-amber-500/20 overflow-x-auto whitespace-pre-wrap">
            {finding.maskedEvidence}
          </pre>
        </div>
      )}

      {/* Plain-English Impact */}
      <div className="bg-slate-950/30 rounded-xl p-3.5 border border-white/[0.05] space-y-1">
        <span className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
          <span>Business & Security Impact:</span>
        </span>
        <p className="text-xs text-slate-400 leading-relaxed">
          {finding.impact}
        </p>
      </div>

      {/* AI Remediation Box */}
      <div className="pt-2">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-gradient-to-r from-emerald-500/5 via-cyan-500/5 to-transparent rounded-xl p-3 border border-emerald-500/20">
          <div className="flex items-center space-x-2.5">
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <Bot className="h-4 w-4 text-emerald-400" />
            </div>
            <div>
              <div className="text-xs font-semibold text-white">AI Remediation Prompt</div>
              <div className="text-[11px] text-slate-400">Copy straight into Cursor, Claude, or ChatGPT</div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setExpandedPrompt(!expandedPrompt)}
              className="text-xs text-slate-400 hover:text-slate-200 px-2.5 py-1.5 rounded-lg hover:bg-white/[0.05] transition-all flex items-center space-x-1"
            >
              <span>{expandedPrompt ? 'Hide' : 'Preview'}</span>
              {expandedPrompt ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>

            <button
              onClick={handleCopyPrompt}
              className="flex items-center justify-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-xs font-medium text-emerald-300 transition-all shadow-sm"
            >
              {copiedPrompt ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="font-semibold text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Copy AI Prompt</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Expanded Prompt Preview */}
        {expandedPrompt && (
          <div className="mt-2.5 p-3.5 bg-slate-950/80 rounded-xl border border-white/[0.08] font-mono text-xs text-slate-300 whitespace-pre-wrap leading-relaxed animate-fadeIn">
            {finding.fixPrompt}
          </div>
        )}
      </div>
    </div>
  );
}
