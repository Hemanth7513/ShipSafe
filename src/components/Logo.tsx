import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
}

export default function Logo({ size = 'md', showText = true, className = '' }: LogoProps) {
  const dimensions = {
    sm: { box: 'h-7 w-7', text: 'text-base' },
    md: { box: 'h-9 w-9', text: 'text-lg' },
    lg: { box: 'h-12 w-12', text: 'text-2xl' },
    xl: { box: 'h-16 w-16', text: 'text-3xl' },
  }[size];

  return (
    <div className={`flex items-center space-x-3 group ${className}`}>
      {/* Precision Metallic Shield Icon */}
      <div className={`relative ${dimensions.box} rounded-xl bg-gradient-to-b from-white/[0.12] to-white/[0.02] p-[1px] border border-white/20 shadow-md shadow-black/80 group-hover:border-white/40 transition-all`}>
        <div className="w-full h-full bg-[#050608] rounded-[11px] flex items-center justify-center overflow-hidden">
          <svg
            viewBox="0 0 48 48"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full transform group-hover:scale-105 transition-transform duration-300"
          >
            <defs>
              <linearGradient id="monoShieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="60%" stopColor="#A1A1AA" />
                <stop offset="100%" stopColor="#52525B" />
              </linearGradient>
              <linearGradient id="coreLight" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="100%" stopColor="#71717A" />
              </linearGradient>
            </defs>

            {/* Outer Shield Contour */}
            <path
              d="M24 5L9 11V23C9 33.2 15.5 42.2 24 44.5C32.5 42.2 39 33.2 39 23V11L24 5Z"
              stroke="url(#monoShieldGrad)"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="#0A0B0E"
            />

            {/* Supersonic Monolith Ship Core */}
            <path
              d="M24 13L31 25L24 22L17 25L24 13Z"
              fill="url(#coreLight)"
            />

            {/* Lower Armor Chevron */}
            <path
              d="M24 26L29 33.5C27 36.5 25.5 37.5 24 38.5C22.5 37.5 21 36.5 19 33.5L24 26Z"
              fill="white"
              fillOpacity="0.1"
              stroke="url(#monoShieldGrad)"
              strokeWidth="1.2"
            />

            {/* Radiant Core Dot */}
            <circle cx="24" cy="24" r="2" fill="#FFFFFF" />
          </svg>
        </div>
      </div>

      {/* Brand Wordmark */}
      {showText && (
        <div className="flex items-baseline space-x-1.5 select-none">
          <span className={`font-bold tracking-tight text-white ${dimensions.text}`}>
            Ship<span className="text-neutral-400 font-semibold">Safe</span>
          </span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-white/[0.06] text-neutral-400 border border-white/10 uppercase tracking-wider">
            AUDIT
          </span>
        </div>
      )}
    </div>
  );
}
