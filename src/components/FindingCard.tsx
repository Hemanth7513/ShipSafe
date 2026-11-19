'use client';

import React, { useState } from 'react';
import { Finding, FindingSeverity } from '@/lib/types/scan';
import { 
  getTailoredAiPrompt, 
  SupportedFramework, 
  FRAMEWORK_LABELS 
} from '@/lib/scanner/remediation/framework-prompts';
import { AlertCircle, AlertTriangle, Info, Check, Copy, ChevronDown, ChevronUp, Bot, Sparkles } from 'lucide-react';

interface FindingCardProps {
  finding: Finding;
  index?: number;
}

function getSeverityBadge(severity: FindingSeverity) {
  switch (severity) {
    case 'critical':
      return {
        text: 'text-red-400',
        bg: 'bg-red-500/[0.08]',
        border: 'border-red-500/30',
        label: 'CRITICAL',
        icon: AlertCircle
      };
    case 'high':
      return {
        text: 'text-orange-400',
        bg: 'bg-orange-500/[0.08]',
        border: 'border-orange-500/30',
        label: 'HIGH',
        icon: AlertTriangle
      };
    case 'medium':
      return {
        text: 'text-amber-400',
        bg: 'bg-amber-500/[0.08]',
        border: 'border-amber-500/30',
        label: 'MEDIUM',
        icon: AlertTriangle
      };
    case 'low':
      return {
        text: 'text-neutral-300',
        bg: 'bg-white/[0.05]',
        border: 'border-white/15',
        label: 'LOW',
        icon: Info
      };
    case 'info':
      return {
        text: 'text-neutral-400',
        bg: 'bg-white/[0.03]',
        border: 'border-white/10',
        label: 'INFO',
        icon: Info
      };
  }
}

export default function FindingCard({ finding }: FindingCardProps) {
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [expandedPrompt, setExpandedPrompt] = useState(false);
  const [framework, setFramework] = useState<SupportedFramework>('nextjs');

  const badge = getSeverityBadge(finding.severity);
  const IconComponent = badge.icon;

  const currentPrompt = getTailoredAiPrompt(finding, framework);

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(currentPrompt);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2500);
  };

  return (
    <div className="w-full rounded-2xl border border-white/10 bg-[#0B0D11]/90 backdrop-blur-xl p-5 md:p-6 shadow-lg hover:border-white/20 transition-all space-y-4 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]">
      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-2.5">
          <span className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-bold border ${badge.border} ${badge.bg} ${badge.text}`}>
            <IconComponent className="h-3.5 w-3.5" />
            <span>{badge.label}</span>
          </span>

          <span className="text-xs font-mono text-neutral-400 px-2.5 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.06]">
            {finding.category.toUpperCase()}
          </span>

          {finding.owaspMapping && (
            <span className="hidden md:inline-block text-[11px] font-mono text-neutral-400 truncate max-w-[280px]">
              {finding.owaspMapping}
            </span>
          )}
        </div>

        {finding.deduction > 0 && (
          <span className="text-xs font-mono font-semibold text-neutral-400 self-start sm:self-auto">
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
        <div className="flex items-center space-x-2 text-xs font-mono text-neutral-400 bg-[#050608] rounded-lg px-3 py-1.5 border border-white/[0.06] overflow-x-auto">
          <span className="text-neutral-500 shrink-0">Asset:</span>
          <span className="text-neutral-300 truncate">{finding.assetUrl}</span>
        </div>
      )}

      {/* Evidence snippet if present */}
      {finding.maskedEvidence && (
        <div className="space-y-1">
          <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-400">
            Evidence (Redacted):
          </span>
          <pre className="text-xs font-mono text-amber-200/90 bg-[#050608] p-3 rounded-xl border border-white/[0.08] overflow-x-auto whitespace-pre-wrap">
            {finding.maskedEvidence}
          </pre>
        </div>
      )}

      {/* Plain-English Impact */}
      <div className="bg-[#050608]/80 rounded-xl p-3.5 border border-white/[0.06] space-y-1">
        <span className="text-xs font-semibold text-neutral-300 flex items-center space-x-1.5">
          <span>Business & Security Impact:</span>
        </span>
        <p className="text-xs text-neutral-400 leading-relaxed">
          {finding.impact}
        </p>
      </div>

      {/* AI Remediation Action Box with Framework Switcher */}
      <div className="pt-2">
        <div className="bg-white/[0.02] rounded-xl p-3.5 border border-white/[0.08] space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-2.5">
              <div className="h-8 w-8 rounded-lg bg-white/[0.05] border border-white/10 flex items-center justify-center shrink-0">
                <Bot className="h-4 w-4 text-white" />
              </div>
              <div>
                <div className="text-xs font-semibold text-white flex items-center space-x-1.5">
                  <span>AI Remediation Prompt</span>
                  <Sparkles className="h-3 w-3 text-neutral-400" />
                </div>
                <div className="text-[11px] text-neutral-400">Select your stack to generate tailored prompt:</div>
              </div>
            </div>

            {/* Framework Switcher Pills */}
            <div className="flex items-center space-x-1 bg-[#050608] p-1 rounded-lg border border-white/[0.08] self-start sm:self-auto">
              {(['nextjs', 'vite', 'express', 'remix'] as SupportedFramework[]).map((fw) => (
                <button
                  key={fw}
                  type="button"
                  onClick={() => setFramework(fw)}
                  className={`px-2 py-1 rounded text-[11px] font-mono transition-all ${
                    framework === fw
                      ? 'bg-white text-black font-semibold shadow-sm'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  {fw === 'nextjs' ? 'Next.js' : fw === 'vite' ? 'Vite' : fw === 'express' ? 'Express' : 'Remix'}
                </button>
              ))}
            </div>
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-between pt-1 border-t border-white/[0.04]">
            <span className="text-[11px] font-mono text-neutral-500">
              Targeted for: <span className="text-neutral-300 font-medium">{FRAMEWORK_LABELS[framework]}</span>
            </span>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setExpandedPrompt(!expandedPrompt)}
                className="text-xs text-neutral-400 hover:text-white px-2.5 py-1.5 rounded-lg hover:bg-white/[0.05] transition-all flex items-center space-x-1 font-medium"
              >
                <span>{expandedPrompt ? 'Hide' : 'Preview'}</span>
                {expandedPrompt ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              </button>

              <button
                type="button"
                onClick={handleCopyPrompt}
                className="flex items-center justify-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-white hover:bg-neutral-200 text-black text-xs font-semibold transition-all shadow-sm active:scale-[0.98]"
              >
                {copiedPrompt ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                    <span className="font-semibold text-emerald-700">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5 text-black" />
                    <span>Copy AI Prompt</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Expanded Prompt Preview */}
        {expandedPrompt && (
          <div className="mt-2.5 p-3.5 bg-[#050608] rounded-xl border border-white/[0.08] font-mono text-xs text-neutral-300 whitespace-pre-wrap leading-relaxed animate-fadeIn">
            {currentPrompt}
          </div>
        )}
      </div>
    </div>
  );
}
