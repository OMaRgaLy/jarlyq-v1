'use client';

import Link from 'next/link';
import { Header } from '../../../components/header';
import { FavoriteButton } from '../../../components/favorite-button';
import { useJob } from '../../../lib/hooks';
import { useLang } from '../../../lib/lang-context';

export default function JobDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const { data: job, isLoading } = useJob(Number(id));
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

  if (!job) {
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

  const salary = job.salaryMin || job.salaryMax
    ? `${job.salaryMin?.toLocaleString() ?? '?'} – ${job.salaryMax?.toLocaleString() ?? '?'} ${job.salaryCurrency ?? 'USD'}`
    : null;

  return (
    <div className="min-h-screen bg-slate-100/60 dark:bg-slate-950">
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-8 space-y-6">
        <Link href="/jobs" className="inline-flex text-sm text-brand hover:underline">
          &larr; {t.nav.jobs}
        </Link>

        <div className="card p-6 space-y-4">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{job.title}</h1>
            <FavoriteButton entityType="job" entityId={job.id} />
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            {job.level && (
              <span className="rounded-full bg-brand/10 px-3 py-1 text-xs font-medium text-brand">{job.level}</span>
            )}
            {job.jobType && (
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">{job.jobType}</span>
            )}
            {job.workFormat && (
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">{job.workFormat}</span>
            )}
            {job.location && (
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">{job.location}</span>
            )}
          </div>

          {/* Salary & Experience */}
          <div className="flex flex-wrap gap-6 text-sm">
            {salary && (
              <div>
                <span className="text-slate-400">Зарплата: </span>
                <span className="font-semibold text-slate-900 dark:text-white">{salary}</span>
              </div>
            )}
            {job.yearsExperience > 0 && (
              <div>
                <span className="text-slate-400">Опыт: </span>
                <span className="font-semibold text-slate-900 dark:text-white">{job.yearsExperience}+ лет</span>
              </div>
            )}
          </div>

          {/* Description */}
          {job.description && (
            <div className="prose prose-sm max-w-none text-slate-600 dark:text-slate-300 dark:prose-invert">
              <p className="whitespace-pre-line">{job.description}</p>
            </div>
          )}

          {/* Requirements */}
          {job.requirements && (
            <div>
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-brand">Требования</h2>
              <p className="whitespace-pre-line text-sm text-slate-600 dark:text-slate-300">{job.requirements}</p>
            </div>
          )}

          {/* Apply */}
          <div className="flex flex-wrap gap-3">
            {job.applicationURL && (
              <a href={job.applicationURL} target="_blank" rel="noreferrer"
                className="inline-flex rounded-xl bg-brand px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark">
                {t.internships.apply} &rarr;
              </a>
            )}
            {job.applicationEmail && (
              <a href={`mailto:${job.applicationEmail}`}
                className="inline-flex rounded-xl border border-brand px-6 py-2.5 text-sm font-semibold text-brand hover:bg-brand/5">
                {job.applicationEmail}
              </a>
            )}
          </div>

          {/* Company link */}
          {job.companyId > 0 && (
            <Link href={`/companies/${job.companyId}`} className="inline-block text-sm text-brand hover:underline">
              {t.internships.details} &rarr;
            </Link>
          )}
        </div>
      </main>
    </div>
  );
}
