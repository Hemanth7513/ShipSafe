'use client';

import React, { useState, useEffect, useRef } from 'react';
import Header from '@/components/Header';
import TerminalStepper from '@/components/TerminalStepper';
import ScoreCard from '@/components/ScoreCard';
import FindingCard from '@/components/FindingCard';
import ChecklistModal from '@/components/ChecklistModal';
import CodeDiffInspector from '@/components/CodeDiffInspector';
import FaqSection from '@/components/FaqSection';
import FloatingNav from '@/components/FloatingNav';
import { ScanResult, FindingCategory } from '@/lib/types/scan';
import { 
  Shield, 
  ArrowRight, 
  CheckCircle2, 
  AlertTriangle, 
  Eye, 
  ShieldAlert, 
  Cpu, 
  History, 
  ListChecks, 
  Terminal,
  Activity,
  Check,
  SearchCode
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
  const [confirmedOwnership, setConfirmedOwnership] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTarget, setActiveTarget] = useState('');
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | FindingCategory>('all');
  const [checklistOpen, setChecklistOpen] = useState(false);
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
          confirmedOwnership: isDemo ? true : confirmedOwnership,
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
      setError('Please provide a target web application URL.');
      return;
    }
    if (!confirmedOwnership) {
      setError('Please acknowledge the authorization confirmation verifying permission to audit this domain.');
      return;
    }
    startScan(url.trim(), false);
  };

  const handleDemoScan = () => {
    const demoUrl = 'https://demo-vibe-target.internal';
    setUrl(demoUrl);
    setConfirmedOwnership(true);
    startScan(demoUrl, true);
  };

  const handleLiveSelfScan = () => {
    const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://shipsafe.vercel.app';
    setUrl(currentOrigin);
    setConfirmedOwnership(true);
    startScan(currentOrigin, false);
  };

  const handleSelectRecent = (recentUrl: string) => {
    setUrl(recentUrl);
    setConfirmedOwnership(true);
    setError(null);
    inputRef.current?.focus();
  };

  const handleReset = () => {
    setResult(null);
    setUrl('');
    setError(null);
    setConfirmedOwnership(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToInput = () => {
    if (result) {
      handleReset();
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => inputRef.current?.focus(), 300);
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

      <Header onOpenChecklist={() => setChecklistOpen(true)} />

      {/* Floating Quick Action Pill for Surfing Users */}
      <FloatingNav
        onScrollToTop={scrollToInput}
        onRunDemo={handleDemoScan}
        onOpenChecklist={() => setChecklistOpen(true)}
      />

      {/* Checklist Modal */}
      <ChecklistModal isOpen={checklistOpen} onClose={() => setChecklistOpen(false)} />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8 md:py-14 z-10">
        {/* State 1: Scan Results Available */}
        {result ? (
          <div>
            <ScoreCard result={result} onReset={handleReset} />

            {/* Filter Tabs */}
            <div className="flex items-center space-x-2 border-b border-white/[0.08] pb-4 mb-6 overflow-x-auto">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-4 py-2 rounded-xl text-xs font-medium transition-all ${
                  activeTab === 'all'
                    ? 'bg-white text-black font-semibold'
                    : 'text-neutral-400 hover:text-white hover:bg-white/[0.05]'
                }`}
              >
                All Findings ({result.findings.length})
              </button>

              <button
                onClick={() => setActiveTab('secrets')}
                className={`px-4 py-2 rounded-xl text-xs font-medium transition-all ${
                  activeTab === 'secrets'
                    ? 'bg-red-500/10 text-red-400 border border-red-500/30 font-semibold'
                    : 'text-neutral-400 hover:text-white hover:bg-white/[0.05]'
                }`}
              >
                Secrets &amp; BaaS ({result.findings.filter(f => f.category === 'secrets' || f.category === 'baas').length})
              </button>

              <button
                onClick={() => setActiveTab('headers')}
                className={`px-4 py-2 rounded-xl text-xs font-medium transition-all ${
                  activeTab === 'headers'
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30 font-semibold'
                    : 'text-neutral-400 hover:text-white hover:bg-white/[0.05]'
                }`}
              >
                Headers &amp; Cookies ({result.findings.filter(f => f.category === 'headers' || f.category === 'cookies').length})
              </button>

              <button
                onClick={() => setActiveTab('artifacts')}
                className={`px-4 py-2 rounded-xl text-xs font-medium transition-all ${
                  activeTab === 'artifacts'
                    ? 'bg-white/10 text-white border border-white/20 font-semibold'
                    : 'text-neutral-400 hover:text-white hover:bg-white/[0.05]'
                }`}
              >
                Artifacts &amp; Maps ({result.findings.filter(f => f.category === 'artifacts').length})
              </button>
            </div>

            {/* Findings List */}
            {filteredFindings.length > 0 ? (
              <div className="space-y-4">
                {filteredFindings.map((finding, idx) => (
                  <FindingCard key={finding.id + idx} finding={finding} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-[#0B0D11]/60 rounded-3xl border border-white/[0.06]">
                <CheckCircle2 className="h-10 w-10 text-emerald-400 mx-auto mb-3" />
                <h3 className="text-base font-semibold text-white">Zero Hygiene Gaps Identified</h3>
                <p className="text-xs text-neutral-400 mt-1">This inspection category satisfied all defensive verification rules.</p>
              </div>
            )}
          </div>
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
          /* State 3: Hero Landing & Interactive Surfing Page */
          <div className="space-y-20">
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

            {/* Input Card */}
            <div className="max-w-2xl mx-auto">
              <div className="rounded-3xl border border-white/10 bg-[#0B0D11]/90 backdrop-blur-2xl p-6 md:p-8 shadow-2xl relative overflow-hidden shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)]">
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-xs font-mono text-neutral-300 font-medium flex items-center justify-between">
                      <span>Target Web Application URL:</span>
                      <span className="text-[11px] text-neutral-400">Public HTTP/HTTPS entrypoint</span>
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

                  {/* Preset Target Pills */}
                  <div className="space-y-1.5 pt-1">
                    <div className="text-[11px] font-mono text-neutral-400 flex items-center justify-between">
                      <span>Target Presets:</span>
                      <button
                        type="button"
                        onClick={() => setChecklistOpen(true)}
                        className="text-[11px] text-neutral-400 hover:text-white flex items-center space-x-1 transition-colors"
                      >
                        <ListChecks className="h-3 w-3" />
                        <span>Pre-Launch Checklist</span>
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={handleDemoScan}
                        className="group flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-xs font-mono text-neutral-300 hover:text-white transition-all active:scale-[0.98]"
                      >
                        <Terminal className="h-3.5 w-3.5 text-neutral-400 group-hover:text-white" />
                        <span>Simulated Target</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-red-500/20 text-red-400 border border-red-500/30">Grade D</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleLiveSelfScan}
                        className="group flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-xs font-mono text-neutral-300 hover:text-white transition-all active:scale-[0.98]"
                      >
                        <Shield className="h-3.5 w-3.5 text-neutral-400 group-hover:text-white" />
                        <span>Self-Inspection (Production)</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Grade A+</span>
                      </button>
                    </div>
                  </div>

                  {/* Session Scans History */}
                  {recentScans.length > 0 && (
                    <div className="space-y-1.5 pt-2 border-t border-white/[0.05]">
                      <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400">
                        <span className="flex items-center space-x-1.5">
                          <History className="h-3 w-3" />
                          <span>Session History:</span>
                        </span>
                        <button
                          type="button"
                          onClick={clearRecentScans}
                          className="hover:text-white transition-colors"
                        >
                          Clear
                        </button>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {recentScans.map((scan, i) => {
                          const displayHost = scan.url.replace(/^https?:\/\//, '').replace(/\/$/, '');
                          return (
                            <button
                              key={scan.url + i}
                              type="button"
                              onClick={() => handleSelectRecent(scan.url)}
                              className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-[#050608] hover:bg-white/[0.06] border border-white/[0.08] text-[11px] font-mono text-neutral-300 hover:text-white transition-all max-w-[260px] truncate"
                              title={`Load ${scan.url}`}
                            >
                              <span className="truncate">{displayHost}</span>
                              <span className={`text-[10px] font-bold px-1 rounded ${
                                scan.grade.startsWith('A') 
                                  ? 'bg-emerald-500/20 text-emerald-400' 
                                  : scan.grade.startsWith('B')
                                  ? 'bg-blue-500/20 text-blue-400'
                                  : scan.grade.startsWith('C')
                                  ? 'bg-amber-500/20 text-amber-400'
                                  : 'bg-red-500/20 text-red-400'
                              }`}>
                                {scan.grade} ({scan.score})
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Authorization Checkbox */}
                  <div className="flex items-start space-x-3 bg-[#050608]/70 p-3.5 rounded-xl border border-white/[0.06]">
                    <input
                      type="checkbox"
                      id="ownership"
                      checked={confirmedOwnership}
                      onChange={(e) => setConfirmedOwnership(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded bg-neutral-900 border-neutral-700 text-white focus:ring-white focus:ring-offset-black"
                    />
                    <label htmlFor="ownership" className="text-xs text-neutral-400 leading-snug cursor-pointer select-none">
                      I confirm I own this domain or possess explicit authorization to inspect its public security posture.
                    </label>
                  </div>

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
                      <span>Run Sandboxed Simulation</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Pre-Launch Readiness Callout Card */}
            <div className="max-w-2xl mx-auto">
              <div 
                onClick={() => setChecklistOpen(true)}
                className="cursor-pointer group rounded-2xl border border-white/[0.08] bg-[#0B0D11]/60 hover:bg-[#0B0D11] hover:border-white/20 p-4 transition-all flex items-center justify-between gap-4 backdrop-blur-xl"
              >
                <div className="flex items-center space-x-3.5">
                  <div className="h-9 w-9 rounded-xl bg-white/[0.05] border border-white/10 flex items-center justify-center text-white shrink-0 group-hover:scale-105 transition-transform">
                    <ListChecks className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white group-hover:text-white transition-colors">
                      Pre-Launch Security Hygiene Protocol
                    </h4>
                    <p className="text-[11px] text-neutral-400">
                      7 critical deployment verifications (BaaS RLS, CSP, Source Map Stripping, Rate Limiting)
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-1 text-xs font-mono text-neutral-400 group-hover:text-white transition-colors shrink-0">
                  <span>Open Protocol</span>
                  <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            </div>

            {/* Interactive Before & After Vulnerability Inspector */}
            <CodeDiffInspector />

            {/* Architecture Highlights Section */}
            <div>
              <div className="text-center mb-10 space-y-2">
                <span className="text-xs font-mono uppercase tracking-wider text-neutral-400">
                  Engineering Architecture
                </span>
                <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                  Zero False-Positive Pipeline &amp; RFC 6890 SSRF Guard
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-[#0B0D11]/70 border border-white/[0.08] rounded-2xl p-6 space-y-3 backdrop-blur-xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] hover:border-white/20 transition-all">
                  <div className="h-10 w-10 rounded-xl bg-white/[0.05] border border-white/10 flex items-center justify-center text-white">
                    <Cpu className="h-5 w-5" />
                  </div>
                  <h3 className="text-base font-bold text-white">BaaS Claims Disambiguation</h3>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    Decodes client JWT claims in memory to distinguish between intended public Supabase <code className="text-neutral-200">anon</code> tokens and critical <code className="text-red-400">service_role</code> bypass keys.
                  </p>
                </div>

                <div className="bg-[#0B0D11]/70 border border-white/[0.08] rounded-2xl p-6 space-y-3 backdrop-blur-xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] hover:border-white/20 transition-all">
                  <div className="h-10 w-10 rounded-xl bg-white/[0.05] border border-white/10 flex items-center justify-center text-white">
                    <ShieldAlert className="h-5 w-5" />
                  </div>
                  <h3 className="text-base font-bold text-white">SSRF &amp; Anti-DNS Rebinding</h3>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    Resolves DNS and blocks all RFC 1918 private subnets, cloud metadata (169.254.169.254), and loopback IPs on <span className="text-white">every single redirect hop</span>.
                  </p>
                </div>

                <div className="bg-[#0B0D11]/70 border border-white/[0.08] rounded-2xl p-6 space-y-3 backdrop-blur-xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] hover:border-white/20 transition-all">
                  <div className="h-10 w-10 rounded-xl bg-white/[0.05] border border-white/10 flex items-center justify-center text-white">
                    <Eye className="h-5 w-5" />
                  </div>
                  <h3 className="text-base font-bold text-white">SPA Catch-All Elimination</h3>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    Validates content signatures and MIME types on <code className="text-neutral-200">/.env</code> and <code className="text-neutral-200">.js.map</code> rather than naive 200 status codes, preventing SPA 404 false alarms.
                  </p>
                </div>
              </div>
            </div>

            {/* Interactive FAQ Section */}
            <FaqSection />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-white/[0.08] bg-black py-8 mt-20 text-center text-xs text-neutral-400 font-mono z-10">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
            <span>ShipSafe v1.0 • Passive Security Hygiene Auditor</span>
          </div>
          <span>Mapped to OWASP Top 10 (2021) &amp; OWASP ASVS v4.0</span>
          <div className="flex items-center space-x-4 text-neutral-400">
            <button 
              type="button" 
              onClick={scrollToInput} 
              className="hover:text-white transition-colors"
            >
              Top ↑
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
