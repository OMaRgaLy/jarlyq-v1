import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Jarlyq — IT возможности Центральной Азии';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 55%, #2563eb 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'sans-serif',
          position: 'relative',
        }}
      >
        {/* Decorative circles */}
        <div style={{ position: 'absolute', top: -80, right: -80, width: 400, height: 400, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex' }} />
        <div style={{ position: 'absolute', bottom: -60, left: -60, width: 300, height: 300, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', display: 'flex' }} />

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 28 }}>
          <div style={{ width: 88, height: 88, background: 'rgba(255,255,255,0.18)', borderRadius: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 52, fontWeight: 900, color: 'white' }}>J</div>
          <span style={{ fontSize: 80, fontWeight: 800, color: 'white', letterSpacing: -3 }}>Jarlyq</span>
        </div>

        {/* Tagline */}
        <div style={{ fontSize: 34, color: 'rgba(255,255,255,0.80)', fontWeight: 400, marginBottom: 48, textAlign: 'center', display: 'flex' }}>
          IT возможности Центральной Азии
        </div>

        {/* Country pills */}
        <div style={{ display: 'flex', gap: 14 }}>
          {['🇰🇿 Казахстан', '🇰🇬 Кыргызстан', '🇺🇿 Узбекистан', '🌐 EMEA'].map((tag) => (
            <div key={tag} style={{ background: 'rgba(255,255,255,0.13)', borderRadius: 100, padding: '10px 22px', fontSize: 22, color: 'rgba(255,255,255,0.88)', display: 'flex' }}>
              {tag}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ position: 'absolute', bottom: 36, fontSize: 20, color: 'rgba(255,255,255,0.40)', display: 'flex' }}>
          jarlyq.kz — бесплатная платформа
        </div>
      </div>
    ),
    { ...size },
  );
}
