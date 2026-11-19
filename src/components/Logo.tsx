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
      {/* Direction 3 Custom Geometric Vault-Shield Tile */}
      <div className={`relative ${dimensions.box} rounded-xl bg-[#090A0E] p-[1px] border border-white/20 shadow-md shadow-black/90 group-hover:border-white/40 transition-all`}>
        <svg
          viewBox="0 0 40 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full p-1.5 transform group-hover:scale-105 transition-transform duration-300"
        >
          <defs>
            <linearGradient id="facetWhiteGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="100%" stopColor="#71717A" />
            </linearGradient>
            <linearGradient id="facetDarkGrad" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3F3F46" />
              <stop offset="100%" stopColor="#A1A1AA" />
            </linearGradient>
          </defs>

          {/* Faceted Geometric Vault-Shield (100% Original Vector) */}
          {/* Top North-West Facet */}
          <path
            d="M20 5L8 14L20 20L20 5Z"
            fill="url(#facetWhiteGrad)"
          />

          {/* Top North-East Facet */}
          <path
            d="M20 5L32 14L20 20L20 5Z"
            fill="#FFFFFF"
            fillOpacity="0.85"
          />

          {/* Lower South-West Armor Wing */}
          <path
            d="M8 14L20 35L20 20L8 14Z"
            fill="url(#facetDarkGrad)"
          />

          {/* Lower South-East Armor Wing */}
          <path
            d="M32 14L20 35L20 20L32 14Z"
            fill="#A1A1AA"
            fillOpacity="0.9"
          />

          {/* Precision Center Dividing Laser Line */}
          <line
            x1="20"
            y1="5"
            x2="20"
            y2="35"
            stroke="#090A0E"
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
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-white/[0.06] text-neutral-400 border border-white/10 uppercase tracking-wider">
            AUDIT
          </span>
        </div>
      )}
    </div>
  );
}
