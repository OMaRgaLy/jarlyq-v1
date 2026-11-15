'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Header } from '../../components/header';
import { Footer } from '../../components/footer';
import { useSchools, useStacks } from '../../lib/hooks';
import { TagFilter } from '../../components/tag-filter';
import { useLang } from '../../lib/lang-context';
import { School } from '../../lib/api';

type Tab = 'all' | 'state_program' | 'bootcamp' | 'university' | 'university_abroad';

function SchoolCard({ school, tags = [] }: { school: School; tags?: string[] }) {
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
      : school.type === 'university_abroad'
      ? { label: t.school.badgeUniversityAbroad, cls: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' }
      : { label: t.school.badgeBootcamp, cls: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' };

  return (
    <article className="flex flex-col rounded-lg border border-slate-200 bg-white p-5 transition hover:border-slate-300">
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
          {tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1">
              {tags.slice(0, 5).map((n) => (
                <span key={n} className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{n}</span>
              ))}
              {tags.length > 5 && <span className="px-1 text-xs text-slate-400">+{tags.length - 5}</span>}
            </div>
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
  const [search, setSearch] = useState('');
  const [picked, setPicked] = useState<number[]>([]);
  const { data: schools = [], isLoading } = useSchools({});
  const { data: stacks = [] } = useStacks();

  const tabs: { key: Tab; label: string }[] = [
    { key: 'all', label: t.school.tabAll },
    { key: 'state_program', label: t.school.tabStatePrograms },
    { key: 'bootcamp', label: t.school.tabBootcamps },
    { key: 'university', label: t.school.tabUniversities },
    { key: 'university_abroad', label: t.school.tabUniversitiesAbroad },
  ];

  // Tags of a school = its own tags + the tags of its courses. A school must have every picked tag.
  const tagsOf = (s: School) => {
    const names = new Map<number, string>();
    [...(s.stack ?? []), ...(s.courses ?? []).flatMap((c) => c.stack ?? [])].forEach((x) => names.set(x.id, x.name));
    return names;
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return schools.filter((s) => {
      if (tab !== 'all' && s.type !== tab) return false;
      const tags = tagsOf(s);
      if (!picked.every((id) => tags.has(id))) return false;
      if (!q) return true;
      return (
        s.name.toLowerCase().includes(q) ||
        s.description?.toLowerCase().includes(q) ||
        [...tags.values()].some((n) => n.toLowerCase().includes(q))
      );
    });
  }, [schools, tab, search, picked]);

  const count = (k: Tab) => (k === 'all' ? schools.length : schools.filter((s) => s.type === k).length);
  const dirty = !!(search || picked.length || tab !== 'all');
  const reset = () => { setSearch(''); setPicked([]); setTab('all'); };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Header />

      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
          <h1 className="text-3xl font-bold text-slate-900">{t.school.pageTitle}</h1>
          <p className="mt-2 max-w-2xl text-slate-600">{t.school.pageSubtitle}</p>
          <div className="mt-5 max-w-3xl">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Название школы или технология"
              aria-label="Поиск школы"
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-base focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            />
          </div>
          <div className="mt-4 flex gap-1 overflow-x-auto">
            {tabs.filter((tb) => tb.key === 'all' || count(tb.key) > 0).map((tb) => (
              <button
                key={tb.key}
                onClick={() => setTab(tb.key)}
                aria-pressed={tab === tb.key}
                className={`whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  tab === tb.key ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {tb.label} <span className={tab === tb.key ? 'text-white/70' : 'text-slate-400'}>{count(tb.key)}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        <TagFilter stacks={stacks} selected={picked} onChange={setPicked} />

        {!isLoading && (
          <p className="mb-4 mt-5 text-sm text-slate-500">
            Найдено: <span className="font-semibold text-slate-900">{filtered.length}</span>
            {dirty && <button onClick={reset} className="ml-3 text-brand hover:underline">Сбросить</button>}
          </p>
        )}

        {isLoading ? (
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => <div key={i} className="h-44 animate-pulse rounded-lg bg-slate-200" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-slate-600">{t.school.noCourses}</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((s) => <SchoolCard key={s.id} school={s} tags={[...tagsOf(s).values()]} />)}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
