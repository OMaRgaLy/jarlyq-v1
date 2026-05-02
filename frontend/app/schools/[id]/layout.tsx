import type { Metadata } from 'next';

const backendUrl = process.env.BACKEND_URL || 'http://localhost:8080';
const siteUrl    = process.env.NEXT_PUBLIC_SITE_URL || 'https://jarlyq.kz';

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params;
  try {
    const res = await fetch(`${backendUrl}/api/v1/schools/${id}`, { next: { revalidate: 3600 } });
    if (!res.ok) return { title: 'Школа' };
    const data = await res.json();
    const school = data.school;
    const description = school.description || `Курсы и обучение в ${school.name} — Jarlyq`;
    const image = school.logoURL?.startsWith('http') ? school.logoURL
      : `${siteUrl}/og-default.png`;
    return {
      title: school.name,
      description,
      keywords: [school.name, 'курсы программирования', 'IT обучение', 'Казахстан', school.country].filter(Boolean).join(', '),
      alternates: { canonical: `${siteUrl}/schools/${id}` },
      openGraph: {
        title: `${school.name} | Jarlyq`,
        description,
        url: `${siteUrl}/schools/${id}`,
        images: [{ url: image, width: 400, height: 400, alt: school.name }],
        type: 'website',
      },
      twitter: { card: 'summary', title: `${school.name} | Jarlyq`, description, images: [image] },
    };
  } catch {
    return { title: 'Школа' };
  }
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
