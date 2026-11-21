'use client';

import React, { useState, useMemo } from 'react';
import { ShieldAlert, ShieldCheck, RefreshCw } from 'lucide-react';

interface PresetAddress {
  label: string;
  ip: string;
  expected: 'blocked' | 'allowed';
  cidr: string;
  risk: string;
}

const PRESET_ADDRESSES: PresetAddress[] = [
  {
    label: 'Loopback Host',
    ip: '127.0.0.1',
    expected: 'blocked',
    cidr: '127.0.0.0/8 (RFC 6890)',
    risk: 'Internal Host Service Enumeration & Local Process Hijack'
  },
  {
    label: 'AWS/GCP Cloud Metadata',
    ip: '169.254.169.254',
    expected: 'blocked',
    cidr: '169.254.0.0/16 (RFC 3927)',
    risk: 'IMDSv1/v2 IAM Security Credential Exfiltration'
  },
  {
    label: 'Private VPC Subnet',
    ip: '10.0.4.15',
    expected: 'blocked',
    cidr: '10.0.0.0/8 (RFC 1918)',
    risk: 'Private Backend Microservice & Database Port Scanning'
  },
  {
    label: 'Home/Office LAN Gateway',
    ip: '192.168.1.1',
    expected: 'blocked',
    cidr: '192.168.0.0/16 (RFC 1918)',
    risk: 'Intranet Router Administration Interface Access'
  },
  {
    label: 'Carrier-Grade NAT',
    ip: '100.64.0.1',
    expected: 'blocked',
    cidr: '100.64.0.0/10 (RFC 6598)',
    risk: 'Internal Carrier Shared Address Exfiltration'
  },
  {
    label: 'Public DNS (Google)',
    ip: '8.8.8.8',
    expected: 'allowed',
    cidr: 'Public IPv4 (Routable)',
    risk: 'Standard Public Gateway (Safe for Passive Inspection)'
  },
  {
    label: 'Public CDN (Cloudflare)',
    ip: '104.21.45.1',
    expected: 'allowed',
    cidr: 'Public IPv4 (Routable)',
    risk: 'Standard Public Edge Network (Safe for Passive Inspection)'
  }
];

function evaluateIpSafety(input: string): {
  isBlocked: boolean;
  cidr: string;
  reason: string;
  mitigation: string;
} {
  const trimmed = input.trim();

  // Simple IP check
  const parts = trimmed.split('.').map(p => parseInt(p, 10));
  const isIpv4 = parts.length === 4 && parts.every(p => !isNaN(p) && p >= 0 && p <= 255);

  if (!isIpv4) {
    if (trimmed.toLowerCase() === 'localhost') {
      return {
        isBlocked: true,
        cidr: '127.0.0.1 (Resolves to Loopback)',
        reason: 'Localhost aliases resolve to internal 127.0.0.1 loopback',
        mitigation: 'Blocked by Pre-Flight DNS Resolution Guard'
      };
    }
    return {
      isBlocked: false,
      cidr: 'External Domain (Subject to DNS Resolution)',
      reason: 'Standard domain name will be resolved to A/AAAA records before request dispatch',
      mitigation: 'Pre-flight DNS resolution evaluates underlying IP against CIDR blocklist'
    };
  }

  const [a, b] = parts;

  if (a === 0) {
    return {
      isBlocked: true,
      cidr: '0.0.0.0/8 (Current Network)',
      reason: 'RFC 6890: Non-routable address targeting local daemon',
      mitigation: 'Pre-flight socket connection aborted'
    };
  }
  if (a === 10) {
    return {
      isBlocked: true,
      cidr: '10.0.0.0/8 (RFC 1918 Private)',
      reason: 'Private enterprise/VPC internal network range',
      mitigation: 'Blocks SSRF probes against internal Redis, Postgres, or Kubernetes APIs'
    };
  }
  if (a === 100 && b >= 64 && b <= 127) {
    return {
      isBlocked: true,
      cidr: '100.64.0.0/10 (RFC 6598 Shared Address)',
      reason: 'Carrier-Grade NAT reserved address space',
      mitigation: 'Blocks carrier infrastructure and transit probes'
    };
  }
  if (a === 127) {
    return {
      isBlocked: true,
      cidr: '127.0.0.0/8 (RFC 6890 Loopback)',
      reason: 'Localhost loopback interface targeting host daemons',
      mitigation: 'Zero-exploit guard prevents scanning internal host ports'
    };
  }
  if (a === 169 && b === 254) {
    return {
      isBlocked: true,
      cidr: '169.254.0.0/16 (RFC 3927 Link-Local / Cloud Metadata)',
      reason: 'AWS, GCP, Azure, and DigitalOcean Instance Metadata Service (IMDS)',
      mitigation: 'Neutralizes theft of IAM role credentials and cloud auth tokens'
    };
  }
  if (a === 172 && b >= 16 && b <= 31) {
    return {
      isBlocked: true,
      cidr: '172.16.0.0/12 (RFC 1918 Private)',
      reason: 'Private Docker, container, and VPC subnet',
      mitigation: 'Blocks lateral container hopping and Docker socket introspection'
    };
  }
  if (a === 192 && b === 168) {
    return {
      isBlocked: true,
      cidr: '192.168.0.0/16 (RFC 1918 Private)',
      reason: 'Private home/office intranet subnet',
      mitigation: 'Blocks intranet device compromise'
    };
  }
  if (a >= 224 && a <= 239) {
    return {
      isBlocked: true,
      cidr: '224.0.0.0/4 (RFC 5771 Multicast)',
      reason: 'Multicast address space',
      mitigation: 'Multicast broadcast traffic rejected'
    };
  }
  if (a >= 240) {
    return {
      isBlocked: true,
      cidr: '240.0.0.0/4 (Reserved / Future Use)',
      reason: 'RFC 1112 reserved address space',
      mitigation: 'Connection refused before network transmission'
    };
  }

  return {
    isBlocked: false,
    cidr: 'Public Internet (Globally Routable)',
    reason: 'Standard public IP eligible for passive HTTP security hygiene evaluation',
    mitigation: 'Permitted: Passive GET/HEAD inspection allowed with per-hop revalidation'
  };
}

export default function SsrfPlayground() {
  const [targetInput, setTargetInput] = useState('169.254.169.254');
  const evaluation = useMemo(() => evaluateIpSafety(targetInput), [targetInput]);

  return (
    <div className="rounded-3xl border border-white/10 bg-[#0B0D11]/90 backdrop-blur-2xl p-6 md:p-8 space-y-6 shadow-2xl relative overflow-hidden shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="inline-flex items-center space-x-2 text-[11px] font-mono text-neutral-400">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Interactive Engineering Sandbox</span>
          </div>
          <h3 className="text-lg md:text-xl font-bold text-white tracking-tight">
            Live SSRF Sandbox &amp; Network Boundary Playground
          </h3>
          <p className="text-xs text-neutral-400 max-w-xl">
            Test any IP or hostname against ShipSafe’s pre-flight RFC 6890 / RFC 1918 boundary evaluation engine in real time.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-[10px] font-mono px-2.5 py-1 rounded-md bg-white/[0.04] border border-white/10 text-neutral-300">
            Pre-Flight DNS Active
          </span>
          <span className="text-[10px] font-mono px-2.5 py-1 rounded-md bg-white/[0.04] border border-white/10 text-neutral-300">
            Hop Revalidation: ON
          </span>
        </div>
      </div>

      {/* Preset Chips */}
      <div className="space-y-2">
        <span className="text-[11px] font-mono text-neutral-500">Quick Test Targets:</span>
        <div className="flex flex-wrap gap-2">
          {PRESET_ADDRESSES.map((preset) => (
            <button
              key={preset.ip}
              type="button"
              onClick={() => setTargetInput(preset.ip)}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all border flex items-center space-x-1.5 ${
                targetInput === preset.ip
                  ? 'bg-white text-black border-white font-semibold'
                  : 'bg-white/[0.03] text-neutral-300 border-white/10 hover:bg-white/[0.06] hover:text-white'
              }`}
            >
              <span>{preset.label}</span>
              <span className={`text-[9px] px-1 py-0.2 rounded font-mono ${
                preset.expected === 'blocked'
                  ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              }`}>
                {preset.expected === 'blocked' ? 'DROP' : 'ALLOW'}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Target Input */}
      <div className="space-y-2">
        <label className="text-xs font-mono text-neutral-300 font-medium flex items-center justify-between">
          <span>Target IP or Hostname to Evaluate:</span>
          <span className="text-[11px] text-neutral-500 font-mono">IPv4 / IPv6 / FQDN</span>
        </label>
        <div className="relative">
          <input
            type="text"
            value={targetInput}
            onChange={(e) => setTargetInput(e.target.value)}
            placeholder="e.g. 127.0.0.1 or 169.254.169.254 or 8.8.8.8"
            className="w-full h-12 px-4 rounded-xl bg-[#050608] border border-white/10 focus:border-white focus:ring-1 focus:ring-white/20 text-sm text-white font-mono placeholder-neutral-600 transition-all outline-none"
          />
          <button
            type="button"
            onClick={() => setTargetInput('127.0.0.1')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white p-1"
            title="Reset to 127.0.0.1"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Live Engine Decision Display */}
      <div className={`rounded-2xl border p-5 transition-all space-y-4 ${
        evaluation.isBlocked
          ? 'bg-red-950/20 border-red-500/30 shadow-[0_0_30px_rgba(239,68,68,0.06)]'
          : 'bg-emerald-950/20 border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.06)]'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 border ${
              evaluation.isBlocked
                ? 'bg-red-500/10 text-red-400 border-red-500/30'
                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
            }`}>
              {evaluation.isBlocked ? (
                <ShieldAlert className="h-5 w-5" />
              ) : (
                <ShieldCheck className="h-5 w-5" />
              )}
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                  evaluation.isBlocked
                    ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                }`}>
                  {evaluation.isBlocked ? 'ACTION: DROP & ABORT' : 'ACTION: PERMITTED'}
                </span>
                <span className="text-xs font-mono text-neutral-400">
                  {evaluation.cidr}
                </span>
              </div>
              <h4 className="text-sm font-bold text-white mt-0.5">
                {evaluation.isBlocked
                  ? 'Access Denied: Target Violates Network Boundary Sandbox'
                  : 'Target Verified: Public Routable IP Address'}
              </h4>
            </div>
          </div>

          <div className="text-right text-[11px] font-mono text-neutral-400">
            <span className="text-neutral-500 block">HTTP Request Status</span>
            <span className={evaluation.isBlocked ? 'text-red-400 font-semibold' : 'text-emerald-400 font-semibold'}>
              {evaluation.isBlocked ? '0 bytes dispatched' : 'Eligible for passive fetch'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 text-xs font-mono border-t border-white/[0.06]">
          <div className="space-y-1">
            <span className="text-neutral-500 text-[10px] block uppercase">Classification Analysis:</span>
            <p className="text-neutral-300 leading-relaxed">{evaluation.reason}</p>
          </div>
          <div className="space-y-1">
            <span className="text-neutral-500 text-[10px] block uppercase">Defensive Mitigation:</span>
            <p className="text-neutral-300 leading-relaxed">{evaluation.mitigation}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
