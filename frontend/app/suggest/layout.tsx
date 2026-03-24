import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Предложить компанию или школу',
  description: 'Знаешь IT-компанию или школу которой нет на Jarlyq? Предложи — мы добавим после проверки.',
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
