import { ImageResponse } from 'next/og';

export const alt = 'Компания на Jarlyq';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const API_URL = process.env.BACKEND_URL || 'http://localhost:8080';

export default async function Image({ params }: { params: { id: string } }) {
  let name = 'Компания';
  let industry = '';
  let logoURL = '';
  let description = '';

  try {
    const res = await fetch(`${API_URL}/api/v1/companies/${params.id}`, { next: { revalidate: 3600 } });
    if (res.ok) {
      const { company } = await res.json();
      name = company.name ?? name;
      industry = company.industry ?? '';
      logoURL = company.logoURL ?? '';
      description = company.description ?? '';
    }
  } catch { /* fallback to defaults */ }

  return new ImageResponse(
    (
      <div style={{
        background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)',
        width: '100%', height: '100%',
        display: 'flex', flexDirection: 'column',
        padding: '72px 80px',
        fontFamily: 'sans-serif',
        position: 'relative',
      }}>
        {/* Top: logo + company info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 32, marginBottom: 32 }}>
          {logoURL ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoURL} width={100} height={100} style={{ borderRadius: 20, objectFit: 'cover', background: 'white' }} alt={name} />
          ) : (
            <div style={{ width: 100, height: 100, background: 'rgba(255,255,255,0.2)', borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 52, fontWeight: 800, color: 'white' }}>
              {name[0]}
            </div>
          )}
          {industry && (
            <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 100, padding: '8px 24px', fontSize: 24, color: 'rgba(255,255,255,0.85)', display: 'flex' }}>
              {industry}
            </div>
          )}
        </div>

        {/* Company name */}
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
          <div style={{
            fontSize: 26, color: 'rgba(255,255,255,0.65)',
            lineHeight: 1.4, display: 'flex',
            maxWidth: 900,
          }}>
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
