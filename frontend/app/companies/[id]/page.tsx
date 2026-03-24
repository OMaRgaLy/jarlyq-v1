'use client';

import { use } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Header } from '../../../components/header';
import { useCompany } from '../../../lib/hooks';
import { useLang } from '../../../lib/lang-context';

const levelColors: Record<string, string> = {
  intern: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  junior: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  middle: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  senior: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
};

export default function CompanyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: company, isLoading } = useCompany(Number(id));
  const { t } = useLang();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-100/60 dark:bg-slate-950">
        <Header />
        <main className="mx-auto max-w-4xl px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-48 rounded-xl bg-slate-200 dark:bg-slate-800" />
            <div className="h-40 rounded-2xl bg-slate-200 dark:bg-slate-800" />
            <div className="h-60 rounded-2xl bg-slate-200 dark:bg-slate-800" />
          </div>
        </main>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen bg-slate-100/60 dark:bg-slate-950">
        <Header />
        <main className="mx-auto max-w-4xl px-4 py-8">
          <p className="text-slate-500">{t.common.notFound}</p>
          <Link href="/#companies" className="mt-4 inline-block text-sm text-brand hover:underline">
            {t.company.backToList}
          </Link>
        </main>
      </div>
    );
  }

  const internships = (company.opportunities ?? []).filter((o) => o.type === 'internship');
  const vacancies = (company.opportunities ?? []).filter((o) => o.type === 'vacancy');

  return (
    <div className="min-h-screen bg-slate-100/60 dark:bg-slate-950">
      <Header />
      <main className="mx-auto max-w-4xl px-4 py-8 space-y-6">
        <Link href="/#companies" className="inline-flex text-sm text-brand hover:underline">
          {t.company.backToList}
        </Link>

        {/* Header card */}
        <div className="card p-6">
          {company.coverURL && (
            <div className="relative mb-4 h-32 w-full overflow-hidden rounded-xl">
              <Image
                src={company.coverURL}
                alt={company.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 896px"
              />
            </div>
          )}
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{company.name}</h1>
          {company.description && (
            <p className="mt-2 text-slate-600 dark:text-slate-300">{company.description}</p>
          )}

          {company.contacts && (
            <div className="mt-4 flex flex-wrap gap-3">
              {company.contacts.website && (
                <a
                  href={company.contacts.website}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-brand hover:bg-brand/5 dark:border-slate-700"
                >
                  🌐 {t.company.website}
                </a>
              )}
              {company.contacts.telegram && (
                <a
                  href={`https://t.me/${company.contacts.telegram.replace('@', '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-[#229ED9] hover:bg-[#229ED9]/5 dark:border-slate-700"
                >
                  ✈️ {t.company.telegram}
                </a>
              )}
              {company.contacts.email && (
                <a
                  href={`mailto:${company.contacts.email}`}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
                >
                  📧 {t.company.email}
                </a>
              )}
            </div>
          )}
        </div>

        {/* Internships */}
        {internships.length > 0 && (
          <section className="card p-6 space-y-4">
            <h2 className="text-lg font-semibold text-brand uppercase tracking-wide">
              {t.company.internships}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {internships.map((opp) => (
                <div
                  key={opp.id}
                  className="rounded-xl border border-slate-200/70 bg-slate-50 p-4 dark:border-slate-700/60 dark:bg-slate-800/50"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-slate-900 dark:text-white">{opp.title}</p>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${levelColors[opp.level] ?? 'bg-slate-100 text-slate-600'}`}>
                      {opp.level}
                    </span>
                  </div>
                  {opp.description && (
                    <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-300">{opp.description}</p>
                  )}
                  {opp.applyURL && (
                    <a
                      href={opp.applyURL}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-flex rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-dark"
                    >
                      {t.company.apply}
                    </a>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Vacancies */}
        {vacancies.length > 0 && (
          <section className="card p-6 space-y-4">
            <h2 className="text-lg font-semibold text-brand uppercase tracking-wide">
              {t.company.vacancies}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {vacancies.map((opp) => (
                <div
                  key={opp.id}
                  className="rounded-xl border border-slate-200/70 bg-slate-50 p-4 dark:border-slate-700/60 dark:bg-slate-800/50"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-slate-900 dark:text-white">{opp.title}</p>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${levelColors[opp.level] ?? 'bg-slate-100 text-slate-600'}`}>
                      {opp.level}
                    </span>
                  </div>
                  {opp.description && (
                    <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-300">{opp.description}</p>
                  )}
                  {opp.applyURL && (
                    <a
                      href={opp.applyURL}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-flex rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-dark"
                    >
                      {t.company.respond}
                    </a>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {internships.length === 0 && vacancies.length === 0 && (
          <div className="card p-6 text-center text-slate-500">
            {t.company.noOpportunities}
          </div>
        )}
      </main>
    </div>
  );
}
