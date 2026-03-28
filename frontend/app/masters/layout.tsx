import type { Metadata } from 'next';
export const metadata: Metadata = {
  title: 'Магистратура за рубежом — Jarlyq',
  description: 'Магистерские программы в IT в университетах мира. Стипендии, сроки, стоимость.',
};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
