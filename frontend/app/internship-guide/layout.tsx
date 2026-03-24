import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Как попасть на стажировку в IT',
  description: 'Полный гайд для разработчиков, QA, продактов, аналитиков и DS: как найти стажировку в IT в Казахстане, Кыргызстане и Узбекистане. Советы по специальностям, пет-проекты, лайфхаки, нетворкинг.',
  openGraph: {
    title: 'Как попасть на стажировку в IT | Jarlyq',
    description: 'Полный гайд от нуля до первого оффера для всех IT-специальностей.',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
