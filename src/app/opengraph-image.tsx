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
          backgroundColor: '#000000',
          backgroundImage: 'radial-gradient(circle at 50% 20%, rgba(255, 255, 255, 0.08) 0%, transparent 60%)',
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
            backgroundColor: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '9999px',
            padding: '8px 24px',
            fontSize: '16px',
            color: '#d4d4d8',
            marginBottom: '32px',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            fontWeight: 600,
          }}
        >
          Passive Security Hygiene Assessment
        </div>

        {/* Main Logo & Headline */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '20px',
          }}
        >
          <span
            style={{
              fontSize: '88px',
              fontWeight: 900,
              letterSpacing: '-0.04em',
              color: '#ffffff',
            }}
          >
            Ship
          </span>
          <span
            style={{
              fontSize: '88px',
              fontWeight: 900,
              letterSpacing: '-0.04em',
              color: '#a1a1aa',
              marginLeft: '4px',
            }}
          >
            Safe
          </span>
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: '24px',
            color: '#a1a1aa',
            textAlign: 'center',
            maxWidth: '920px',
            lineHeight: 1.5,
            marginBottom: '48px',
          }}
        >
          Zero-exploit passive security auditor for AI-generated and rapid-prototyped web applications.
          Catches leaked credentials, exposed source maps, and missing defense-in-depth headers.
        </div>

        {/* Feature Pills Footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          {['OWASP ASVS v4.0', 'BaaS Claims Decoding', 'Shannon Entropy Analysis', 'RFC 6890 SSRF Guard'].map((pill) => (
            <div
              key={pill}
              style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '9999px',
                padding: '8px 18px',
                fontSize: '14px',
                color: '#e4e4e7',
                fontFamily: 'monospace',
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
