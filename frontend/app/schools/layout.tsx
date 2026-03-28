import type { Metadata } from 'next';
export const metadata: Metadata = {
  title: 'IT-школы и курсы — Jarlyq',
  description: 'Школы программирования, буткемпы и университеты. Государственные программы и зарубежные ВУЗы.',
};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
