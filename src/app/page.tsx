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
  Terminal,
  Check,
  SearchCode,
  Globe,
  Cpu,
  Sparkles,
  Bot,
  FileCode
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
    <div className="min-h-screen bg-black text-neutral-100 flex flex-col selection:bg-white selection:text-black relative overflow-x-hidden">
      {/* Top Ambient White Spotlight */}
      <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[900px] h-[400px] bg-gradient-to-b from-white/[0.12] via-white/[0.03] to-transparent rounded-full blur-3xl z-0" />

      <Header />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6 md:py-10 z-10">
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
                    className={`relative px-4 py-2 rounded-xl text-xs font-mono transition-colors shrink-0 cursor-pointer ${
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
          /* State 3: Clean Black Monolith Hero (Compact & Uncluttered) */
          <motion.div
            initial={false}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.45 }}
            className="space-y-8 md:space-y-10"
          >
            {/* Header Badge & Title */}
            <div className="text-center space-y-2.5 max-w-2xl mx-auto pt-2">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/10 text-xs font-mono text-neutral-300">
                <SearchCode className="h-3.5 w-3.5 text-white" />
                <span>Zero-Exploit Passive Security Hygiene Assessment</span>
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight bg-gradient-to-b from-white via-neutral-100 to-neutral-400 bg-clip-text text-transparent leading-tight">
                Ship Fast. Audit Faster.
              </h1>

              <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed max-w-lg mx-auto">
                Passive security hygiene auditing for modern web applications. Zero backend data retention.
              </p>
            </div>

            {/* Black Monolith Obsidian Input Card */}
            <div className="max-w-2xl mx-auto">
              <div className="rounded-2xl border border-white/15 bg-[#0A0C10] p-5 sm:p-6 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.9),inset_0_1px_0_0_rgba(255,255,255,0.12)] relative overflow-hidden backdrop-blur-2xl">
                <form onSubmit={handleSubmit} className="space-y-3.5">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-mono text-neutral-300">
                      <span>Target Web Application URL:</span>
                      <span className="text-[11px] text-neutral-500 hidden sm:inline">Public HTTPS or dev entrypoint</span>
                    </div>

                    <div className="relative flex items-center h-13 w-full rounded-xl bg-[#030406] border border-white/20 p-1.5 pl-3.5 focus-within:border-white/50 focus-within:ring-1 focus-within:ring-white/20 transition-all shadow-inner">
                      <Globe className="h-4 w-4 text-neutral-400 shrink-0 mr-2.5" />
                      <input
                        ref={inputRef}
                        type="text"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="https://your-app.com or localhost:3000"
                        className="flex-1 h-full bg-transparent text-xs sm:text-sm text-white placeholder-neutral-500 font-mono outline-none border-none pr-2"
                      />
                      <span className="hidden sm:inline-block text-[10px] font-mono text-neutral-500 bg-white/[0.04] border border-white/10 px-2 py-0.5 rounded mr-2 pointer-events-none shrink-0">
                        /
                      </span>
                      <button
                        type="submit"
                        disabled={loading}
                        className="h-full px-4 sm:px-5 rounded-lg bg-white hover:bg-neutral-200 text-black font-semibold text-xs sm:text-sm flex items-center space-x-1.5 transition-all shadow-md active:scale-[0.98] shrink-0 cursor-pointer"
                      >
                        <Shield className="h-3.5 w-3.5" />
                        <span>Audit Target</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Clean Presets Row */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5 text-[11px] font-mono">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-neutral-500 mr-0.5">Presets:</span>
                      <button
                        type="button"
                        onClick={handleDemoScan}
                        className="px-2.5 py-1 rounded-md bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-neutral-300 hover:text-white transition-all flex items-center space-x-1 cursor-pointer"
                      >
                        <Terminal className="h-3 w-3 text-neutral-400" />
                        <span>Simulated Target</span>
                        <span className="text-[9px] px-1 py-0.2 rounded bg-neutral-800 text-neutral-300 border border-white/10">Grade D</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleLiveSelfScan}
                        className="px-2.5 py-1 rounded-md bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-neutral-300 hover:text-white transition-all flex items-center space-x-1 cursor-pointer"
                      >
                        <Shield className="h-3 w-3 text-neutral-400" />
                        <span>Self-Inspection</span>
                        <span className="text-[9px] px-1 py-0.2 rounded bg-neutral-800 text-neutral-300 border border-white/10">Grade A+</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleLocalhostScan}
                        className="px-2.5 py-1 rounded-md bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-neutral-300 hover:text-white transition-all flex items-center space-x-1 cursor-pointer"
                      >
                        <Terminal className="h-3 w-3 text-neutral-400" />
                        <span>localhost:3000</span>
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
                              className="px-2 py-0.5 rounded bg-[#050608] hover:bg-white/[0.06] border border-white/[0.08] text-[10px] text-neutral-400 hover:text-white transition-all truncate max-w-[130px] cursor-pointer"
                              title={`Load ${scan.url}`}
                            >
                              {host} ({scan.grade})
                            </button>
                          );
                        })}
                        <button
                          type="button"
                          onClick={clearRecentScans}
                          className="text-[10px] text-neutral-600 hover:text-neutral-400 transition-colors ml-0.5 cursor-pointer"
                        >
                          Clear
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Demo Information Banner */}
                  {demoNotice && (
                    <div className="p-3 rounded-xl bg-white/[0.04] border border-white/10 text-xs font-mono text-neutral-300 flex items-center space-x-2">
                      <Sparkles className="h-4 w-4 text-neutral-300 shrink-0" />
                      <span>{demoNotice}</span>
                    </div>
                  )}

                  {/* Error Notification */}
                  {error && (
                    <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/30 text-xs text-red-300 flex items-center space-x-2">
                      <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}
                </form>
              </div>

              {/* Capability Metrics Badges (Monochrome & Polished) */}
              <div className="flex flex-wrap items-center justify-center gap-2.5 pt-3">
                <span className="inline-flex items-center space-x-1.5 text-[11px] font-mono text-neutral-300 px-3 py-1 rounded-full bg-white/[0.04] border border-white/10 shadow-sm">
                  <span className="h-1.5 w-1.5 rounded-full bg-white"></span>
                  <span>98 Automated Defensive Heuristics</span>
                </span>
                <span className="inline-flex items-center space-x-1.5 text-[11px] font-mono text-neutral-300 px-3 py-1 rounded-full bg-white/[0.04] border border-white/10 shadow-sm">
                  <Check className="h-3 w-3 text-neutral-300" />
                  <span>In-Memory Zero-Storage Execution</span>
                </span>
                <span className="inline-flex items-center space-x-1.5 text-[11px] font-mono text-neutral-300 px-3 py-1 rounded-full bg-white/[0.04] border border-white/10 shadow-sm">
                  <Shield className="h-3 w-3 text-neutral-300" />
                  <span>OWASP ASVS v4.0 Aligned</span>
                </span>
              </div>
            </div>

            {/* The 4 Core Pillars - Clean, Punchy & Uncluttered */}
            <div className="pt-4">
              <div className="text-center mb-5 space-y-1">
                <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-500">
                  Focused Security Engine
                </span>
                <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                  The 4 Core Pillars of ShipSafe
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
                {/* Pillar 1: BaaS & Secret Hunter */}
                <Link
                  href="/vulnerabilities"
                  className="group rounded-xl border border-white/[0.08] bg-[#0A0C10] hover:border-white/20 p-4 transition-all space-y-2 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="h-8 w-8 rounded-lg bg-white/[0.05] border border-white/10 flex items-center justify-center text-white group-hover:scale-105 transition-transform">
                      <Cpu className="h-3.5 w-3.5" />
                    </div>
                    <h3 className="text-xs font-bold text-white">
                      1. BaaS & Secret Hunter
                    </h3>
                    <p className="text-[11px] text-neutral-400 leading-relaxed">
                      Decodes Supabase/Firebase JWTs in memory: permits safe public keys while catching dangerous admin bypasses.
                    </p>
                  </div>
                  <div className="flex items-center space-x-1 text-[10px] font-mono text-neutral-500 group-hover:text-white pt-2 border-t border-white/[0.04]">
                    <span>Inspect Claims Lab</span>
                    <ArrowRight className="h-2.5 w-2.5 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </Link>

                {/* Pillar 2: Build & Source Maps */}
                <Link
                  href="/vulnerabilities"
                  className="group rounded-xl border border-white/[0.08] bg-[#0A0C10] hover:border-white/20 p-4 transition-all space-y-2 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="h-8 w-8 rounded-lg bg-white/[0.05] border border-white/10 flex items-center justify-center text-white group-hover:scale-105 transition-transform">
                      <FileCode className="h-3.5 w-3.5" />
                    </div>
                    <h3 className="text-xs font-bold text-white">
                      2. Build & Source Maps
                    </h3>
                    <p className="text-[11px] text-neutral-400 leading-relaxed">
                      Strips exposed unminified code. MIME validation blocks false alerts on SPA wildcard 200 OK routes.
                    </p>
                  </div>
                  <div className="flex items-center space-x-1 text-[10px] font-mono text-neutral-500 group-hover:text-white pt-2 border-t border-white/[0.04]">
                    <span>Inspect Artifact Diffs</span>
                    <ArrowRight className="h-2.5 w-2.5 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </Link>

                {/* Pillar 3: Headers & Cookie Hygiene */}
                <Link
                  href="/architecture"
                  className="group rounded-xl border border-white/[0.08] bg-[#0A0C10] hover:border-white/20 p-4 transition-all space-y-2 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="h-8 w-8 rounded-lg bg-white/[0.05] border border-white/10 flex items-center justify-center text-white group-hover:scale-105 transition-transform">
                      <Shield className="h-3.5 w-3.5" />
                    </div>
                    <h3 className="text-xs font-bold text-white">
                      3. Headers & Cookies
                    </h3>
                    <p className="text-[11px] text-neutral-400 leading-relaxed">
                      Evaluates CSP, HSTS preload, X-Frame-Options clickjacking, and authentication cookie security flags.
                    </p>
                  </div>
                  <div className="flex items-center space-x-1 text-[10px] font-mono text-neutral-500 group-hover:text-white pt-2 border-t border-white/[0.04]">
                    <span>View Security Specs</span>
                    <ArrowRight className="h-2.5 w-2.5 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </Link>

                {/* Pillar 4: 1-Click AI Fix Prompts */}
                <Link
                  href="/vulnerabilities"
                  className="group rounded-xl border border-white/[0.08] bg-[#0A0C10] hover:border-white/20 p-4 transition-all space-y-2 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="h-8 w-8 rounded-lg bg-white/[0.05] border border-white/10 flex items-center justify-center text-white group-hover:scale-105 transition-transform">
                      <Bot className="h-3.5 w-3.5" />
                    </div>
                    <h3 className="text-xs font-bold text-white">
                      4. 1-Click AI Fix Prompts
                    </h3>
                    <p className="text-[11px] text-neutral-400 leading-relaxed">
                      Instant, tailored remediation prompts for Next.js, Vite, or Remix to fix findings directly with AI agents.
                    </p>
                  </div>
                  <div className="flex items-center space-x-1 text-[10px] font-mono text-neutral-500 group-hover:text-white pt-2 border-t border-white/[0.04]">
                    <span>Preview AI Prompts</span>
                    <ArrowRight className="h-2.5 w-2.5 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-white/[0.08] bg-black py-6 mt-12 text-center text-xs text-neutral-500 font-mono z-10">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
            <span>ShipSafe v1.0 • Passive Security Hygiene Auditor</span>
          </div>
          <div className="flex items-center space-x-5 text-neutral-400">
            <Link href="/" className="hover:text-white transition-colors">Auditor</Link>
            <Link href="/vulnerabilities" className="hover:text-white transition-colors">Vulnerabilities</Link>
            <Link href="/architecture" className="hover:text-white transition-colors">Architecture</Link>
            <Link href="/protocol" className="hover:text-white transition-colors">Protocol</Link>
            <Link href="/faq" className="hover:text-white transition-colors">FAQ</Link>
            <Link href="/demo-target" className="hover:text-white transition-colors">Sandbox</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
