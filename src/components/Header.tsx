import React from 'react';
import Link from 'next/link';
import { Shield, Terminal } from 'lucide-react';

export default function Header() {
  return (
    <header className="w-full border-b border-white/[0.08] bg-slate-950/60 backdrop-blur-xl sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-3 group">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-500 p-0.5 shadow-lg shadow-emerald-500/20 group-hover:shadow-emerald-500/40 transition-all">
            <div className="h-full w-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Shield className="h-4 w-4 text-emerald-400 group-hover:scale-110 transition-transform" />
            </div>
          </div>
          <div className="flex items-baseline space-x-1.5">
            <span className="text-lg font-bold tracking-tight text-white">ShipSafe</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              v1.0
            </span>
          </div>
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
