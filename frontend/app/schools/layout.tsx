import type { Metadata } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://jarlyq.kz';

export const metadata: Metadata = {
  title: 'IT-школы и курсы — Jarlyq',
  description: 'Буткемпы, онлайн-курсы и университеты по IT в Казахстане, Кыргызстане, Узбекистане. Сравни цены, форматы и программы.',
  keywords: 'IT курсы Казахстан, буткемп Алматы, программирование обучение, онлайн курсы IT, школы программирования',
  alternates: { canonical: `${siteUrl}/schools` },
  openGraph: {
    title: 'IT-школы и курсы — Jarlyq',
    description: 'Найди курс или буткемп по IT в Казахстане и регионе.',
    url: `${siteUrl}/schools`,
  },
};

export default function Layout({ children }: { children: React.ReactNode }) { return children; }
