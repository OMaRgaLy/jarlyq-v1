import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Jarlyq — IT career platform for Central Asia';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
          fontFamily: 'Inter, sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '20px',
          }}
        >
          <div
            style={{
              fontSize: 72,
              fontWeight: 800,
              color: '#6366f1',
              letterSpacing: '-2px',
            }}
          >
            Jarlyq
          </div>
          <div
            style={{
              fontSize: 28,
              color: '#94a3b8',
              textAlign: 'center',
              maxWidth: '700px',
              lineHeight: 1.4,
            }}
          >
            IT стажировки, вакансии и карьера в Центральной Азии
          </div>
          <div
            style={{
              display: 'flex',
              gap: '16px',
              marginTop: '20px',
            }}
          >
            {['150+ компаний', '300+ позиций', '50+ технологий'].map((s) => (
              <div
                key={s}
                style={{
                  background: 'rgba(99,102,241,0.15)',
                  border: '1px solid rgba(99,102,241,0.3)',
                  borderRadius: '12px',
                  padding: '8px 20px',
                  fontSize: 18,
                  color: '#a5b4fc',
                  fontWeight: 600,
                }}
              >
                {s}
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
