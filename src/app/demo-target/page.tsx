import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function DemoTargetPage() {
  return (
    <div className="min-h-screen bg-black text-neutral-100 flex flex-col items-center justify-center p-6 selection:bg-white selection:text-black">
      <div className="max-w-xl w-full bg-[#0B0D11]/90 border border-white/10 rounded-2xl p-8 backdrop-blur-2xl shadow-2xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)]">
        <div className="flex items-center space-x-3 mb-4">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neutral-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
          </span>
          <span className="text-xs font-mono uppercase tracking-wider text-neutral-400 font-semibold">
            ShipSafe Sandboxed Target Environment
          </span>
        </div>

        <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">
          Simulated Rapid-Prototyped Web Application
        </h1>
        <p className="text-neutral-400 text-xs mb-6 leading-relaxed">
          This sandbox simulates a rapid-prototyped application deployed with common architectural oversights (such as client-bundled administrative credentials, public source maps, and missing defense-in-depth headers) to test ShipSafe’s passive detection pipeline safely without network side-effects.
        </p>

        <div className="space-y-3 bg-[#050608] rounded-xl p-4 border border-white/[0.08] font-mono text-xs text-neutral-300">
          <div className="flex justify-between border-b border-white/[0.06] pb-2">
            <span className="text-neutral-500">Target Profile:</span>
            <span className="text-white font-medium">Next.js App Router (Client CSR Bundle)</span>
          </div>
          <div className="flex justify-between border-b border-white/[0.06] pb-2">
            <span className="text-neutral-500">Simulated Vector 1:</span>
            <span className="text-red-400 font-semibold">Supabase service_role JWT in bundle (-40 pts)</span>
          </div>
          <div className="flex justify-between border-b border-white/[0.06] pb-2">
            <span className="text-neutral-500">Simulated Vector 2:</span>
            <span className="text-orange-400">Exposed production .js.map file (-18 pts)</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-500">Simulated Vector 3:</span>
            <span className="text-amber-400">Missing CSP, HSTS, and X-Content-Type-Options</span>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-white/[0.06] flex items-center justify-between">
          <span className="text-xs text-neutral-500 font-mono">Return to Primary Auditor:</span>
          <Link
            href="/"
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-white hover:bg-neutral-200 text-black text-xs font-semibold transition-all shadow-sm active:scale-[0.98]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Open Auditor</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
