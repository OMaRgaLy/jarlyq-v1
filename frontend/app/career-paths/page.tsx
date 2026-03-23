'use client';

import Link from 'next/link';
import { Header } from '../../components/header';
import { useCareerPaths } from '../../lib/hooks';

const difficultyLabel: Record<string, string> = {
  beginner: 'Начальный',
  intermediate: 'Средний',
  advanced: 'Продвинутый',
};

const difficultyColor: Record<string, string> = {
  beginner: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  intermediate: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  advanced: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

export default function CareerPathsPage() {
  const { data: paths = [], isLoading } = useCareerPaths();

  return (
    <div className="min-h-screen bg-slate-100/60 dark:bg-slate-950">
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Карьерные пути
          </h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            Структурированные маршруты от новичка до junior-специалиста
          </p>
        </div>

        {isLoading ? (
          <p className="text-sm text-slate-500">Загружаем карьерные пути...</p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {paths.map((path) => (
              <Link
                key={path.id}
                href={`/career-paths/${path.id}`}
                className="group rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm transition hover:shadow-md dark:border-slate-700/60 dark:bg-slate-900/70"
              >
                <div className="mb-3 text-4xl">{path.icon}</div>
                <h2 className="text-lg font-semibold text-slate-900 group-hover:text-brand dark:text-white">
                  {path.title}
                </h2>
                <p className="mt-2 text-sm text-slate-600 line-clamp-2 dark:text-slate-400">
                  {path.description}
                </p>
                <div className="mt-4 flex items-center gap-3">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${difficultyColor[path.difficulty] || ''}`}>
                    {difficultyLabel[path.difficulty] || path.difficulty}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {path.duration} мес.
                  </span>
                  {path.completedBy > 0 && (
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {path.completedBy} завершили
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
