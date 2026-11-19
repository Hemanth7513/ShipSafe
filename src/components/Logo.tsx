import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
}

export default function Logo({ size = 'md', showText = true, className = '' }: LogoProps) {
  const dimensions = {
    sm: { box: 'h-7 w-7', icon: 28, text: 'text-base' },
    md: { box: 'h-9 w-9', icon: 36, text: 'text-lg' },
    lg: { box: 'h-12 w-12', icon: 48, text: 'text-2xl' },
    xl: { box: 'h-16 w-16', icon: 64, text: 'text-3xl' },
  }[size];

  return (
    <div className={`flex items-center space-x-3 group ${className}`}>
      {/* Geometric Cyber-Shield Icon */}
      <div className={`relative ${dimensions.box} rounded-xl bg-gradient-to-tr from-emerald-500/20 via-cyan-500/20 to-indigo-500/20 p-0.5 border border-white/10 shadow-lg shadow-cyan-500/10 group-hover:shadow-cyan-500/25 transition-all`}>
        <svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full transform group-hover:scale-105 transition-transform duration-300"
        >
          <defs>
            <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10B981" />
              <stop offset="50%" stopColor="#06B6D4" />
              <stop offset="100%" stopColor="#6366F1" />
            </linearGradient>
            <linearGradient id="coreGlow" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#10B981" stopOpacity="0.8" />
            </linearGradient>
          </defs>

          {/* Outer Shield Shell */}
          <path
            d="M24 4L8 10V22C8 32.5 14.8 41.8 24 44C33.2 41.8 40 32.5 40 22V10L24 4Z"
            stroke="url(#shieldGrad)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="#020617"
            fillOpacity="0.9"
          />

          {/* Inner Supersonic "Ship" Arrow */}
          <path
            d="M24 12L32 24L24 21L16 24L24 12Z"
            fill="url(#coreGlow)"
          />

          {/* Lower Defensive Armor Wing */}
          <path
            d="M24 25L30 33C28 36 26 37 24 38C22 37 20 36 18 33L24 25Z"
            fill="url(#shieldGrad)"
            fillOpacity="0.4"
            stroke="url(#shieldGrad)"
            strokeWidth="1.5"
          />

          {/* Center Glowing Core Dot */}
          <circle cx="24" cy="23" r="2.5" fill="#FFFFFF" />
        </svg>
      </div>

      {/* Brand Wordmark */}
      {showText && (
        <div className="flex items-baseline space-x-1.5 select-none">
          <span className={`font-black tracking-tight text-white ${dimensions.text}`}>
            Ship<span className="bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">Safe</span>
          </span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            SEC
          </span>
        </div>
      )}
    </div>
  );
}
