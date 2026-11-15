'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Header } from '../../components/header';
import { Footer } from '../../components/footer';
import { OpportunityCard } from '../../components/opportunity-card';
import { api, InternshipItem } from '../../lib/api';
import { useLang } from '../../lib/lang-context';
import { useTracker } from '../../lib/tracker';

const FORMATS = [
  { key: 'office', label: 'Офис' },
  { key: 'hybrid', label: 'Гибрид' },
  { key: 'remote', label: 'Удалённо' },
];

const chip = (active: boolean) =>
  `rounded-full border px-3 py-1.5 text-sm font-medium transition ${
    active
      ? 'border-brand bg-brand text-white'
      : 'border-slate-200 bg-white text-slate-600 hover:border-brand hover:text-brand dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'
  }`;

export default function JobsPage() {
  const { t } = useLang();
  const tracker = useTracker();
  const [items, setItems] = useState<InternshipItem[]>([]);
  const [locked, setLocked] = useState(0);
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [format, setFormat] = useState('');
  const [city, setCity] = useState('');

  useEffect(() => {
    const id = setTimeout(() => setDebounced(query.trim()), 300);
    return () => clearTimeout(id);
  }, [query]);

  const params = useMemo(() => {
    const p = new URLSearchParams({ type: 'vacancy' });
    if (debounced) p.set('q', debounced);
    if (format) p.set('work_format', format);
    if (city.trim()) p.set('city', city.trim());
    return p.toString();
  }, [debounced, format, city]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setFailed(false);
    api.get(`/internships?${params}`)
      .then((r) => {
        if (cancelled) return;
        setItems(r.data.internships ?? []);
        setLocked(r.data.premiumLocked ?? 0);
        setIsPremium(!!r.data.isPremium);
      })
      .catch(() => { if (!cancelled) { setFailed(true); setItems([]); } })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [params, tracker.loggedIn]);

  const filtersActive = !!debounced || !!format || !!city.trim();

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-950">
      <Header />
      <section className="bg-gradient-to-br from-ink-deep via-ink to-brand">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
          <h1 className="text-4xl font-extrabold text-white sm:text-5xl">{t.jobs.title}</h1>
          <p className="mt-3 max-w-2xl text-lg text-white/80">{t.jobs.subtitle}</p>
          <div className="mt-6 max-w-2xl">
            <label htmlFor="job-search" className="sr-only">Поиск по должности, компании, городу</label>
            <input id="job-search" type="search" value={query} onChange={(e) => setQuery(e.target.value)}
              placeholder="Поиск по должности, компании, городу…"
              className="w-full rounded-2xl border-0 bg-white px-5 py-3.5 text-base text-slate-900 shadow-lg placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-light" />
          </div>
        </div>
      </section>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <div className="flex flex-wrap items-center gap-2">
          {FORMATS.map((f) => (
            <button key={f.key} type="button" onClick={() => setFormat(format === f.key ? '' : f.key)} aria-pressed={format === f.key} className={chip(format === f.key)}>{f.label}</button>
          ))}
          <label className="sr-only" htmlFor="job-city">{t.internships.filterCity}</label>
          <input id="job-city" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Город"
            className="w-40 rounded-full border border-slate-200 bg-white px-4 py-1.5 text-sm focus:border-brand focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white" />
          {filtersActive && (
            <button type="button" onClick={() => { setQuery(''); setFormat(''); setCity(''); }} className="ml-auto text-sm font-medium text-brand hover:underline">Сбросить</button>
          )}
        </div>

        {!isPremium && locked > 0 && (
          <Link href="/premium" className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900 transition hover:border-amber-300 dark:border-amber-800/40 dark:bg-amber-900/20 dark:text-amber-200">
            <span><strong>⭐ {locked} {locked === 1 ? 'новая позиция' : 'новых позиций'}</strong> уже доступны Premium — на день раньше всех.</span>
            <span className="font-semibold underline">Узнать про Premium →</span>
          </Link>
        )}

        <p className="mt-6 text-sm text-slate-500" aria-live="polite">{loading ? 'Загружаем…' : `Найдено: ${items.length}`}</p>
        <div className="mt-3 space-y-3">
          {loading ? (
            [...Array(4)].map((_, i) => <div key={i} className="h-32 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />)
          ) : failed ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center text-rose-800">Не удалось загрузить вакансии. Обновите страницу через минуту.</div>
          ) : items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center dark:border-slate-700 dark:bg-slate-900">
              <p className="text-3xl">💼</p>
              <p className="mt-2 font-semibold text-slate-800 dark:text-slate-100">{filtersActive ? 'По этим фильтрам ничего нет' : t.jobs.empty}</p>
              <Link href="/internships" className="mt-4 inline-block rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark">Смотреть стажировки</Link>
            </div>
          ) : (
            items.map((item) => (
              <OpportunityCard key={item.id} item={item} tracked={tracker.byOpp.get(item.id)} loggedIn={tracker.loggedIn}
                onChanged={tracker.reload} onSave={tracker.save} onUnsave={tracker.remove} />
            ))
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
