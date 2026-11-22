'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, Shield } from 'lucide-react';
import { motion } from 'framer-motion';
import Logo from './Logo';

const NAV_ITEMS = [
  { href: '/', label: 'Auditor' },
  { href: '/vulnerabilities', label: 'Vulnerabilities' },
  { href: '/architecture', label: 'Architecture' },
  { href: '/#protocol', label: 'Protocol' },
  { href: '/#faq', label: 'FAQ' },
];

export default function Header() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleAuditorClick = () => {
    if (pathname === '/') {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('shipsafe:reset'));
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } else {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('shipsafe_pending_reset', 'true');
      }
    }
  };

  return (
    <header className="w-full border-b border-white/[0.08] bg-[#030407]/80 backdrop-blur-2xl sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Left: Brand Logo */}
        <Link 
          href="/" 
          onClick={handleAuditorClick}
          className="hover:opacity-90 transition-opacity shrink-0 cursor-pointer"
        >
          <Logo size="md" />
        </Link>

        {/* Center: Desktop Capsule Navigation Bar */}
        <nav className="hidden md:flex items-center space-x-1 p-1 rounded-full bg-[#0A0D14]/90 border border-white/10 relative shadow-inner">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href && item.href !== '/#protocol' && item.href !== '/#faq';
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={item.href === '/' ? handleAuditorClick : undefined}
                className={`relative px-4 py-1.5 rounded-full text-xs font-mono transition-colors ${
                  isActive
                    ? 'text-black font-semibold'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="navbar-active-pill"
                    transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                    className="absolute inset-0 bg-white rounded-full shadow-sm"
                  />
                )}
                <span className="relative z-10">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right: Auditor Active & Sandbox */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          <div className="hidden lg:flex items-center space-x-2 text-xs font-mono px-3.5 py-1.5 rounded-full bg-[#05130E] border border-emerald-500/30 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.15)]">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Auditor: Active</span>
          </div>

          <Link
            href="/demo-target"
            className="flex items-center space-x-1.5 text-xs font-mono text-neutral-300 hover:text-white px-3.5 py-1.5 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.08] transition-all shadow-sm"
          >
            <span className="text-neutral-400 font-mono text-xs">&gt;_</span>
            <span>Sandbox</span>
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
        <div className="md:hidden border-b border-white/[0.08] bg-[#07090E]/95 backdrop-blur-2xl px-4 py-3 space-y-1 animate-fadeIn">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => {
                  if (item.href === '/') handleAuditorClick();
                  setMobileMenuOpen(false);
                }}
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
