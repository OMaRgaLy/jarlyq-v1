'use client';

import { useState, useMemo, useEffect } from 'react';
import { Header } from '../../components/header';
import { Footer } from '../../components/footer';
import { CompanyCard } from '../../components/company-card';
import { CompanyCardSkeleton } from '../../components/skeleton';
import { useCompanies, useStacks } from '../../lib/hooks';
import { regions } from '../../lib/api';
import { useLang } from '../../lib/lang-context';
import { MagnifyingGlassIcon } from '@radix-ui/react-icons';
import { TagFilter } from '../../components/tag-filter';

export default function CompaniesPage() {
  const { t } = useLang();

  const [search, setSearch] = useState('');
  const [picked, setPicked] = useState<number[]>([]);
  const [regionId, setRegionId] = useState('');

  // Deep link: /companies?stack=<id>
  useEffect(() => {
    const s = new URLSearchParams(window.location.search).get('stack');
    if (s && /^\d+$/.test(s)) setPicked([Number(s)]);
  }, []);

  const apiParams = useMemo(() => ({
    ...(regionId ? { 'region_ids[]': [regionId] } : {}),
    limit: 100,
  }), [regionId]);

  const { data: companies = [], isLoading } = useCompanies(apiParams);
  const { data: stacks = [] } = useStacks();

  // A company must have every picked tag; the search box also matches tag names.
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return companies.filter((c) => {
      const tagIds = new Set((c.stack ?? []).map((s) => s.id));
      if (!picked.every((id) => tagIds.has(id))) return false;
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        c.industry?.toLowerCase().includes(q) ||
        (c.stack ?? []).some((s) => s.name.toLowerCase().includes(q))
      );
    });
  }, [companies, search, picked]);

  const dirty = !!(search || picked.length || regionId);
  const reset = () => { setSearch(''); setPicked([]); setRegionId(''); };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Header />
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
          <h1 className="text-3xl font-bold text-slate-900">{t.companies.title}</h1>
          <p className="mt-2 max-w-2xl text-slate-600">{t.companies.subtitle}</p>
          <div className="mt-5 flex max-w-3xl flex-wrap gap-3">
            <div className="relative min-w-[240px] flex-1">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Название компании или технология"
                aria-label="Поиск компании"
                className="w-full rounded-lg border border-slate-300 bg-white py-3 pl-9 pr-3 text-base focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
              />
            </div>
            <select
              value={regionId}
              onChange={(e) => setRegionId(e.target.value)}
              aria-label="Регион"
              className="rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm focus:border-brand focus:outline-none"
            >
              <option value="">{t.filterBar.anyRegion}</option>
              {regions.map((r) => (
                <option key={r.id} value={String(r.id)}>{r.name}</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        <TagFilter stacks={stacks} selected={picked} onChange={setPicked} />

        {!isLoading && (
          <p className="mb-4 mt-5 text-sm text-slate-500">
            {t.companies.found}: <span className="font-semibold text-slate-900">{filtered.length}</span>
            {dirty && (
              <button onClick={reset} className="ml-3 text-brand hover:underline">{t.companies.resetFilters}</button>
            )}
          </p>
        )}

        {isLoading ? (
          <div className="mt-5 grid gap-4">
            {[...Array(3)].map((_, i) => <CompanyCardSkeleton key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <p className="font-semibold text-slate-800">{t.companies.empty}</p>
            <p className="mt-1 text-sm text-slate-500">{t.companies.emptySub}</p>
            {dirty && (
              <button onClick={reset} className="mt-4 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 hover:border-slate-400">
                {t.companies.resetFilters}
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-4">
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
