import type { Metadata } from 'next';

const backendUrl = process.env.BACKEND_URL || 'http://localhost:8080';
const siteUrl    = process.env.NEXT_PUBLIC_SITE_URL || 'https://jarlyq.kz';

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params;
  try {
    const res = await fetch(`${backendUrl}/api/v1/companies/${id}`, { next: { revalidate: 3600 } });
    if (!res.ok) return { title: 'Компания' };
    const data = await res.json();
    const company = data.company;
    const description = company.description || `Стажировки и вакансии в ${company.name} — Jarlyq`;
    const image = company.logoURL?.startsWith('http') ? company.logoURL
      : `${siteUrl}/og-default.png`;
    return {
      title: company.name,
      description,
      keywords: [company.name, 'стажировка', 'вакансия', 'IT', 'Казахстан', company.industry].filter(Boolean).join(', '),
      alternates: { canonical: `${siteUrl}/companies/${id}` },
      openGraph: {
        title: `${company.name} | Jarlyq`,
        description,
        url: `${siteUrl}/companies/${id}`,
        images: [{ url: image, width: 400, height: 400, alt: company.name }],
        type: 'website',
      },
      twitter: { card: 'summary', title: `${company.name} | Jarlyq`, description, images: [image] },
    };
  } catch {
    return { title: 'Компания' };
  }
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
