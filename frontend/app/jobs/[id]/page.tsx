'use client';

import Link from 'next/link';
import { Header } from '../../../components/header';
import { FavoriteButton } from '../../../components/favorite-button';
import { useJob } from '../../../lib/hooks';
import { useLang } from '../../../lib/lang-context';

export default function JobDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const { data: item, isLoading } = useJob(Number(id));
  const { t } = useLang();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-100/60 dark:bg-slate-950">
        <Header />
        <main className="mx-auto max-w-3xl px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-6 w-48 rounded-lg bg-slate-200 dark:bg-slate-800" />
            <div className="h-64 rounded-2xl bg-slate-200 dark:bg-slate-800" />
          </div>
        </main>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-slate-100/60 dark:bg-slate-950">
        <Header />
        <main className="mx-auto max-w-3xl px-4 py-8">
          <p className="text-slate-500">{t.common.notFound}</p>
          <Link href="/jobs" className="mt-4 inline-block text-sm text-brand hover:underline">
            &larr; {t.nav.jobs}
          </Link>
        </main>
      </div>
    );
  }

  const salary = item.salaryMin || item.salaryMax
    ? `${item.salaryMin?.toLocaleString() ?? '?'} – ${item.salaryMax?.toLocaleString() ?? '?'} ${item.salaryCurrency ?? 'KZT'}`
    : null;

  return (
    <div className="min-h-screen bg-slate-100/60 dark:bg-slate-950">
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-8 space-y-6">
        <Link href="/jobs" className="inline-flex text-sm text-brand hover:underline">
          &larr; {t.nav.jobs}
        </Link>

        <div className="card p-6 space-y-4">
          {/* Company */}
          <div className="flex items-center gap-3">
            {item.companyLogoURL?.startsWith('http') ? (
              <img src={item.companyLogoURL} alt={item.companyName} className="h-12 w-12 rounded-lg object-cover" />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-brand/10 text-brand font-bold text-lg">
                {item.companyName?.[0]}
              </div>
            )}
            <Link href={`/companies/${item.companyId}`} className="text-sm text-brand hover:underline">
              {item.companyName}
            </Link>
          </div>

          {/* Title */}
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{item.title}</h1>
            <FavoriteButton entityType="opportunity" entityId={item.id} />
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            {item.level && <span className="rounded-full bg-brand/10 px-3 py-1 text-xs font-medium text-brand">{item.level}</span>}
            {item.workFormat && <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">{item.workFormat}</span>}
            {item.city && <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">{item.city}</span>}
          </div>

          {/* Salary & Deadline */}
          <div className="flex flex-wrap gap-6 text-sm">
            {salary && (
              <div>
                <span className="text-slate-400">Зарплата: </span>
                <span className="font-semibold text-slate-900 dark:text-white">{salary}</span>
              </div>
            )}
            {item.deadline && (
              <div>
                <span className="text-slate-400">{t.internships.deadline}: </span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {new Date(item.deadline).toLocaleDateString('ru')}
                </span>
              </div>
            )}
          </div>

          {/* Description */}
          {item.description && (
            <div className="prose prose-sm max-w-none text-slate-600 dark:text-slate-300 dark:prose-invert">
              <p className="whitespace-pre-line">{item.description}</p>
            </div>
          )}

          {/* Apply */}
          {item.applyURL && (
            <a href={item.applyURL} target="_blank" rel="noreferrer"
              className="inline-flex rounded-xl bg-brand px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark">
              {t.internships.apply} &rarr;
            </a>
          )}
        </div>
      </main>
    </div>
  );
}
