'use client';

import React, { useState, useEffect } from 'react';
import { ArrowUp, Terminal, ListChecks, Shield } from 'lucide-react';

interface FloatingNavProps {
  onScrollToTop: () => void;
  onRunDemo: () => void;
  onOpenChecklist: () => void;
}

export default function FloatingNav({ onScrollToTop, onRunDemo, onOpenChecklist }: FloatingNavProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 380) {
        setVisible(true);
      } else {
        setVisible(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 animate-fadeIn transition-all">
      <div className="flex items-center space-x-1 sm:space-x-2 px-3 py-2 rounded-2xl bg-[#0B0D11]/90 backdrop-blur-2xl border border-white/15 shadow-2xl shadow-black/80">
        <button
          type="button"
          onClick={onScrollToTop}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-neutral-200 text-black text-xs font-semibold transition-all active:scale-[0.98] shadow-sm"
        >
          <Shield className="h-3.5 w-3.5 text-black" />
          <span>Audit URL</span>
          <ArrowUp className="h-3 w-3 text-black" />
        </button>

        <button
          type="button"
          onClick={onRunDemo}
          className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-xs font-mono text-neutral-300 hover:text-white transition-all border border-white/10"
        >
          <Terminal className="h-3 w-3 text-neutral-400" />
          <span>Sandbox Target</span>
        </button>

        <button
          type="button"
          onClick={onOpenChecklist}
          className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-xs font-mono text-neutral-300 hover:text-white transition-all border border-white/10"
        >
          <ListChecks className="h-3 w-3 text-neutral-400" />
          <span>Checklist</span>
        </button>
      </div>
    </div>
  );
}
