import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin', 'cyrillic'] });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://jarlyq.kz';

export const metadata: Metadata = {
  title: {
    default: 'Jarlyq — IT возможности Центральной Азии',
    template: '%s | Jarlyq',
  },
  description:
    'Бесплатная платформа для поиска стажировок, вакансий, курсов и IT-компаний в Казахстане, Кыргызстане, Узбекистане и EMEA.',
  keywords: 'стажировка IT Казахстан, вакансии разработчик, курсы программирования, IT компании Алматы, junior вакансии',
  metadataBase: new URL(siteUrl),
  alternates: { canonical: siteUrl },
  openGraph: {
    siteName: 'Jarlyq',
    type: 'website',
    locale: 'ru_RU',
    url: siteUrl,
    description: 'IT стажировки, вакансии, школы и карьерные пути в Казахстане, Кыргызстане и Узбекистане.',
    images: [{ url: '/og-default.png', width: 1200, height: 630, alt: 'Jarlyq — IT возможности Центральной Азии' }],
  },
  twitter: { card: 'summary_large_image', images: ['/og-default.png'] },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
