import type { Metadata } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://jarlyq.kz';

export const metadata: Metadata = {
  title: 'Стажировки в IT — Jarlyq',
  description: 'Актуальные IT-стажировки в Казахстане, Кыргызстане, Узбекистане и EMEA. Фильтр по городу, формату и стеку.',
  keywords: 'стажировка IT Казахстан, intern Алматы, стажировка разработчик, junior стажировка, trainee',
  alternates: { canonical: `${siteUrl}/internships` },
  openGraph: {
    title: 'Стажировки в IT — Jarlyq',
    description: 'Найди стажировку по своему стеку в компаниях Казахстана и региона.',
    url: `${siteUrl}/internships`,
  },
};

export default function Layout({ children }: { children: React.ReactNode }) { return children; }
