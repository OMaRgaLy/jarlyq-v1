'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Header } from '../../../components/header';
import { useCareerPath } from '../../../lib/hooks';
import { useLang } from '../../../lib/lang-context';

export default function CareerPathDetailPage() {
  const { t } = useLang();
  const params = useParams();
  const id = Number(params.id);
  const { data: path, isLoading } = useCareerPath(id);

  return (
    <div className="min-h-screen bg-slate-100/60 dark:bg-slate-950">
      <Header />
      <main className="mx-auto max-w-4xl px-4 py-8">
        <Link
          href="/career-paths"
          className="mb-6 inline-flex text-sm text-brand hover:text-brand-dark"
        >
          {t.careerPaths.backToAll}
        </Link>

        {isLoading ? (
          <p className="text-sm text-slate-500">{t.careerPaths.loading}</p>
        ) : !path ? (
          <p className="text-sm text-slate-500">{t.careerPaths.pathNotFound}</p>
        ) : (
          <>
            <div className="mb-8">
              <div className="text-5xl mb-3">{path.icon}</div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                {path.title}
              </h1>
              <p className="mt-2 text-slate-600 dark:text-slate-400">
                {path.description}
              </p>
              <div className="mt-3 flex gap-4 text-sm text-slate-500 dark:text-slate-400">
                <span>{path.duration} {t.careerPaths.months}</span>
                <span>{path.difficulty}</span>
                {path.completedBy > 0 && <span>{path.completedBy} {t.careerPaths.completed}</span>}
              </div>
            </div>

            {path.stages && path.stages.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                  {t.careerPaths.stages}
                </h2>
                <div className="relative">
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-200 dark:bg-slate-700" />
                  {path.stages
                    .sort((a, b) => a.order - b.order)
                    .map((stage) => (
                      <div key={stage.id} className="relative pl-10 pb-8">
                        <div className="absolute left-2.5 top-1 h-3 w-3 rounded-full border-2 border-brand bg-white dark:bg-slate-950" />
                        <div className="rounded-xl border border-slate-200/70 bg-white p-5 dark:border-slate-700/60 dark:bg-slate-900/70">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="rounded-full bg-brand/10 px-2 py-0.5 text-xs font-medium text-brand">
                              {t.careerPaths.stage} {stage.order}
                            </span>
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                              {stage.durationDays} {t.careerPaths.days}
                            </span>
                            {stage.badge && (
                              <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                                {stage.badge}
                              </span>
                            )}
                          </div>
                          <h3 className="font-semibold text-slate-900 dark:text-white">
                            {stage.title}
                          </h3>
                          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                            {stage.description}
                          </p>
                          {stage.milestone && (
                            <p className="mt-2 text-sm text-brand">
                              {t.careerPaths.goal} {stage.milestone}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
