import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const alt = 'ShipSafe — Passive Security Hygiene Auditor for AI-Built Web Apps';
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#020617',
          backgroundImage: 'radial-gradient(circle at 50% 10%, rgba(6, 182, 212, 0.15) 0%, transparent 60%), radial-gradient(circle at 90% 90%, rgba(16, 185, 129, 0.12) 0%, transparent 50%)',
          fontFamily: 'sans-serif',
          color: '#ffffff',
          padding: '60px',
          position: 'relative',
        }}
      >
        {/* Top Tagline Badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '9999px',
            padding: '8px 20px',
            fontSize: '18px',
            color: '#34d399',
            marginBottom: '28px',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
          }}
        >
          ⚡ Passive Security Hygiene for AI-Built Apps
        </div>

        {/* Main Logo & Headline */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '16px',
          }}
        >
          <span
            style={{
              fontSize: '84px',
              fontWeight: 900,
              letterSpacing: '-0.03em',
            }}
          >
            Ship
          </span>
          <span
            style={{
              fontSize: '84px',
              fontWeight: 900,
              letterSpacing: '-0.03em',
              color: '#06b6d4',
              marginLeft: '4px',
            }}
          >
            Safe
          </span>
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: '28px',
            color: '#94a3b8',
            textAlign: 'center',
            maxWidth: '900px',
            lineHeight: 1.4,
            marginBottom: '40px',
          }}
        >
          The 10-Second Sanity Check for Startups & AI-Built Web Apps.
          Detects leaked admin keys, exposed source maps, and missing headers with copy-paste AI fix prompts.
        </div>

        {/* Feature Pills Footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
          }}
        >
          {['OWASP Top 10 Mapped', 'Supabase BaaS Disambiguation', 'Shannon Entropy (H >= 3.6)', 'A–F Grading Engine'].map((pill) => (
            <div
              key={pill}
              style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '12px',
                padding: '10px 18px',
                fontSize: '16px',
                color: '#e2e8f0',
              }}
            >
              {pill}
            </div>
          ))}
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
