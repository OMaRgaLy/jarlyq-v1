import type { Metadata } from 'next';
export const metadata: Metadata = {
  title: 'IT-хакатоны — Jarlyq',
  description: 'Актуальные хакатоны в Казахстане и СНГ. Дедлайны, призовые, стеки.',
};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
