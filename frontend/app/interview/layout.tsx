import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Вопросы с собеседований в IT',
  description: 'Реальные вопросы с IT-собеседований с ответами и объяснениями. Backend, Frontend, DevOps, Data Science, Product Management.',
  openGraph: {
    title: 'Вопросы с собеседований в IT | Jarlyq',
    description: 'Подготовься к интервью с реальными вопросами от компаний.',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
