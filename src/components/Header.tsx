'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Terminal, Menu, X, Shield } from 'lucide-react';
import Logo from './Logo';

const NAV_ITEMS = [
  { href: '/', label: 'Auditor' },
  { href: '/vulnerabilities', label: 'Vulnerabilities' },
  { href: '/architecture', label: 'Architecture' },
  { href: '/protocol', label: 'Protocol' },
  { href: '/faq', label: 'FAQ' },
];

export default function Header() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="w-full border-b border-white/[0.08] bg-black/80 backdrop-blur-2xl sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Left: Brand Logo */}
        <Link href="/" className="hover:opacity-90 transition-opacity shrink-0">
          <Logo size="md" />
        </Link>

        {/* Center: Desktop Navigation Bar */}
        <nav className="hidden md:flex items-center space-x-1 p-1 rounded-xl bg-white/[0.03] border border-white/[0.06]">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
                  isActive
                    ? 'bg-white text-black font-semibold shadow-sm'
                    : 'text-neutral-400 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right Status & Sandbox */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          <div className="hidden lg:flex items-center space-x-2 text-xs font-mono px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.08] text-neutral-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
            <span>Auditor: Active</span>
          </div>

          <Link
            href="/demo-target"
            className="flex items-center space-x-1.5 text-xs font-mono text-neutral-300 hover:text-white px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/[0.06] transition-all"
          >
            <Terminal className="h-3.5 w-3.5 text-neutral-400" />
            <span className="hidden sm:inline">Sandbox</span>
          </Link>

          {/* Mobile Menu Toggle Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg bg-white/[0.04] border border-white/10 text-neutral-400 hover:text-white transition-all"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-white/[0.08] bg-[#0B0D11]/95 backdrop-blur-2xl px-4 py-3 space-y-1 animate-fadeIn">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2 rounded-lg text-xs font-mono transition-all ${
                  isActive
                    ? 'bg-white text-black font-semibold'
                    : 'text-neutral-300 hover:bg-white/[0.05]'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
          <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-[11px] font-mono text-neutral-400 px-3 py-1">
            <span className="flex items-center space-x-1.5">
              <Shield className="h-3 w-3 text-emerald-400" />
              <span>Passive Security Auditor</span>
            </span>
            <span>OWASP ASVS v4.0</span>
          </div>
        </div>
      )}
    </header>
  );
}
