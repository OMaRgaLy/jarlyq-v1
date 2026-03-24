import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin', 'cyrillic'] });

export const metadata: Metadata = {
  title: {
    default: 'Jarlyq — IT возможности Центральной Азии',
    template: '%s | Jarlyq',
  },
  description:
    'Платформа для поиска курсов, стажировок, вакансий и компаний по IT-стекам в Казахстане, Кыргызстане и Узбекистане.',
  openGraph: {
    siteName: 'Jarlyq',
    type: 'website',
    locale: 'ru_RU',
    description: 'IT стажировки, вакансии, школы и карьерные пути в Казахстане, Кыргызстане и Узбекистане.',
  },
  twitter: { card: 'summary' },
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
