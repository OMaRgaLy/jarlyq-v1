'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Header } from '../../components/header';
import { useMasters } from '../../lib/hooks';
import { useLang } from '../../lib/lang-context';
import { MasterProgram } from '../../lib/api';

const COUNTRY_FLAGS: Record<string, string> = {
  'Kazakhstan': '🇰🇿', 'United Kingdom': '🇬🇧', 'Germany': '🇩🇪',
  'Switzerland': '🇨🇭', 'France': '🇫🇷', 'Italy': '🇮🇹',
  'Norway': '🇳🇴', 'Sweden': '🇸🇪', 'Spain': '🇪🇸',
  'Poland': '🇵🇱', 'Czech Republic': '🇨🇿', 'USA': '🇺🇸',
  'Canada': '🇨🇦', 'China': '🇨🇳', 'South Korea': '🇰🇷', 'Japan': '🇯🇵',
};

const COUNTRIES = [
  'Kazakhstan', 'United Kingdom', 'Germany', 'Switzerland', 'France',
  'Italy', 'Norway', 'Sweden', 'Spain', 'Poland', 'Czech Republic',
  'USA', 'Canada', 'China', 'South Korea', 'Japan',
];

function ProgramCard({ p }: { p: MasterProgram }) {
  const { t } = useLang();
  const flag = p.schoolCountry ? (COUNTRY_FLAGS[p.schoolCountry] ?? '🌍') : '🌍';
  const isFree = !p.price || p.price === 0;

  return (
    <article className="flex flex-col rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-brand/30 hover:shadow-md dark:border-slate-800/60 dark:bg-slate-900">
      {/* University */}
      <div className="mb-3 flex items-center gap-2">
        <span className="text-xl">{flag}</span>
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-slate-500 dark:text-slate-400">{p.schoolCountry}</p>
          <Link
            href={`/schools/${p.schoolId}`}
            className="truncate text-sm font-semibold text-slate-800 hover:text-brand dark:text-slate-200"
          >
            {p.schoolName}
          </Link>
        </div>
      </div>

      {/* Program title */}
      <Link href={`/masters/${p.courseId}`} className="text-sm font-semibold leading-snug text-slate-900 hover:text-brand dark:text-slate-50">
        {p.courseTitle}
      </Link>

      {/* Description */}
      {p.description && (
        <p className="mt-1.5 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">{p.description}</p>
      )}

      {/* Badges */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {p.language && (
          <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">
            {p.language.toUpperCase()}
          </span>
        )}
        {p.scholarshipAvailable && (
          <span className="rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
            {t.masters.scholarship}
          </span>
        )}
        {p.format && (
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-500 dark:bg-slate-800 dark:text-slate-400">
            {p.format}
          </span>
        )}
      </div>

      {/* Footer */}
      <div className="mt-auto border-t border-slate-100 pt-3 dark:border-slate-800 mt-4">
        <div className="flex items-center justify-between gap-2">
          <div className="space-y-0.5">
            {isFree ? (
              <span className="text-xs font-medium text-green-600 dark:text-green-400">{t.masters.free}</span>
            ) : (
              <span className="text-xs text-slate-600 dark:text-slate-300">
                {t.masters.priceFrom} {p.price?.toLocaleString()} {p.priceCurrency ?? '€'}{t.masters.perYear}
              </span>
            )}
            {p.applicationDeadline && (
              <p className="text-xs text-slate-400 dark:text-slate-500">
                {t.masters.deadline}: {p.applicationDeadline}
              </p>
            )}
          </div>
          {p.externalURL && (
            <a
              href={p.externalURL}
              target="_blank"
              rel="noreferrer"
              className="shrink-0 rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-dark"
            >
              {t.masters.apply}
            </a>
          )}
        </div>
      </div>
    </article>
  );
}

export default function MastersPage() {
  const { t } = useLang();
  const [country, setCountry] = useState('');
  const [language, setLanguage] = useState('');
  const [scholarship, setScholarship] = useState(false);

  const { data: programs = [], isLoading } = useMasters({
    country: country || undefined,
    language: language || undefined,
    scholarship: scholarship || undefined,
  });

  // Group by country for "all" view
  const grouped = programs.reduce<Record<string, MasterProgram[]>>((acc, p) => {
    const key = p.schoolCountry ?? 'Other';
    (acc[key] ??= []).push(p);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Header />

      {/* Page header */}
      <div className="border-b border-slate-200/70 bg-white dark:border-slate-800/60 dark:bg-slate-900">
        <div className="mx-auto max-w-5xl px-4 py-8">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50 sm:text-3xl">{t.masters.pageTitle}</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t.masters.pageSubtitle}</p>

          {/* Filters */}
          <div className="mt-5 flex flex-wrap gap-3">
            {/* Country */}
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-brand focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <option value="">{t.masters.anyCountry}</option>
              {COUNTRIES.map((c) => (
                <option key={c} value={c}>{COUNTRY_FLAGS[c]} {c}</option>
              ))}
            </select>

            {/* Language */}
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-brand focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <option value="">{t.masters.anyLanguage}</option>
              <option value="en">{t.masters.langEn}</option>
              <option value="de">{t.masters.langDe}</option>
              <option value="fr">{t.masters.langFr}</option>
              <option value="ru">{t.masters.langRu}</option>
            </select>

            {/* Scholarship toggle */}
            <button
              onClick={() => setScholarship((v) => !v)}
              className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                scholarship
                  ? 'border-green-500 bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-brand hover:text-brand dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              {t.masters.scholarship} {scholarship ? '✓' : ''}
            </button>

            {/* Count */}
            {!isLoading && (
              <span className="self-center text-sm text-slate-400">
                {programs.length} {t.masters.programs}
              </span>
            )}
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-5xl px-4 py-8">
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-56 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
            ))}
          </div>
        ) : programs.length === 0 ? (
          <div className="py-16 text-center">
            <div className="text-4xl">🎓</div>
            <p className="mt-3 text-slate-500 dark:text-slate-400">{t.masters.empty}</p>
          </div>
        ) : country || language || scholarship ? (
          // Filtered view — flat grid
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {programs.map((p) => <ProgramCard key={p.courseId} p={p} />)}
          </div>
        ) : (
          // Grouped by country
          Object.entries(grouped).map(([countryName, progs]) => (
            <div key={countryName} className="mb-10">
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                <span>{COUNTRY_FLAGS[countryName] ?? '🌍'}</span>
                {countryName}
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-normal text-slate-400 dark:bg-slate-800">
                  {progs.length}
                </span>
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {progs.map((p) => <ProgramCard key={p.courseId} p={p} />)}
              </div>
            </div>
          ))
        )}
      </main>
    </div>
  );
}
