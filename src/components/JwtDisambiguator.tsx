'use client';

import React, { useState, useMemo } from 'react';
import { Cpu, ShieldAlert, ShieldCheck, Check, Copy } from 'lucide-react';

const SAMPLE_ANON_JWT =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3ZXJ0eXVpb3BhcyIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzA0MDY3MjAwLCJleHAiOjIwMTk0MjcyMDB9.4VfG6e2jY3_sample_signature_hash_anon_token';

const SAMPLE_SERVICE_ROLE_JWT =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3ZXJ0eXVpb3BhcyIsInJvbGUiOiJzZXJ2aWNlX3JvbGUiLCJpYXQiOjE3MDQwNjcyMDAsImV4cCI6MjAxOTQyNzIwMH0.8xK19mP_sample_signature_service_role_bypass';

function decodeJwtParts(token: string) {
  try {
    const parts = token.trim().split('.');
    if (parts.length < 2) return null;

    const base64UrlDecode = (str: string) => {
      let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
      while (base64.length % 4) {
        base64 += '=';
      }
      return decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
    };

    const header = JSON.parse(base64UrlDecode(parts[0]));
    const payload = JSON.parse(base64UrlDecode(parts[1]));
    const signature = parts[2] || '';

    return { header, payload, signature };
  } catch {
    return null;
  }
}

export default function JwtDisambiguator() {
  const [tokenInput, setTokenInput] = useState(SAMPLE_SERVICE_ROLE_JWT);
  const [copied, setCopied] = useState(false);

  const decoded = useMemo(() => decodeJwtParts(tokenInput), [tokenInput]);

  const roleClaim = decoded?.payload?.role;
  const isServiceRole = roleClaim === 'service_role';
  const isAnon = roleClaim === 'anon';

  const handleCopy = () => {
    navigator.clipboard.writeText(tokenInput);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="rounded-3xl border border-white/10 bg-[#0B0D11]/90 backdrop-blur-2xl p-6 md:p-8 space-y-6 shadow-2xl relative overflow-hidden shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="inline-flex items-center space-x-2 text-[11px] font-mono text-neutral-400">
            <Cpu className="h-3.5 w-3.5 text-white" />
            <span>In-Memory Disambiguation Lab</span>
          </div>
          <h3 className="text-lg md:text-xl font-bold text-white tracking-tight">
            Interactive BaaS JWT Claims Inspector
          </h3>
          <p className="text-xs text-neutral-400 max-w-xl">
            See how ShipSafe safely unpacks JWTs in memory to eliminate false alarms on public <code className="text-neutral-200">anon</code> keys while pinpointing catastrophic <code className="text-red-400">service_role</code> leaks.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setTokenInput(SAMPLE_ANON_JWT)}
            className={`text-xs font-mono px-3 py-1.5 rounded-xl border transition-all ${
              tokenInput === SAMPLE_ANON_JWT
                ? 'bg-white text-black font-semibold border-white'
                : 'bg-white/[0.04] text-neutral-300 border-white/10 hover:text-white hover:bg-white/[0.08]'
            }`}
          >
            Sample anon Key
          </button>
          <button
            type="button"
            onClick={() => setTokenInput(SAMPLE_SERVICE_ROLE_JWT)}
            className={`text-xs font-mono px-3 py-1.5 rounded-xl border transition-all ${
              tokenInput === SAMPLE_SERVICE_ROLE_JWT
                ? 'bg-red-500/20 text-red-300 font-semibold border-red-500/40'
                : 'bg-white/[0.04] text-neutral-300 border-white/10 hover:text-white hover:bg-white/[0.08]'
            }`}
          >
            Sample service_role Key
          </button>
        </div>
      </div>

      {/* Raw Token Input */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-mono text-neutral-400">
          <span>Target BaaS Client Token (Base64 JWT):</span>
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center space-x-1 hover:text-white transition-colors"
          >
            {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
        <textarea
          rows={2}
          value={tokenInput}
          onChange={(e) => setTokenInput(e.target.value)}
          placeholder="Paste any standard JWT token (e.g. eyJhbGci...)"
          className="w-full px-4 py-3 rounded-xl bg-[#050608] border border-white/10 focus:border-white focus:ring-1 focus:ring-white/20 text-xs text-neutral-300 font-mono transition-all outline-none resize-none"
        />
      </div>

      {/* Live Verdict Banner */}
      <div className={`p-5 rounded-2xl border transition-all space-y-3 ${
        isServiceRole
          ? 'bg-red-950/25 border-red-500/40 shadow-[0_0_30px_rgba(239,68,68,0.08)]'
          : isAnon
          ? 'bg-emerald-950/20 border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.06)]'
          : 'bg-[#050608] border-white/10'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 border ${
              isServiceRole
                ? 'bg-red-500/15 text-red-400 border-red-500/30'
                : isAnon
                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                : 'bg-white/[0.05] text-neutral-400 border-white/10'
            }`}>
              {isServiceRole ? (
                <ShieldAlert className="h-5 w-5" />
              ) : (
                <ShieldCheck className="h-5 w-5" />
              )}
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                  isServiceRole
                    ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                    : isAnon
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-white/[0.05] text-neutral-400'
                }`}>
                  {isServiceRole ? 'CRITICAL DEFICIENCY (-40 PTS)' : isAnon ? 'INFORMATIONAL (0 PTS)' : 'UNKNOWN TOKEN'}
                </span>
                <span className="text-xs font-mono text-neutral-400">
                  Role: <strong className={isServiceRole ? 'text-red-400' : isAnon ? 'text-emerald-400' : 'text-white'}>{roleClaim || 'None'}</strong>
                </span>
              </div>
              <h4 className="text-sm font-bold text-white mt-0.5">
                {isServiceRole
                  ? 'Catastrophic Finding: Administrative Secret Exposed to Client'
                  : isAnon
                  ? 'Permitted Pattern: Public Anonymous Client Identifier'
                  : 'Custom or Unrecognized JWT Claims Payload'}
              </h4>
            </div>
          </div>

          <div className="text-right text-[11px] font-mono">
            <span className="text-neutral-500 block">ShipSafe Deduction</span>
            <span className={isServiceRole ? 'text-red-400 font-bold text-base' : 'text-emerald-400 font-bold text-base'}>
              {isServiceRole ? '-40 Points' : '0 Points'}
            </span>
          </div>
        </div>

        <p className="text-xs text-neutral-300 font-mono leading-relaxed pt-1">
          {isServiceRole
            ? 'The service_role key grants root database access that completely bypasses all PostgreSQL Row-Level Security (RLS) policies. Any visitor inspecting browser network requests or bundle files can execute arbitrary SQL queries, drop tables, or extract private user records.'
            : isAnon
            ? 'The anon token is architecturally designed to be public. It restricts client queries to only the tables and rows explicitly permitted by your PostgreSQL Row-Level Security (RLS) policies.'
            : 'Custom token payload detected. In-memory inspection evaluates standard role claims for privilege escalation risks.'}
        </p>
      </div>

      {/* Decoded Claims Inspector */}
      {decoded ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-white/[0.06] bg-[#050608] p-4 space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 block">
              Decoded Header (Base64 Header)
            </span>
            <pre className="text-xs font-mono text-neutral-300 bg-black/40 p-3 rounded-xl overflow-x-auto border border-white/[0.04]">
              {JSON.stringify(decoded.header, null, 2)}
            </pre>
          </div>

          <div className="rounded-2xl border border-white/[0.06] bg-[#050608] p-4 space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 block">
              Decoded Payload (In-Memory Claims)
            </span>
            <pre className="text-xs font-mono text-neutral-300 bg-black/40 p-3 rounded-xl overflow-x-auto border border-white/[0.04]">
              {JSON.stringify(decoded.payload, null, 2)}
            </pre>
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-xs font-mono text-red-300">
          Invalid JWT token format. Must be a 3-part base64url encoded token.
        </div>
      )}
    </div>
  );
}
