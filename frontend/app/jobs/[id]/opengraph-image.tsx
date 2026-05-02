import { ImageResponse } from 'next/og';

export const alt = 'Вакансия на Jarlyq';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const API_URL = process.env.BACKEND_URL || 'http://localhost:8080';

export default async function Image({ params }: { params: { id: string } }) {
  let title = 'Вакансия';
  let companyName = '';
  let companyLogoURL = '';
  let level = '';
  let workFormat = '';

  try {
    const res = await fetch(`${API_URL}/api/v1/internships/${params.id}`, { next: { revalidate: 3600 } });
    if (res.ok) {
      const json = await res.json();
      const item = json.internship ?? json.opportunity;
      title = item.title ?? title;
      companyName = item.companyName ?? '';
      companyLogoURL = item.companyLogoURL ?? '';
      level = item.level ?? '';
      workFormat = item.workFormat ?? '';
    }
  } catch { /* fallback */ }

  const badges = [level, workFormat, 'Вакансия'].filter(Boolean);

  return new ImageResponse(
    (
      <div style={{
        background: 'linear-gradient(135deg, #1e3a5f 0%, #1e4976 55%, #1d5fa0 100%)',
        width: '100%', height: '100%',
        display: 'flex', flexDirection: 'column',
        padding: '72px 80px',
        fontFamily: 'sans-serif',
        position: 'relative',
      }}>
        {/* Company row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 36 }}>
          {companyLogoURL ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={companyLogoURL} width={72} height={72} style={{ borderRadius: 14, objectFit: 'cover', background: 'white' }} alt={companyName} />
          ) : companyName ? (
            <div style={{ width: 72, height: 72, background: 'rgba(255,255,255,0.2)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, fontWeight: 800, color: 'white' }}>
              {companyName[0]}
            </div>
          ) : null}
          {companyName && (
            <div style={{ fontSize: 28, color: 'rgba(255,255,255,0.80)', fontWeight: 600, display: 'flex' }}>
              {companyName}
            </div>
          )}
        </div>

        {/* Title */}
        <div style={{
          fontSize: title.length > 40 ? 46 : title.length > 25 ? 56 : 68,
          fontWeight: 800, color: 'white',
          lineHeight: 1.15, letterSpacing: -1.5,
          marginBottom: 32, display: 'flex',
          maxWidth: 1000,
        }}>
          {title}
        </div>

        {/* Badges */}
        <div style={{ display: 'flex', gap: 12 }}>
          {badges.map((b) => (
            <div key={b} style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 100, padding: '8px 22px', fontSize: 22, color: 'rgba(255,255,255,0.88)', display: 'flex' }}>
              {b}
            </div>
          ))}
        </div>

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
