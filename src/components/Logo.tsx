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
    <div className={`flex items-center space-x-3 group cursor-pointer ${className}`}>
      {/* Faceted Shield Tile with Subtle Indigo/Violet Glow */}
      <div className={`relative ${dimensions.box} rounded-xl bg-[#090A14] p-[1px] border border-indigo-500/40 shadow-[0_0_15px_rgba(99,102,241,0.25)] group-hover:border-indigo-400 transition-all`}>
        <svg
          viewBox="0 0 40 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full p-1.5 transform group-hover:scale-105 transition-transform duration-300"
        >
          <defs>
            <linearGradient id="shieldGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#A5B4FC" />
              <stop offset="100%" stopColor="#6366F1" />
            </linearGradient>
            <linearGradient id="shieldGrad2" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#312E81" />
              <stop offset="100%" stopColor="#818CF8" />
            </linearGradient>
          </defs>

          {/* Top North-West Facet */}
          <path
            d="M20 5L8 14L20 20L20 5Z"
            fill="url(#shieldGrad1)"
          />

          {/* Top North-East Facet */}
          <path
            d="M20 5L32 14L20 20L20 5Z"
            fill="#E0E7FF"
            fillOpacity="0.9"
          />

          {/* Lower South-West Armor Wing */}
          <path
            d="M8 14L20 35L20 20L8 14Z"
            fill="url(#shieldGrad2)"
          />

          {/* Lower South-East Armor Wing */}
          <path
            d="M32 14L20 35L20 20L32 14Z"
            fill="#818CF8"
            fillOpacity="0.85"
          />

          {/* Laser Line */}
          <line
            x1="20"
            y1="5"
            x2="20"
            y2="35"
            stroke="#090A14"
            strokeWidth="1.2"
          />
        </svg>
      </div>

      {/* Brand Wordmark */}
      {showText && (
        <div className="flex items-baseline space-x-1.5 select-none">
          <span className={`font-bold tracking-tight text-white ${dimensions.text}`}>
            Ship<span className="text-neutral-400 font-semibold">Safe</span>
          </span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-950/60 text-indigo-300 border border-indigo-500/40 uppercase tracking-wider shadow-[0_0_10px_rgba(99,102,241,0.2)]">
            AUDIT
          </span>
        </div>
      )}
    </div>
  );
}
