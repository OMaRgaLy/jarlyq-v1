'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Header } from '../../components/header';
import { useSchools } from '../../lib/hooks';
import { useLang } from '../../lib/lang-context';
import { School } from '../../lib/api';

type Tab = 'all' | 'state_program' | 'bootcamp' | 'university';

function SchoolCard({ school }: { school: School }) {
  const { t } = useLang();

  const courses = school.courses ?? [];
  const prices = courses.map((c) => c.price).filter((p): p is number => !!p && p > 0);
  const minPrice = prices.length > 0 ? Math.min(...prices) : undefined;
  const currency = courses.find((c) => c.priceCurrency)?.priceCurrency || '₸';
  const hasEmployment = courses.some((c) => c.hasEmployment);

  const typeBadge =
    school.isStateFunded
      ? { label: t.school.badgeStateFunded, cls: 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400' }
      : school.type === 'university'
      ? { label: t.school.badgeUniversity, cls: 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' }
      : { label: t.school.badgeBootcamp, cls: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' };

  return (
    <article className="flex flex-col rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800/60 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="mb-1.5 flex flex-wrap gap-1.5">
            <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${typeBadge.cls}`}>
              {typeBadge.label}
            </span>
            {hasEmployment && (
              <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
                ✓ {t.school.hasEmployment}
              </span>
            )}
          </div>
          <h3 className="truncate text-base font-semibold text-slate-900 dark:text-slate-50">{school.name}</h3>
          {school.description && (
            <p className="mt-1 line-clamp-2 text-sm text-slate-500 dark:text-slate-400">{school.description}</p>
          )}
        </div>
      </div>

      <div className="mt-auto border-t border-slate-100 pt-3 dark:border-slate-800 mt-4">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {courses.length} {t.school.courses.toLowerCase()}
          </span>
          <div className="flex items-center gap-2">
            {minPrice !== undefined ? (
              <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                {t.school.priceFrom} {minPrice.toLocaleString()} {currency}
              </span>
            ) : (
              <span className="text-xs font-medium text-green-600 dark:text-green-400">{t.school.free}</span>
            )}
            <Link
              href={`/schools/${school.id}`}
              className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 hover:border-brand hover:text-brand dark:border-slate-700 dark:text-slate-300"
            >
              {t.school.details}
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}

export default function SchoolsPage() {
  const { t } = useLang();
  const [tab, setTab] = useState<Tab>('all');
  const { data: schools = [], isLoading } = useSchools({});

  const tabs: { key: Tab; label: string }[] = [
    { key: 'all', label: t.school.tabAll },
    { key: 'state_program', label: t.school.tabStatePrograms },
    { key: 'bootcamp', label: t.school.tabBootcamps },
    { key: 'university', label: t.school.tabUniversities },
  ];

  const filtered =
    tab === 'all' ? schools : schools.filter((s) => s.type === tab);

  const counts: Record<Tab, number> = {
    all: schools.length,
    state_program: schools.filter((s) => s.type === 'state_program').length,
    bootcamp: schools.filter((s) => s.type === 'bootcamp').length,
    university: schools.filter((s) => s.type === 'university').length,
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Header />

      {/* Page header */}
      <div className="border-b border-slate-200/70 bg-white dark:border-slate-800/60 dark:bg-slate-900">
        <div className="mx-auto max-w-5xl px-4 py-8">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50 sm:text-3xl">{t.school.pageTitle}</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t.school.pageSubtitle}</p>

          {/* Tabs */}
          <div className="mt-5 flex gap-1 overflow-x-auto pb-px">
            {tabs.map((tb) => (
              <button
                key={tb.key}
                onClick={() => setTab(tb.key)}
                className={`flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  tab === tb.key
                    ? 'bg-brand text-white'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                }`}
              >
                {tb.label}
                {counts[tb.key] > 0 && (
                  <span className={`rounded-full px-1.5 py-0.5 text-xs ${tab === tb.key ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>
                    {counts[tb.key]}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-5xl px-4 py-8">
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-44 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <div className="text-4xl">🎓</div>
            <p className="mt-3 text-slate-500 dark:text-slate-400">{t.school.noCourses}</p>
          </div>
        ) : (
          <>
            {/* State programs first when showing all */}
            {tab === 'all' && counts.state_program > 0 && (
              <div className="mb-8">
                <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-500" />
                  {t.school.tabStatePrograms}
                </h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {filtered.filter((s) => s.type === 'state_program').map((s) => (
                    <SchoolCard key={s.id} school={s} />
                  ))}
                </div>
              </div>
            )}

            {/* Then bootcamps */}
            {tab === 'all' && counts.bootcamp > 0 && (
              <div className="mb-8">
                <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-blue-500" />
                  {t.school.tabBootcamps}
                </h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {filtered.filter((s) => s.type === 'bootcamp').map((s) => (
                    <SchoolCard key={s.id} school={s} />
                  ))}
                </div>
              </div>
            )}

            {/* Then universities */}
            {tab === 'all' && counts.university > 0 && (
              <div className="mb-8">
                <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-purple-500" />
                  {t.school.tabUniversities}
                </h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {filtered.filter((s) => s.type === 'university').map((s) => (
                    <SchoolCard key={s.id} school={s} />
                  ))}
                </div>
              </div>
            )}

            {/* Filtered view (not 'all') */}
            {tab !== 'all' && (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map((s) => <SchoolCard key={s.id} school={s} />)}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
