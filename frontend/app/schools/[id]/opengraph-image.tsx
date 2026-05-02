import { ImageResponse } from 'next/og';

export const alt = 'Школа на Jarlyq';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const API_URL = process.env.BACKEND_URL || 'http://localhost:8080';

const TYPE_LABELS: Record<string, string> = {
  bootcamp: 'Буткемп',
  university: 'Университет',
  state_program: 'Гос. программа',
  university_abroad: 'Зарубежный вуз',
  center: 'Образовательный центр',
  peer_learning: 'Peer-to-peer',
};

export default async function Image({ params }: { params: { id: string } }) {
  let name = 'Школа';
  let type = '';
  let logoURL = '';
  let description = '';
  let country = '';

  try {
    const res = await fetch(`${API_URL}/api/v1/schools/${params.id}`, { next: { revalidate: 3600 } });
    if (res.ok) {
      const { school } = await res.json();
      name = school.name ?? name;
      type = TYPE_LABELS[school.type] ?? school.type ?? '';
      logoURL = school.logoURL ?? '';
      description = school.description ?? '';
      country = school.country ?? '';
    }
  } catch { /* fallback */ }

  return new ImageResponse(
    (
      <div style={{
        background: 'linear-gradient(135deg, #064e3b 0%, #065f46 55%, #047857 100%)',
        width: '100%', height: '100%',
        display: 'flex', flexDirection: 'column',
        padding: '72px 80px',
        fontFamily: 'sans-serif',
        position: 'relative',
      }}>
        {/* Top row: logo + type + country */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 32 }}>
          {logoURL ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoURL} width={90} height={90} style={{ borderRadius: 18, objectFit: 'contain', background: 'white', padding: 6 }} alt={name} />
          ) : (
            <div style={{ width: 90, height: 90, background: 'rgba(255,255,255,0.2)', borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48, fontWeight: 800, color: 'white' }}>
              {name[0]}
            </div>
          )}
          {type && (
            <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 100, padding: '8px 24px', fontSize: 24, color: 'rgba(255,255,255,0.9)', display: 'flex' }}>
              {type}
            </div>
          )}
          {country && (
            <div style={{ fontSize: 24, color: 'rgba(255,255,255,0.65)', display: 'flex' }}>
              🌍 {country}
            </div>
          )}
        </div>

        {/* School name */}
        <div style={{
          fontSize: name.length > 25 ? 52 : name.length > 15 ? 64 : 76,
          fontWeight: 800, color: 'white',
          lineHeight: 1.1, letterSpacing: -2,
          marginBottom: 20, display: 'flex',
        }}>
          {name}
        </div>

        {/* Description */}
        {description && (
          <div style={{ fontSize: 26, color: 'rgba(255,255,255,0.65)', lineHeight: 1.4, display: 'flex', maxWidth: 900 }}>
            {description.length > 100 ? description.slice(0, 100) + '…' : description}
          </div>
        )}

        {/* Jarlyq badge */}
        <div style={{ position: 'absolute', bottom: 52, right: 80, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 12, padding: '8px 20px', fontSize: 26, color: 'white', fontWeight: 700, display: 'flex' }}>Jarlyq</div>
          <div style={{ fontSize: 22, color: 'rgba(255,255,255,0.45)', display: 'flex' }}>jarlyq.kz</div>
        </div>
      </div>
    ),
    { ...size },
  );
}
