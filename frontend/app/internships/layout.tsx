import type { Metadata } from 'next';
export const metadata: Metadata = {
  title: 'Стажировки в IT — Jarlyq',
  description: 'Актуальные IT-стажировки в Казахстане, Кыргызстане, Узбекистане и EMEA. Фильтр по городу, формату и стеку.',
};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
