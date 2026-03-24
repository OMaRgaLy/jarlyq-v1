'use client';

import Link from 'next/link';
import { Header } from '../../components/header';
import { CareerPathCardSkeleton } from '../../components/skeleton';
import { useCareerPaths } from '../../lib/hooks';
import { useLang } from '../../lib/lang-context';

const difficultyColor: Record<string, string> = {
  beginner: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  intermediate: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  advanced: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

export default function CareerPathsPage() {
  const { t } = useLang();
  const { data: paths = [], isLoading } = useCareerPaths();

  const difficultyLabel: Record<string, string> = {
    beginner: t.careerPaths.beginner,
    intermediate: t.careerPaths.intermediate,
    advanced: t.careerPaths.advanced,
  };

  return (
    <div className="min-h-screen bg-slate-100/60 dark:bg-slate-950">
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            {t.careerPaths.title}
          </h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            {t.careerPaths.subtitle}
          </p>
        </div>

        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <CareerPathCardSkeleton key={i} />
            ))}
          </div>
        ) : paths.length === 0 ? (
          <div className="card flex flex-col items-center gap-3 py-16 text-center">
            <span className="text-5xl">🗺️</span>
            <p className="font-semibold text-slate-700 dark:text-slate-200">
              {t.careerPaths.emptyTitle}
            </p>
            <p className="text-sm text-slate-500">{t.careerPaths.emptyHint}</p>
          </div>
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
                <p className="mt-2 line-clamp-2 text-sm text-slate-600 dark:text-slate-400">
                  {path.description}
                </p>
                <div className="mt-4 flex items-center gap-3">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${difficultyColor[path.difficulty] || ''}`}>
                    {difficultyLabel[path.difficulty] || path.difficulty}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {path.duration} {t.careerPaths.months}
                  </span>
                  {path.completedBy > 0 && (
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {path.completedBy} {t.careerPaths.completed}
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
