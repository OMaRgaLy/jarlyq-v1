import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Найди работу или стажировку в IT — Jarlyq',
  description: 'Стажировки, вакансии, карьерные треки и компании для IT-специалистов в Казахстане и Центральной Азии.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
