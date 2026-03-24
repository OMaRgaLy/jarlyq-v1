'use client';

import { useState } from 'react';
import { Header } from '../../components/header';
import { useJobs } from '../../lib/hooks';
import { useLang } from '../../lib/lang-context';

export default function JobsPage() {
  const { t } = useLang();
  const [level, setLevel] = useState('');
  const [location, setLocation] = useState('');

  const levelLabels: Record<string, string> = {
    intern: t.jobs.intern,
    junior: 'Junior',
    middle: 'Middle',
    senior: 'Senior',
    lead: 'Lead',
  };

  const { data: jobs = [], isLoading } = useJobs({
    level: level || undefined,
    location: location || undefined,
  });

  return (
    <div className="min-h-screen bg-slate-100/60 dark:bg-slate-950">
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            {t.jobs.title}
          </h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            {t.jobs.subtitle}
          </p>
        </div>

        <div className="mb-6 flex flex-wrap gap-3">
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          >
            <option value="">{t.jobs.allLevels}</option>
            <option value="intern">{t.jobs.intern}</option>
            <option value="junior">Junior</option>
            <option value="middle">Middle</option>
            <option value="senior">Senior</option>
          </select>

          <select
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          >
            <option value="">{t.jobs.allLocations}</option>
            <option value="Remote">{t.jobs.remote}</option>
            <option value="Almaty">{t.jobs.almaty}</option>
            <option value="Bishkek">{t.jobs.bishkek}</option>
            <option value="Tashkent">{t.jobs.tashkent}</option>
          </select>
        </div>

        {isLoading ? (
          <p className="text-sm text-slate-500">{t.jobs.loading}</p>
        ) : jobs.length === 0 ? (
          <p className="text-sm text-slate-500">{t.jobs.empty}</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {jobs.map((job) => (
              <div
                key={job.id}
                className="rounded-xl border border-slate-200/70 bg-white p-5 shadow-sm dark:border-slate-700/60 dark:bg-slate-900/70"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white">
                      {job.title}
                    </h3>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      {job.location} &middot; {job.workFormat} &middot; {job.jobType}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-brand/10 px-2.5 py-0.5 text-xs font-medium text-brand">
                    {levelLabels[job.level] || job.level}
                  </span>
                </div>

                <p className="mt-3 text-sm text-slate-600 line-clamp-2 dark:text-slate-400">
                  {job.description}
                </p>

                <div className="mt-4 flex items-center justify-between">
                  {(job.salaryMin > 0 || job.salaryMax > 0) ? (
                    <span className="text-sm font-medium text-slate-900 dark:text-white">
                      ${job.salaryMin.toLocaleString()}{job.salaryMax > 0 ? ` - $${job.salaryMax.toLocaleString()}` : '+'}
                    </span>
                  ) : (
                    <span className="text-sm text-slate-400">{t.jobs.noSalary}</span>
                  )}

                  <div className="flex gap-3 text-xs text-slate-500 dark:text-slate-400">
                    <span>{job.views} {t.jobs.views}</span>
                    {job.applications > 0 && <span>{job.applications} {t.jobs.applications}</span>}
                  </div>
                </div>

                {job.applicationURL && (
                  <a
                    href={job.applicationURL}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-4 inline-flex w-full items-center justify-center rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-dark"
                  >
                    {t.jobs.apply}
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
