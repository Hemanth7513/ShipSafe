import Link from 'next/link';

export default function DemoTargetPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6">
      <div className="max-w-xl w-full bg-slate-900/60 border border-amber-500/30 rounded-2xl p-8 backdrop-blur-xl shadow-2xl">
        <div className="flex items-center space-x-3 mb-4">
          <span className="flex h-3 w-3 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
          </span>
          <span className="text-xs font-mono uppercase tracking-wider text-amber-400 font-semibold">
            ShipSafe Intentionally Misconfigured Sandbox
          </span>
        </div>

        <h1 className="text-2xl font-bold text-white mb-2">
          Demo Vibe-Coded Web App
        </h1>
        <p className="text-slate-400 text-sm mb-6 leading-relaxed">
          This route simulates an early-stage startup app shipped with typical AI code generator oversights.
          It serves as a safe target for demonstrating ShipSafe’s passive detection capabilities.
        </p>

        <div className="space-y-3 bg-slate-950/80 rounded-xl p-4 border border-slate-800 font-mono text-xs text-slate-300">
          <div className="flex justify-between border-b border-slate-800/80 pb-2">
            <span className="text-slate-500">Target Type:</span>
            <span className="text-emerald-400">Next.js App Router (Client CSR)</span>
          </div>
          <div className="flex justify-between border-b border-slate-800/80 pb-2">
            <span className="text-slate-500">Simulated Leak 1:</span>
            <span className="text-red-400 font-semibold">Supabase service_role JWT in bundle</span>
          </div>
          <div className="flex justify-between border-b border-slate-800/80 pb-2">
            <span className="text-slate-500">Simulated Leak 2:</span>
            <span className="text-amber-400">Exposed production .js.map file</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Headers:</span>
            <span className="text-amber-400">Missing CSP, HSTS, X-Content-Type-Options</span>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-800/80 flex items-center justify-between">
          <span className="text-xs text-slate-500">Return to Auditor:</span>
          <Link
            href="/"
            className="inline-flex items-center px-4 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium hover:bg-emerald-500/20 transition-all"
          >
            ← Open ShipSafe Scanner
          </Link>
        </div>
      </div>
    </div>
  );
}
