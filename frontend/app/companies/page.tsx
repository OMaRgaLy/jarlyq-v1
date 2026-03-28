'use client';

import { useState, useMemo } from 'react';
import { Header } from '../../components/header';
import { Footer } from '../../components/footer';
import { CompanyCard } from '../../components/company-card';
import { CompanyCardSkeleton } from '../../components/skeleton';
import { useCompanies, useStacks } from '../../lib/hooks';
import { regions } from '../../lib/api';
import { useLang } from '../../lib/lang-context';
import { MagnifyingGlassIcon } from '@radix-ui/react-icons';

const WORK_FORMATS = ['remote', 'office', 'hybrid'] as const;

export default function CompaniesPage() {
  const { t } = useLang();

  const [search, setSearch] = useState('');
  const [stackId, setStackId] = useState('');
  const [regionId, setRegionId] = useState('');
  const [workFormat, setWorkFormat] = useState('');

  const apiParams = useMemo(() => ({
    ...(stackId  ? { 'stack_ids[]':  [stackId]  } : {}),
    ...(regionId ? { 'region_ids[]': [regionId] } : {}),
    limit: 100,
  }), [stackId, regionId]);

  const { data: companies = [], isLoading } = useCompanies(apiParams);
  const { data: stacks = [] } = useStacks();

  const formatLabel: Record<string, string> = {
    remote: t.company.remote,
    office: t.company.office,
    hybrid: t.company.hybrid,
  };

  // Client-side search + work format filter (no backend support yet)
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return companies.filter((c) => {
      if (q && !c.name.toLowerCase().includes(q) && !c.industry?.toLowerCase().includes(q)) return false;
      if (workFormat) {
        const hasFormat = (c.opportunities ?? []).some((o) => o.workFormat === workFormat);
        if (!hasFormat) return false;
      }
      return true;
    });
  }, [companies, search, workFormat]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-100/60 dark:bg-slate-950">
      <Header />
      <main className="flex-1 mx-auto max-w-6xl px-4 py-8">

        {/* Hero */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            {t.companies.title}
          </h1>
          <p className="mt-2 text-slate-500 dark:text-slate-400">{t.companies.subtitle}</p>
        </div>

        {/* Filters */}
        <div className="mb-6 rounded-2xl border border-slate-200/70 bg-white p-4 dark:border-slate-700/60 dark:bg-slate-900">
          <div className="flex flex-wrap gap-3">

            {/* Search */}
            <div className="relative min-w-[220px] flex-1">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t.companies.searchPlaceholder}
                className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-sm focus:border-brand focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            {/* Stack */}
            <select
              value={stackId}
              onChange={(e) => setStackId(e.target.value)}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-brand focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
              <option value="">{t.filterBar.anyStack}</option>
              {stacks.map((s) => (
                <option key={s.id} value={String(s.id)}>{s.name}</option>
              ))}
            </select>

            {/* Region */}
            <select
              value={regionId}
              onChange={(e) => setRegionId(e.target.value)}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-brand focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
              <option value="">{t.filterBar.anyRegion}</option>
              {regions.map((r) => (
                <option key={r.id} value={String(r.id)}>{r.name}</option>
              ))}
            </select>

            {/* Work format */}
            <select
              value={workFormat}
              onChange={(e) => setWorkFormat(e.target.value)}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-brand focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
              <option value="">{t.companies.anyFormat}</option>
              {WORK_FORMATS.map((f) => (
                <option key={f} value={f}>{formatLabel[f]}</option>
              ))}
            </select>

            {/* Reset */}
            {(search || stackId || regionId || workFormat) && (
              <button
                onClick={() => { setSearch(''); setStackId(''); setRegionId(''); setWorkFormat(''); }}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-500 hover:border-red-300 hover:text-red-500 dark:border-slate-700 dark:text-slate-400"
              >
                {t.companies.resetFilters}
              </button>
            )}
          </div>
        </div>

        {/* Count */}
        {!isLoading && (
          <p className="mb-4 text-sm text-slate-400">
            {t.companies.found}: <span className="font-semibold text-slate-600 dark:text-slate-300">{filtered.length}</span>
          </p>
        )}

        {/* List */}
        {isLoading ? (
          <div className="grid gap-6">
            {[...Array(4)].map((_, i) => <CompanyCardSkeleton key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-20 text-center">
            <span className="text-5xl">🏢</span>
            <p className="font-semibold text-slate-700 dark:text-slate-200">{t.companies.empty}</p>
            <p className="text-sm text-slate-400">{t.companies.emptySub}</p>
            {(search || stackId || regionId || workFormat) && (
              <button
                onClick={() => { setSearch(''); setStackId(''); setRegionId(''); setWorkFormat(''); }}
                className="mt-1 rounded-xl border border-slate-200 px-4 py-2 text-sm text-brand hover:bg-brand/5 dark:border-slate-700"
              >
                {t.companies.resetFilters}
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-6">
            {filtered.map((company) => (
              <CompanyCard key={company.id} company={company} />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
