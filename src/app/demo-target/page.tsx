import Link from 'next/link';

export default function DemoTargetPage() {
  return (
    <div className="min-h-screen bg-black text-neutral-100 flex flex-col items-center justify-center p-6 selection:bg-white selection:text-black">
      <div className="max-w-xl w-full bg-[#0B0D11]/90 border border-white/10 rounded-2xl p-8 backdrop-blur-2xl shadow-2xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)]">
        <div className="flex items-center space-x-3 mb-4">
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
          </span>
          <span className="text-xs font-mono uppercase tracking-wider text-amber-400 font-semibold">
            ShipSafe Intentionally Misconfigured Sandbox
          </span>
        </div>

        <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">
          Demo Vibe-Coded Web App
        </h1>
        <p className="text-neutral-400 text-sm mb-6 leading-relaxed">
          This route simulates an early-stage startup app shipped with typical AI code generator oversights.
          It serves as a safe target for demonstrating ShipSafe’s passive detection capabilities.
        </p>

        <div className="space-y-3 bg-[#050608] rounded-xl p-4 border border-white/[0.08] font-mono text-xs text-neutral-300">
          <div className="flex justify-between border-b border-white/[0.06] pb-2">
            <span className="text-neutral-500">Target Type:</span>
            <span className="text-white font-medium">Next.js App Router (Client CSR)</span>
          </div>
          <div className="flex justify-between border-b border-white/[0.06] pb-2">
            <span className="text-neutral-500">Simulated Leak 1:</span>
            <span className="text-red-400 font-semibold">Supabase service_role JWT in bundle</span>
          </div>
          <div className="flex justify-between border-b border-white/[0.06] pb-2">
            <span className="text-neutral-500">Simulated Leak 2:</span>
            <span className="text-orange-400">Exposed production .js.map file</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-500">Headers:</span>
            <span className="text-amber-400">Missing CSP, HSTS, X-Content-Type-Options</span>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-white/[0.06] flex items-center justify-between">
          <span className="text-xs text-neutral-500">Return to Auditor:</span>
          <Link
            href="/"
            className="inline-flex items-center px-4 py-2 rounded-lg bg-white hover:bg-neutral-200 text-black text-xs font-semibold transition-all shadow-sm active:scale-[0.98]"
          >
            ← Open ShipSafe Scanner
          </Link>
        </div>
      </div>
    </div>
  );
}
