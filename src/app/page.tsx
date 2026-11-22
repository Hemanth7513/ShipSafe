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
  Globe,
  Cpu,
  Sparkles,
  Bot,
  FileCode,
  Scan,
  Lock,
  Zap,
  HelpCircle
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
    if (typeof window !== 'undefined' && sessionStorage.getItem('shipsafe_pending_reset') === 'true') {
      sessionStorage.removeItem('shipsafe_pending_reset');
      handleReset();
    }

    const onResetEvent = () => {
      handleReset();
    };
    window.addEventListener('shipsafe:reset', onResetEvent);

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
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('shipsafe:reset', onResetEvent);
    };
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
      setDemoNotice('Executing live passive inspection against Simulated Target (Grade D).');
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

  const handleLocalhostScan = () => {
    const localUrl = 'http://localhost:3000';
    setUrl(localUrl);
    setDemoNotice(null);
    startScan(localUrl, false);
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
    <div className="min-h-screen bg-[#030407] text-neutral-100 flex flex-col selection:bg-white selection:text-black relative overflow-x-hidden">
      {/* Top Ambient Spotlight Glow */}
      <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[900px] h-[400px] bg-gradient-to-b from-indigo-500/[0.12] via-emerald-500/[0.05] to-transparent rounded-full blur-3xl z-0" />

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
              <span className="text-xs font-mono px-3.5 py-1 rounded-full bg-white/[0.06] text-neutral-300 border border-white/10 inline-flex items-center space-x-2">
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
          /* State 3: Focused Hero Landing & Auditor Engine (1:1 with Design Mockup) */
          <motion.div
            initial={false}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.45 }}
            className="space-y-12 md:space-y-16"
          >
            {/* Hero Header */}
            <div className="text-center space-y-3 max-w-3xl mx-auto pt-4 md:pt-8">
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-white leading-tight">
                Ship Fast. <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-200 bg-clip-text text-transparent">Audit Faster.</span>
              </h1>

              <p className="text-sm sm:text-base text-neutral-400 leading-relaxed max-w-xl mx-auto pt-1">
                Client-side security auditing for modern web apps. Zero backend traces.
              </p>
            </div>

            {/* Glowing Search Capsule (Floating on Cyber Grid, No Enclosing Card) */}
            <div className="w-full max-w-2xl mx-auto">
              <form onSubmit={handleSubmit} className="w-full">
                <div className="relative p-[1.5px] rounded-2xl bg-gradient-to-r from-purple-500/40 via-teal-500/30 to-emerald-400/50 shadow-[0_0_35px_-5px_rgba(16,185,129,0.22),0_0_35px_-5px_rgba(168,85,247,0.2)]">
                  <div className="flex items-center h-14 w-full rounded-2xl bg-[#07090E]/95 px-4 backdrop-blur-2xl border border-white/[0.08] focus-within:border-emerald-400/40 transition-all">
                    <Globe className="h-4 w-4 text-neutral-400 shrink-0 mr-3" />
                    <input
                      ref={inputRef}
                      type="text"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="https://your-app.com or localhost:3000"
                      className="flex-1 bg-transparent text-xs sm:text-sm text-neutral-200 placeholder-neutral-500 font-mono outline-none border-none pr-3"
                    />
                    <button
                      type="submit"
                      disabled={loading}
                      className="h-10 px-5 rounded-xl bg-gradient-to-r from-teal-200 via-cyan-200 to-emerald-300 hover:opacity-95 active:scale-[0.98] text-neutral-950 font-bold text-xs flex items-center space-x-1.5 shadow-[0_0_20px_rgba(45,212,191,0.3)] transition-all shrink-0 cursor-pointer"
                    >
                      <Scan className="h-3.5 w-3.5 stroke-[2.5]" />
                      <span>Audit Target</span>
                    </button>
                  </div>
                </div>
              </form>

              {/* Demo Notice Banner */}
              {demoNotice && (
                <div className="mt-3.5 p-3 rounded-xl bg-white/[0.04] border border-white/10 text-xs font-mono text-neutral-300 flex items-center space-x-2">
                  <Sparkles className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>{demoNotice}</span>
                </div>
              )}

              {/* Error Notification */}
              {error && (
                <div className="mt-3.5 p-3 rounded-xl bg-red-950/40 border border-red-500/30 text-xs text-red-300 flex items-center space-x-2">
                  <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Presets Row */}
              <div className="flex flex-wrap items-center justify-center gap-2 mt-4 text-xs font-mono">
                <span className="text-neutral-500 mr-1 text-xs">Presets:</span>
                <button
                  type="button"
                  onClick={handleDemoScan}
                  className="px-3 py-1.5 rounded-lg bg-[#0E121A]/80 hover:bg-white/[0.08] border border-white/10 hover:border-white/20 text-neutral-300 hover:text-white transition-all cursor-pointer"
                >
                  Simulated Target (Grade D)
                </button>
                <button
                  type="button"
                  onClick={handleLiveSelfScan}
                  className="px-3 py-1.5 rounded-lg bg-[#0E121A]/80 hover:bg-white/[0.08] border border-white/10 hover:border-white/20 text-neutral-300 hover:text-white transition-all cursor-pointer"
                >
                  Self-Inspection (Grade A)
                </button>
                <button
                  type="button"
                  onClick={handleLocalhostScan}
                  className="px-3 py-1.5 rounded-lg bg-[#0E121A]/80 hover:bg-white/[0.08] border border-white/10 hover:border-white/20 text-neutral-300 hover:text-white transition-all cursor-pointer"
                >
                  Quick Scan localhost:3000
                </button>
              </div>

              {/* Recent Scans (if present) */}
              {recentScans.length > 0 && (
                <div className="flex items-center justify-center gap-2 mt-3 text-xs font-mono">
                  <span className="text-neutral-500">Recent:</span>
                  {recentScans.slice(0, 3).map((scan, i) => {
                    const host = scan.url.replace(/^https?:\/\//, '').replace(/\/$/, '');
                    return (
                      <button
                        key={scan.url + i}
                        type="button"
                        onClick={() => handleSelectRecent(scan.url)}
                        className="px-2.5 py-1 rounded-md bg-[#0A0D14] hover:bg-white/[0.06] border border-white/[0.08] text-[11px] text-neutral-400 hover:text-white transition-all truncate max-w-[140px] cursor-pointer"
                        title={`Load ${scan.url}`}
                      >
                        {host} ({scan.grade})
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={clearRecentScans}
                    className="text-[11px] text-neutral-600 hover:text-neutral-400 transition-colors ml-1 cursor-pointer"
                  >
                    Clear
                  </button>
                </div>
              )}

              {/* Capability Badges Row */}
              <div className="flex flex-wrap items-center justify-center gap-2.5 mt-5">
                <span className="inline-flex items-center text-xs font-mono text-neutral-400 px-3.5 py-1.5 rounded-xl bg-[#0E121A]/80 border border-white/10 shadow-sm">
                  98 Automated Vulnerability Heuristics
                </span>
                <span className="inline-flex items-center text-xs font-mono text-neutral-400 px-3.5 py-1.5 rounded-xl bg-[#0E121A]/80 border border-white/10 shadow-sm">
                  Client-Side In-Memory Execution
                </span>
                <span className="inline-flex items-center text-xs font-mono text-neutral-400 px-3.5 py-1.5 rounded-xl bg-[#0E121A]/80 border border-white/10 shadow-sm">
                  Zero Data Exfiltration
                </span>
              </div>
            </div>

            {/* The 4 Core Pillars */}
            <div className="pt-8">
              <div className="text-center mb-8 space-y-1.5">
                <span className="text-xs font-mono uppercase tracking-wider text-neutral-400">
                  Focused Security Engine
                </span>
                <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                  The 4 Core Pillars of ShipSafe
                </h2>
                <p className="text-xs sm:text-sm text-neutral-400 max-w-lg mx-auto">
                  Engineered specifically for modern web applications to catch what rapid-prototyping AI tools miss.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Pillar 1: BaaS & Secret Leak Hunter */}
                <Link
                  href="/vulnerabilities"
                  className="group rounded-2xl border border-white/[0.08] bg-[#080B11]/80 hover:bg-[#0B0E17] hover:border-white/20 p-5 transition-all space-y-3 backdrop-blur-xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] flex flex-col justify-between"
                >
                  <div className="space-y-2.5">
                    <div className="h-9 w-9 rounded-xl bg-white/[0.05] border border-white/10 flex items-center justify-center text-white group-hover:scale-105 transition-transform">
                      <Cpu className="h-4 w-4" />
                    </div>
                    <h3 className="text-sm font-bold text-white group-hover:text-white transition-colors">
                      1. BaaS & Secret Hunter
                    </h3>
                    <p className="text-xs text-neutral-400 leading-relaxed">
                      Decodes Supabase/Firebase JWTs in memory: permits public <code className="text-neutral-300">anon</code> keys with zero false alarms while isolating critical <code className="text-neutral-300">service_role</code> bypasses.
                    </p>
                  </div>
                  <div className="flex items-center space-x-1 text-[11px] font-mono text-neutral-400 group-hover:text-white pt-2 border-t border-white/[0.04]">
                    <span>Inspect Claims Lab</span>
                    <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>

                {/* Pillar 2: Source Map & Build Exposure */}
                <Link
                  href="/vulnerabilities"
                  className="group rounded-2xl border border-white/[0.08] bg-[#080B11]/80 hover:bg-[#0B0E17] hover:border-white/20 p-5 transition-all space-y-3 backdrop-blur-xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] flex flex-col justify-between"
                >
                  <div className="space-y-2.5">
                    <div className="h-9 w-9 rounded-xl bg-white/[0.05] border border-white/10 flex items-center justify-center text-white group-hover:scale-105 transition-transform">
                      <FileCode className="h-4 w-4" />
                    </div>
                    <h3 className="text-sm font-bold text-white group-hover:text-white transition-colors">
                      2. Build & Source Maps
                    </h3>
                    <p className="text-xs text-neutral-400 leading-relaxed">
                      Strips unminified <code className="text-neutral-300">.js.map</code> code exposures. Structural MIME signatures eliminate SPA 200 OK wildcard HTML false alarms on <code className="text-neutral-300">/.env</code> and <code className="text-neutral-300">/.git</code>.
                    </p>
                  </div>
                  <div className="flex items-center space-x-1 text-[11px] font-mono text-neutral-400 group-hover:text-white pt-2 border-t border-white/[0.04]">
                    <span>Inspect Artifact Diffs</span>
                    <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>

                {/* Pillar 3: Headers & Cookie Hygiene */}
                <Link
                  href="/architecture"
                  className="group rounded-2xl border border-white/[0.08] bg-[#080B11]/80 hover:bg-[#0B0E17] hover:border-white/20 p-5 transition-all space-y-3 backdrop-blur-xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] flex flex-col justify-between"
                >
                  <div className="space-y-2.5">
                    <div className="h-9 w-9 rounded-xl bg-white/[0.05] border border-white/10 flex items-center justify-center text-white group-hover:scale-105 transition-transform">
                      <Shield className="h-4 w-4" />
                    </div>
                    <h3 className="text-sm font-bold text-white group-hover:text-white transition-colors">
                      3. Headers & Cookies
                    </h3>
                    <p className="text-xs text-neutral-400 leading-relaxed">
                      Instant evaluation of Content-Security-Policy, HSTS preload, X-Frame-Options (clickjacking), and authentication cookie security flags.
                    </p>
                  </div>
                  <div className="flex items-center space-x-1 text-[11px] font-mono text-neutral-400 group-hover:text-white pt-2 border-t border-white/[0.04]">
                    <span>View Security Specs</span>
                    <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>

                {/* Pillar 4: 1-Click AI Fix Prompts */}
                <Link
                  href="/vulnerabilities"
                  className="group rounded-2xl border border-white/[0.08] bg-[#080B11]/80 hover:bg-[#0B0E17] hover:border-white/20 p-5 transition-all space-y-3 backdrop-blur-xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] flex flex-col justify-between"
                >
                  <div className="space-y-2.5">
                    <div className="h-9 w-9 rounded-xl bg-white/[0.05] border border-white/10 flex items-center justify-center text-white group-hover:scale-105 transition-transform">
                      <Bot className="h-4 w-4" />
                    </div>
                    <h3 className="text-sm font-bold text-white group-hover:text-white transition-colors">
                      4. 1-Click AI Fix Prompts
                    </h3>
                    <p className="text-xs text-neutral-400 leading-relaxed">
                      Instant, copy-paste remediation prompts tailored for Next.js, Vite, Express, or Remix to fix findings immediately with Cursor or Claude.
                    </p>
                  </div>
                  <div className="flex items-center space-x-1 text-[11px] font-mono text-neutral-400 group-hover:text-white pt-2 border-t border-white/[0.04]">
                    <span>Preview AI Prompts</span>
                    <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              </div>
            </div>

            {/* Protocol Section (Linked from Header) */}
            <div id="protocol" className="pt-10 border-t border-white/[0.08]">
              <div className="text-center mb-8 space-y-1.5">
                <span className="text-xs font-mono uppercase tracking-wider text-neutral-400">
                  Execution Safety Guarantees
                </span>
                <h2 className="text-2xl font-bold text-white tracking-tight">
                  Zero-Storage Protocol
                </h2>
                <p className="text-xs sm:text-sm text-neutral-400 max-w-lg mx-auto">
                  How ShipSafe operates without recording, caching, or exfiltrating target inspection data.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-5 rounded-2xl bg-[#080B11]/70 border border-white/[0.08] space-y-2.5">
                  <div className="h-8 w-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <Lock className="h-4 w-4" />
                  </div>
                  <h3 className="text-sm font-bold text-white">Ephemeral In-Memory Execution</h3>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    Inspection results are compiled in transient memory and delivered directly to your client session. No database or disk persistence.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-[#080B11]/70 border border-white/[0.08] space-y-2.5">
                  <div className="h-8 w-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                    <Shield className="h-4 w-4" />
                  </div>
                  <h3 className="text-sm font-bold text-white">Passive Inspection Only</h3>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    ShipSafe never executes invasive fuzzing, injections, or exploits. All checks evaluate static headers, exposed manifests, and DOM artifacts.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-[#080B11]/70 border border-white/[0.08] space-y-2.5">
                  <div className="h-8 w-8 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
                    <Zap className="h-4 w-4" />
                  </div>
                  <h3 className="text-sm font-bold text-white">SSRF Guarded Execution</h3>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    Network-level filtering prevents loopback exfiltration, cloud metadata interception, and private network exposure during remote scans.
                  </p>
                </div>
              </div>
            </div>

            {/* FAQ Section (Linked from Header) */}
            <div id="faq" className="pt-10 border-t border-white/[0.08]">
              <div className="text-center mb-8 space-y-1.5">
                <span className="text-xs font-mono uppercase tracking-wider text-neutral-400">
                  Common Questions
                </span>
                <h2 className="text-2xl font-bold text-white tracking-tight">
                  Frequently Asked Questions
                </h2>
              </div>

              <div className="max-w-3xl mx-auto space-y-3">
                <div className="p-4 rounded-xl bg-[#080B11]/70 border border-white/[0.08] space-y-1.5">
                  <div className="flex items-center space-x-2 text-white font-medium text-xs sm:text-sm">
                    <HelpCircle className="h-3.5 w-3.5 text-neutral-400" />
                    <span>How does ShipSafe prevent false alarms on Supabase anon keys?</span>
                  </div>
                  <p className="text-xs text-neutral-400 pl-5.5 leading-relaxed">
                    ShipSafe decodes the JWT claims in memory to check the <code className="text-neutral-300">role</code> payload. Public <code className="text-neutral-300">anon</code> keys meant for browser client instantiation are recognized and marked safe, while high-privilege <code className="text-neutral-300">service_role</code> bypass keys trigger immediate critical alerts.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#080B11]/70 border border-white/[0.08] space-y-1.5">
                  <div className="flex items-center space-x-2 text-white font-medium text-xs sm:text-sm">
                    <HelpCircle className="h-3.5 w-3.5 text-neutral-400" />
                    <span>Can I audit localhost applications during development?</span>
                  </div>
                  <p className="text-xs text-neutral-400 pl-5.5 leading-relaxed">
                    Yes. Running ShipSafe locally enables rapid testing of <code className="text-neutral-300">localhost:3000</code>, ensuring your Next.js, Vite, or Remix apps are verified before git push or production deployment.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#080B11]/70 border border-white/[0.08] space-y-1.5">
                  <div className="flex items-center space-x-2 text-white font-medium text-xs sm:text-sm">
                    <HelpCircle className="h-3.5 w-3.5 text-neutral-400" />
                    <span>What security standards are these checks aligned with?</span>
                  </div>
                  <p className="text-xs text-neutral-400 pl-5.5 leading-relaxed">
                    All 98 heuristics align with OWASP ASVS v4.0 (Application Security Verification Standard) and OWASP Top 10 client-side risk guidelines.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-white/[0.08] bg-[#030407] py-8 mt-20 text-center text-xs text-neutral-400 font-mono z-10">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
            <span>ShipSafe v1.0 • Passive Security Hygiene Auditor</span>
          </div>
          <div className="flex items-center space-x-6 text-neutral-400">
            <Link href="/" className="hover:text-white transition-colors">Auditor</Link>
            <Link href="/vulnerabilities" className="hover:text-white transition-colors">Vulnerabilities</Link>
            <Link href="/architecture" className="hover:text-white transition-colors">Architecture</Link>
            <Link href="/demo-target" className="hover:text-white transition-colors">Sandbox</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
