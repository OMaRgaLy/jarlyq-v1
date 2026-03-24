import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Карьерные пути в IT',
  description: 'Пошаговые карьерные треки для Backend, Frontend, Mobile, DevOps и Data Science разработчиков. От Junior до Senior.',
  openGraph: {
    title: 'Карьерные пути в IT | Jarlyq',
    description: 'Пошаговые треки от Junior до Senior для всех IT-направлений.',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
