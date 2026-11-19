'use client';

import React from 'react';
import Link from 'next/link';
import { Terminal, ListChecks } from 'lucide-react';
import Logo from './Logo';

interface HeaderProps {
  onOpenChecklist?: () => void;
}

export default function Header({ onOpenChecklist }: HeaderProps) {
  return (
    <header className="w-full border-b border-white/[0.08] bg-black/70 backdrop-blur-2xl sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="hover:opacity-90 transition-opacity">
          <Logo size="md" />
        </Link>

        {/* Right Status & Links */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          <div className="hidden md:flex items-center space-x-2 text-xs font-mono px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.08] text-neutral-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
            <span>Passive Auditor: Active</span>
          </div>

          {onOpenChecklist && (
            <button
              type="button"
              onClick={onOpenChecklist}
              className="flex items-center space-x-1.5 text-xs font-mono text-neutral-300 hover:text-white px-3 py-1.5 rounded-lg border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] transition-all"
            >
              <ListChecks className="h-3.5 w-3.5 text-neutral-300" />
              <span>Launch Checklist</span>
            </button>
          )}

          <Link
            href="/demo-target"
            className="flex items-center space-x-1.5 text-xs font-mono text-neutral-400 hover:text-white px-3 py-1.5 rounded-lg border border-white/[0.06] hover:bg-white/[0.05] transition-all"
          >
            <Terminal className="h-3.5 w-3.5 text-neutral-400" />
            <span className="hidden sm:inline">Vulnerable</span> Sandbox
          </Link>
        </div>
      </div>
    </header>
  );
}
