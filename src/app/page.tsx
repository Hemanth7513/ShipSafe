'use client';

import React, { useState, useEffect, useRef } from 'react';
import Header from '@/components/Header';
import TerminalStepper from '@/components/TerminalStepper';
import ScoreCard from '@/components/ScoreCard';
import FindingCard from '@/components/FindingCard';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ScanResult, FindingCategory } from '@/lib/types/scan';
import { 
  Shield, 
  ArrowRight, 
  CheckCircle2, 
  AlertTriangle, 
  ListChecks, 
  Terminal,
  Activity,
  Check,
  SearchCode,
  Code2,
  Cpu,
  HelpCircle,
  Sparkles
} from 'lucide-react';

interface RecentScan {
  url: string;
  grade: string;
  score: number;
  timestamp: number;
}

const RECENT_SCANS_KEY = 'shipsafe_recent_scans';

export default function Home() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTarget, setActiveTarget] = useState('');
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [demoNotice, setDemoNotice] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | FindingCategory>('all');
  const [recentScans, setRecentScans] = useState<RecentScan[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_SCANS_KEY);
      if (stored) {
        setRecentScans(JSON.parse(stored));
      }
    } catch {
      // ignore JSON storage errors
    }
  }, []);

  // Global Keyboard Shortcut listener for '/' and 'Cmd/Ctrl + K'
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isInput = ['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName || '');
      if (e.key === '/' && !isInput) {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const saveToRecentScans = (newScan: RecentScan) => {
    try {
      const filtered = recentScans.filter((s) => s.url !== newScan.url);
      const updated = [newScan, ...filtered].slice(0, 4);
      setRecentScans(updated);
      localStorage.setItem(RECENT_SCANS_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const clearRecentScans = () => {
    setRecentScans([]);
    try {
      localStorage.removeItem(RECENT_SCANS_KEY);
    } catch {
      // ignore
    }
  };

  const startScan = async (targetUrl: string, isDemo = false) => {
    setError(null);
    setLoading(true);
    setActiveTarget(targetUrl);

    try {
      const response = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: targetUrl,
          isDemo,
          confirmedOwnership: true,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Scan request failed.');
      }

      setResult(data as ScanResult);

      saveToRecentScans({
        url: targetUrl,
        grade: data.grade,
        score: data.score,
        timestamp: Date.now(),
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An unexpected error occurred.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) {
      const demoUrl = 'https://demo-vibe-target.internal';
      setUrl(demoUrl);
      setDemoNotice('No custom URL entered — executing live simulated audit against Simulated Target.');
      startScan(demoUrl, true);
      return;
    }
    setDemoNotice(null);
    startScan(url.trim(), false);
  };

  const handleDemoScan = () => {
    const demoUrl = 'https://demo-vibe-target.internal';
    setUrl(demoUrl);
    setDemoNotice(null);
    startScan(demoUrl, true);
  };

  const handleLiveSelfScan = () => {
    const selfUrl = 'https://shipsafe.internal/self-inspection';
    setUrl(selfUrl);
    setDemoNotice(null);
    startScan(selfUrl, false);
  };

  const handleSelectRecent = (recentUrl: string) => {
    setUrl(recentUrl);
    setError(null);
    setDemoNotice(null);
    inputRef.current?.focus();
  };

  const handleReset = () => {
    setResult(null);
    setUrl('');
    setError(null);
    setDemoNotice(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const filteredFindings = result?.findings.filter((f) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'secrets') return f.category === 'secrets' || f.category === 'baas';
    return f.category === activeTab;
  }) || [];

  return (
    <div className="min-h-screen bg-black text-neutral-100 flex flex-col selection:bg-white selection:text-black relative overflow-x-hidden">
      {/* Top Ambient Spotlight Glow */}
      <div className="pointer-events-none absolute -top-36 left-1/2 -translate-x-1/2 w-[750px] h-[350px] bg-gradient-to-b from-white/[0.08] via-white/[0.02] to-transparent rounded-full blur-3xl z-0" />

      <Header />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8 md:py-14 z-10">
        {/* State 1: Scan Results Available */}
        {result ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          >
            <ScoreCard result={result} onReset={handleReset} />

            {/* Filter Tabs with Framer Spring Pill */}
            <div className="flex items-center space-x-1.5 border-b border-white/[0.08] pb-4 mb-6 overflow-x-auto relative">
              {[
                { id: 'all', label: `All Findings (${result.findings.length})` },
                { id: 'secrets', label: `Secrets & BaaS (${result.findings.filter(f => f.category === 'secrets' || f.category === 'baas').length})` },
                { id: 'headers', label: `Headers & Cookies (${result.findings.filter(f => f.category === 'headers' || f.category === 'cookies').length})` },
                { id: 'artifacts', label: `Artifacts & Maps (${result.findings.filter(f => f.category === 'artifacts').length})` },
              ].map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as 'all' | FindingCategory)}
                    className={`relative px-4 py-2 rounded-xl text-xs font-mono transition-colors shrink-0 ${
                      isActive ? 'text-black font-bold' : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeFilterPill"
                        transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                        className="absolute inset-0 bg-white rounded-xl shadow-md"
                      />
                    )}
                    <span className="relative z-10">{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Findings List with Smooth Transitions */}
            <AnimatePresence mode="popLayout">
              {filteredFindings.length > 0 ? (
                <motion.div 
                  layout
                  className="space-y-4"
                >
                  {filteredFindings.map((finding, idx) => (
                    <motion.div
                      key={finding.id + idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      transition={{ duration: 0.25, delay: idx * 0.04 }}
                    >
                      <FindingCard finding={finding} />
                    </motion.div>
                  ))}
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-16 bg-[#0B0D11]/60 rounded-3xl border border-white/[0.06]"
                >
                  <CheckCircle2 className="h-10 w-10 text-emerald-400 mx-auto mb-3" />
                  <h3 className="text-base font-semibold text-white">Zero Hygiene Gaps Identified</h3>
                  <p className="text-xs text-neutral-400 mt-1">This inspection category satisfied all defensive verification rules.</p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ) : loading ? (
          /* State 2: Active Scanning with Terminal Logs */
          <div className="py-12">
            <div className="text-center mb-6 space-y-2">
              <span className="text-xs font-mono px-3 py-1 rounded-full bg-white/[0.06] text-neutral-300 border border-white/10 inline-flex items-center space-x-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Passive Inspection Active</span>
              </span>
              <h2 className="text-2xl font-bold text-white tracking-tight">
                Auditing {activeTarget}
              </h2>
            </div>
            <TerminalStepper targetUrl={activeTarget} />
          </div>
        ) : (
          /* State 3: Focused Hero Landing & Auditor Engine */
          <motion.div
            initial={false}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.45 }}
            className="space-y-16"
          >
            {/* Hero Header */}
            <div className="text-center space-y-5 max-w-3xl mx-auto pt-6">
              <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-white/10 text-xs font-mono text-neutral-300 shadow-sm">
                <SearchCode className="h-3.5 w-3.5 text-white" />
                <span>Zero-Exploit Passive Security Hygiene Assessment</span>
              </div>

              <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white leading-tight">
                Ship Fast. Audit Faster. <br />
                <span className="text-neutral-400 font-semibold">
                  Ship Safe.
                </span>
              </h1>

              <p className="text-sm md:text-base text-neutral-400 leading-relaxed max-w-2xl mx-auto">
                The passive security auditor for modern web applications built with rapid-prototyping AI tools.
                Catches leaked administrative tokens, exposed source maps, and missing defense-in-depth headers with
                <span className="text-neutral-200 font-medium"> framework-tailored remediation directives</span>.
              </p>

              {/* Trust Metric Badges */}
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                <span className="inline-flex items-center space-x-1.5 text-[11px] font-mono text-neutral-300 px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/10 shadow-sm">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>Engine Online • In-Memory Analyzer Ready</span>
                </span>
                <span className="inline-flex items-center space-x-1.5 text-[11px] font-mono text-neutral-400 px-2.5 py-1 rounded-full bg-white/[0.03] border border-white/[0.06]">
                  <Check className="h-3 w-3 text-emerald-400" />
                  <span>100% Passive (Zero Payloads)</span>
                </span>
                <span className="inline-flex items-center space-x-1.5 text-[11px] font-mono text-neutral-400 px-2.5 py-1 rounded-full bg-white/[0.03] border border-white/[0.06]">
                  <Activity className="h-3 w-3 text-neutral-300" />
                  <span>&lt;10s Runtime Execution</span>
                </span>
                <span className="inline-flex items-center space-x-1.5 text-[11px] font-mono text-neutral-400 px-2.5 py-1 rounded-full bg-white/[0.03] border border-white/[0.06]">
                  <Shield className="h-3 w-3 text-neutral-300" />
                  <span>OWASP ASVS v4.0 Aligned</span>
                </span>
              </div>
            </div>

            {/* Core Input Card */}
            <div className="max-w-2xl mx-auto">
              <div className="rounded-3xl border border-white/10 bg-[#0B0D11]/90 backdrop-blur-2xl p-6 md:p-8 shadow-2xl relative overflow-hidden shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)]">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-mono text-neutral-300 font-medium flex items-center justify-between">
                      <span>Target Web Application URL:</span>
                      <span className="text-[11px] text-neutral-400 font-mono">Public HTTPS entrypoint</span>
                    </label>

                    <div className="relative">
                      <input
                        ref={inputRef}
                        type="text"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="https://app.example.com or example.com"
                        className="w-full h-13 px-4 py-3.5 pr-20 rounded-xl bg-[#050608] border border-white/10 focus:border-white focus:ring-1 focus:ring-white/20 text-sm text-white placeholder-neutral-600 transition-all font-mono outline-none shadow-inner"
                      />
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] font-mono text-neutral-400 bg-white/[0.05] border border-white/10 px-2 py-0.5 rounded pointer-events-none hidden sm:inline">
                        Press /
                      </span>
                    </div>
                  </div>

                  {/* Unified Presets & Recent History Tray */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] font-mono">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-neutral-500 mr-1">Presets:</span>
                      <button
                        type="button"
                        onClick={handleDemoScan}
                        className="px-2.5 py-1 rounded-md bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-neutral-300 hover:text-white transition-all flex items-center space-x-1"
                      >
                        <Terminal className="h-3 w-3 text-neutral-400" />
                        <span>Simulated Target</span>
                        <span className="text-[9px] px-1 py-0.2 rounded bg-red-500/20 text-red-400 border border-red-500/30">Grade D</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleLiveSelfScan}
                        className="px-2.5 py-1 rounded-md bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-neutral-300 hover:text-white transition-all flex items-center space-x-1"
                      >
                        <Shield className="h-3 w-3 text-neutral-400" />
                        <span>Self-Inspection</span>
                        <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Grade A+</span>
                      </button>
                    </div>

                    {recentScans.length > 0 && (
                      <div className="flex items-center gap-1.5 overflow-x-auto">
                        <span className="text-neutral-500">Recent:</span>
                        {recentScans.slice(0, 2).map((scan, i) => {
                          const host = scan.url.replace(/^https?:\/\//, '').replace(/\/$/, '');
                          return (
                            <button
                              key={scan.url + i}
                              type="button"
                              onClick={() => handleSelectRecent(scan.url)}
                              className="px-2 py-0.5 rounded bg-[#050608] hover:bg-white/[0.06] border border-white/[0.08] text-[10px] text-neutral-400 hover:text-white transition-all truncate max-w-[130px]"
                              title={`Load ${scan.url}`}
                            >
                              {host} ({scan.grade})
                            </button>
                          );
                        })}
                        <button
                          type="button"
                          onClick={clearRecentScans}
                          className="text-[10px] text-neutral-600 hover:text-neutral-400 transition-colors ml-0.5"
                        >
                          Clear
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Demo Information Banner */}
                  {demoNotice && (
                    <div className="p-3.5 rounded-xl bg-white/[0.04] border border-white/10 text-xs font-mono text-neutral-300 flex items-center space-x-2">
                      <Sparkles className="h-4 w-4 text-emerald-400 shrink-0" />
                      <span>{demoNotice}</span>
                    </div>
                  )}

                  {/* Error Notification */}
                  {error && (
                    <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300 flex items-center space-x-2">
                      <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  {/* High-Contrast Action CTAs */}
                  <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full sm:flex-1 h-12 rounded-xl bg-white hover:bg-neutral-200 text-black font-semibold text-sm flex items-center justify-center space-x-2 shadow-lg shadow-white/5 transition-all disabled:opacity-50 active:scale-[0.98]"
                    >
                      <Shield className="h-4 w-4" />
                      <span>Execute Security Assessment</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>

                    <button
                      type="button"
                      onClick={handleDemoScan}
                      disabled={loading}
                      className="w-full sm:w-auto h-12 px-5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-xs font-semibold text-neutral-200 flex items-center justify-center space-x-2 transition-all shrink-0 active:scale-[0.98]"
                    >
                      <Terminal className="h-4 w-4 text-neutral-400" />
                      <span>Simulated Target</span>
                    </button>
                  </div>

                  {/* Clean Non-Blocking Disclaimer */}
                  <p className="text-[11px] font-mono text-neutral-500 text-center pt-1 leading-relaxed">
                    Zero-exploit passive inspection • Read-only HTTP surface evaluation aligned with OWASP ASVS v4.0
                  </p>
                </form>
              </div>
            </div>

            {/* Platform Modules Navigation Cards */}
            <div className="pt-4">
              <div className="text-center mb-8 space-y-1.5">
                <span className="text-xs font-mono uppercase tracking-wider text-neutral-400">
                  Platform Architecture &amp; Knowledge Base
                </span>
                <h2 className="text-2xl font-bold text-white tracking-tight">
                  Modular Security Suite
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Module 1: Vulnerabilities */}
                <Link
                  href="/vulnerabilities"
                  className="group rounded-2xl border border-white/[0.08] bg-[#0B0D11]/70 hover:bg-[#0B0D11] hover:border-white/20 p-5 transition-all space-y-3 backdrop-blur-xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] flex flex-col justify-between"
                >
                  <div className="space-y-2.5">
                    <div className="h-9 w-9 rounded-xl bg-white/[0.05] border border-white/10 flex items-center justify-center text-white group-hover:scale-105 transition-transform">
                      <Code2 className="h-4 w-4" />
                    </div>
                    <h3 className="text-sm font-bold text-white group-hover:text-white transition-colors">
                      Vulnerabilities Lab
                    </h3>
                    <p className="text-xs text-neutral-400 leading-relaxed">
                      Comparative code diffs illustrating leaked BaaS keys, exposed source maps, and absent headers.
                    </p>
                  </div>
                  <div className="flex items-center space-x-1 text-[11px] font-mono text-neutral-400 group-hover:text-white pt-2 border-t border-white/[0.04]">
                    <span>Inspect Diffs</span>
                    <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>

                {/* Module 2: Architecture */}
                <Link
                  href="/architecture"
                  className="group rounded-2xl border border-white/[0.08] bg-[#0B0D11]/70 hover:bg-[#0B0D11] hover:border-white/20 p-5 transition-all space-y-3 backdrop-blur-xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] flex flex-col justify-between"
                >
                  <div className="space-y-2.5">
                    <div className="h-9 w-9 rounded-xl bg-white/[0.05] border border-white/10 flex items-center justify-center text-white group-hover:scale-105 transition-transform">
                      <Cpu className="h-4 w-4" />
                    </div>
                    <h3 className="text-sm font-bold text-white group-hover:text-white transition-colors">
                      System Architecture
                    </h3>
                    <p className="text-xs text-neutral-400 leading-relaxed">
                      RFC 6890 SSRF boundaries, anti-DNS rebinding, Shannon entropy, and SPA signature detection.
                    </p>
                  </div>
                  <div className="flex items-center space-x-1 text-[11px] font-mono text-neutral-400 group-hover:text-white pt-2 border-t border-white/[0.04]">
                    <span>View Architecture</span>
                    <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>

                {/* Module 3: Protocol */}
                <Link
                  href="/protocol"
                  className="group rounded-2xl border border-white/[0.08] bg-[#0B0D11]/70 hover:bg-[#0B0D11] hover:border-white/20 p-5 transition-all space-y-3 backdrop-blur-xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] flex flex-col justify-between"
                >
                  <div className="space-y-2.5">
                    <div className="h-9 w-9 rounded-xl bg-white/[0.05] border border-white/10 flex items-center justify-center text-white group-hover:scale-105 transition-transform">
                      <ListChecks className="h-4 w-4" />
                    </div>
                    <h3 className="text-sm font-bold text-white group-hover:text-white transition-colors">
                      Pre-Launch Protocol
                    </h3>
                    <p className="text-xs text-neutral-400 leading-relaxed">
                      7-checkpoint hygiene verification covering BaaS RLS, CSP headers, prefix isolation, and rate limiting.
                    </p>
                  </div>
                  <div className="flex items-center space-x-1 text-[11px] font-mono text-neutral-400 group-hover:text-white pt-2 border-t border-white/[0.04]">
                    <span>Open Protocol</span>
                    <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>

                {/* Module 4: FAQ */}
                <Link
                  href="/faq"
                  className="group rounded-2xl border border-white/[0.08] bg-[#0B0D11]/70 hover:bg-[#0B0D11] hover:border-white/20 p-5 transition-all space-y-3 backdrop-blur-xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] flex flex-col justify-between"
                >
                  <div className="space-y-2.5">
                    <div className="h-9 w-9 rounded-xl bg-white/[0.05] border border-white/10 flex items-center justify-center text-white group-hover:scale-105 transition-transform">
                      <HelpCircle className="h-4 w-4" />
                    </div>
                    <h3 className="text-sm font-bold text-white group-hover:text-white transition-colors">
                      Documentation &amp; FAQ
                    </h3>
                    <p className="text-xs text-neutral-400 leading-relaxed">
                      Zero-payload non-destructive guarantees, ephemeral memory architecture, and ASVS benchmarks.
                    </p>
                  </div>
                  <div className="flex items-center space-x-1 text-[11px] font-mono text-neutral-400 group-hover:text-white pt-2 border-t border-white/[0.04]">
                    <span>Read Docs</span>
                    <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-white/[0.08] bg-black py-8 mt-20 text-center text-xs text-neutral-400 font-mono z-10">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
            <span>ShipSafe v1.0 • Passive Security Hygiene Auditor</span>
          </div>
          <div className="flex items-center space-x-6 text-neutral-400">
            <Link href="/vulnerabilities" className="hover:text-white transition-colors">Vulnerabilities</Link>
            <Link href="/architecture" className="hover:text-white transition-colors">Architecture</Link>
            <Link href="/protocol" className="hover:text-white transition-colors">Protocol</Link>
            <Link href="/faq" className="hover:text-white transition-colors">FAQ</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
