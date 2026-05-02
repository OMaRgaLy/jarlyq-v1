import type { Metadata } from 'next';

const API_URL = process.env.BACKEND_URL || 'http://localhost:8080';
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://jarlyq.kz';

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  try {
    const res = await fetch(`${API_URL}/api/v1/internships/${params.id}`, { next: { revalidate: 3600 } });
    if (!res.ok) throw new Error('not found');
    const json = await res.json();
    const item = json.internship ?? json.opportunity;

    const title = `${item.title} — ${item.companyName}`;
    const description = item.description
      ? item.description.slice(0, 155).replace(/\n/g, ' ')
      : `Вакансия ${item.level ?? ''} в ${item.companyName} на Jarlyq.`;
    const url = `${BASE_URL}/jobs/${params.id}`;

    return {
      title,
      description,
      alternates: { canonical: url },
      openGraph: {
        title,
        description,
        url,
        images: item.companyLogoURL
          ? [{ url: item.companyLogoURL, width: 400, height: 400, alt: item.companyName }]
          : [{ url: '/og-default.png', width: 1200, height: 630, alt: 'Jarlyq' }],
      },
    };
  } catch {
    return {
      title: 'Вакансия | Jarlyq',
      description: 'IT-вакансии в компаниях Центральной Азии и EMEA на Jarlyq.',
    };
  }
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
