import type { Metadata } from 'next';
export const metadata: Metadata = {
  title: 'Вакансии в IT — Jarlyq',
  description: 'IT-вакансии в компаниях Центральной Азии и EMEA. Junior, Middle, Senior позиции.',
};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
