import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Начни свой путь в IT — Jarlyq',
  description: 'IT-школы, университеты, подготовительные курсы и карьерные пути для тех, кто входит в профессию.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
