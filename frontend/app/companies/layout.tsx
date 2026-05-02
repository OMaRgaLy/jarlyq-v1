import type { Metadata } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://jarlyq.kz';

export const metadata: Metadata = {
  title: 'IT-компании Казахстана и EMEA — Jarlyq',
  description: 'Каталог IT-компаний Казахстана, Кыргызстана, Узбекистана и Турции. Найди компанию по стеку технологий — Go, Python, React, Java и другим.',
  keywords: 'IT компании Казахстан, tech компании Алматы, работодатели IT, компании Go Python React, стажировки Казахстан',
  alternates: { canonical: `${siteUrl}/companies` },
  openGraph: {
    title: 'IT-компании — Jarlyq',
    description: 'Найди IT-компанию по своему стеку технологий.',
    url: `${siteUrl}/companies`,
  },
};

export default function Layout({ children }: { children: React.ReactNode }) { return children; }
