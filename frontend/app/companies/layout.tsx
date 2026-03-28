import type { Metadata } from 'next';
export const metadata: Metadata = {
  title: 'IT-компании — Jarlyq',
  description: 'Каталог IT-компаний Казахстана и региона. Найди компанию по стеку технологий.',
};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
