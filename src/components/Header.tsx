import React from 'react';
import Link from 'next/link';
import { Terminal } from 'lucide-react';
import Logo from './Logo';

export default function Header() {
  return (
    <header className="w-full border-b border-white/[0.08] bg-slate-950/60 backdrop-blur-xl sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Custom Brand Logo */}
        <Link href="/" className="hover:opacity-95 transition-opacity">
          <Logo size="md" />
        </Link>

        {/* Status Badge & Links */}
        <div className="flex items-center space-x-4">
          <div className="hidden md:flex items-center space-x-2 text-xs font-mono px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.08] text-slate-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Passive Hygiene Engine: Active</span>
          </div>

          <Link
            href="/demo-target"
            className="flex items-center space-x-1.5 text-xs font-medium text-slate-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-white/[0.05] transition-all"
          >
            <Terminal className="h-3.5 w-3.5 text-amber-400" />
            <span>Sandbox Route</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
