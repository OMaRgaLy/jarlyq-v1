import type { Metadata } from 'next';

const API_URL = process.env.BACKEND_URL || 'http://localhost:8080';
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://jarlyq.kz';

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  try {
    const res = await fetch(`${API_URL}/api/v1/internships/${params.id}`, { next: { revalidate: 3600 } });
    if (!res.ok) throw new Error('not found');
    const { internship } = await res.json();

    const title = `${internship.title} — ${internship.companyName}`;
    const description = internship.description
      ? internship.description.slice(0, 155).replace(/\n/g, ' ')
      : `Стажировка ${internship.level ?? ''} в ${internship.companyName} на Jarlyq.`;
    const url = `${BASE_URL}/internships/${params.id}`;

    return {
      title,
      description,
      alternates: { canonical: url },
      openGraph: {
        title,
        description,
        url,
        images: internship.companyLogoURL
          ? [{ url: internship.companyLogoURL, width: 400, height: 400, alt: internship.companyName }]
          : [{ url: '/og-default.png', width: 1200, height: 630, alt: 'Jarlyq' }],
      },
    };
  } catch {
    return {
      title: 'Стажировка | Jarlyq',
      description: 'IT-стажировки в Казахстане, Кыргызстане, Узбекистане и EMEA на Jarlyq.',
    };
  }
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
