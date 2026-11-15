'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Header } from '../../components/header';
import { Footer } from '../../components/footer';
import { api } from '../../lib/api';

interface StackStat {
  id: number;
  name: string;
  isTrending: boolean;
  companies: number;
  opportunities: number;
}

const SCOPES = [
  { key: 'KZ', label: '🇰🇿 Казахстан', country: 'KZ' },
  { key: 'UZ', label: '🇺🇿 Узбекистан', country: 'UZ' },
  { key: 'KG', label: '🇰🇬 Кыргызстан', country: 'KG' },
  { key: 'ca', label: 'Центральная Азия', country: '' },
  { key: 'cis', label: 'СНГ', country: '' },
  { key: 'world', label: '🌍 Весь мир', country: '' },
];

export default function StacksPage() {
  const [scope, setScope] = useState('KZ');
  const [rows, setRows] = useState<StackStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [mine, setMine] = useState<number[]>([]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setFailed(false);
    api.get<{ stacks: StackStat[] }>(`/stats/stacks?scope=${scope}&limit=40`)
      .then((r) => { if (!cancelled) setRows(r.data.stacks ?? []); })
      .catch(() => { if (!cancelled) { setFailed(true); setRows([]); } })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [scope]);

  const max = useMemo(() => Math.max(1, ...rows.map((r) => r.companies + r.opportunities)), [rows]);
  const current = SCOPES.find((s) => s.key === scope)!;

  const toggle = (id: number) => setMine((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  const internshipsHref = `/internships?stack_ids=${mine.join(',')}${current.country ? `&country=${current.country}` : ''}`;

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-950">
      <Header />
      <section className="bg-gradient-to-br from-ink-deep via-ink to-brand">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <h1 className="text-4xl font-extrabold text-white sm:text-5xl">Что учить, чтобы найти работу</h1>
          <p className="mt-3 max-w-2xl text-lg text-white/80">
            Какие технологии нужны компаниям прямо сейчас. Выберите рынок — или отметьте свой стек и посмотрите, куда с ним можно подаваться.
          </p>
        </div>
      </section>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <div role="tablist" aria-label="Рынок" className="flex flex-wrap gap-2">
          {SCOPES.map((s) => (
            <button key={s.key} role="tab" aria-selected={scope === s.key} type="button" onClick={() => setScope(s.key)}
              className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${scope === s.key ? 'border-brand bg-brand text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-brand hover:text-brand dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'}`}>
              {s.label}
            </button>
          ))}
        </div>

        <div className="mt-6 rounded-2xl border border-slate-200/80 bg-white p-2 shadow-sm dark:border-slate-700/60 dark:bg-slate-900 sm:p-4">
          {loading ? (
            <div className="space-y-3 p-2">{[...Array(6)].map((_, i) => <div key={i} className="h-12 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />)}</div>
          ) : failed ? (
            <p className="p-8 text-center text-rose-700">Не удалось загрузить данные. Обновите страницу.</p>
          ) : rows.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-3xl">📊</p>
              <p className="mt-2 font-semibold text-ink dark:text-white">По этому рынку данных пока нет</p>
              <p className="mt-1 text-sm text-slate-500">Мы наполняем каталог. Попробуйте другой рынок или загляните позже.</p>
            </div>
          ) : (
            <ol className="divide-y divide-slate-100 dark:divide-slate-800">
              {rows.map((r, idx) => {
                const total = r.companies + r.opportunities;
                const on = mine.includes(r.id);
                return (
                  <li key={r.id} className="flex flex-wrap items-center gap-3 px-2 py-3 sm:px-3">
                    <span className="w-6 text-right text-sm font-semibold text-slate-400">{idx + 1}</span>
                    <button type="button" onClick={() => toggle(r.id)} aria-pressed={on} title="Добавить в мой стек"
                      className={`w-36 shrink-0 truncate rounded-full border px-3 py-1.5 text-left text-sm font-semibold transition ${on ? 'border-brand bg-brand text-white' : 'border-slate-200 text-ink hover:border-brand dark:border-slate-700 dark:text-white'}`}>
                      {on ? '✓ ' : ''}{r.name}
                    </button>
                    <div className="min-w-[120px] flex-1">
                      <div className="h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800" role="img" aria-label={`${r.companies} компаний, ${r.opportunities} позиций`}>
                        <div className="h-full rounded-full bg-gradient-to-r from-brand-light to-brand" style={{ width: `${Math.max(4, (total / max) * 100)}%` }} />
                      </div>
                    </div>
                    {r.isTrending && <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[11px] font-semibold text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">🔥 в тренде</span>}
                    <div className="flex gap-4 text-sm">
                      <Link href={`/companies?stack=${r.id}`} className="text-slate-600 hover:text-brand dark:text-slate-300"><strong>{r.companies}</strong> компаний</Link>
                      <Link href={`/internships?stack_ids=${r.id}${current.country ? `&country=${current.country}` : ''}`} className="text-slate-600 hover:text-brand dark:text-slate-300"><strong>{r.opportunities}</strong> позиций</Link>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
        <p className="mt-3 text-xs text-slate-400">Считаем по открытым стажировкам и вакансиям и по технологиям, которые указали компании.</p>

        {mine.length > 0 && (
          <div className="sticky bottom-4 mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-ink px-5 py-4 text-white shadow-xl">
            <span className="text-sm">Мой стек: <strong>{rows.filter((r) => mine.includes(r.id)).map((r) => r.name).join(', ')}</strong></span>
            <div className="flex gap-2">
              <button type="button" onClick={() => setMine([])} className="rounded-xl px-3 py-2 text-sm text-white/80 hover:text-white">Сбросить</button>
              <Link href={internshipsHref} className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-ink hover:bg-slate-100">Найти стажировки →</Link>
            </div>
          </div>
        )}

        <div className="mt-10 rounded-2xl border border-slate-200/80 bg-white p-6 dark:border-slate-700/60 dark:bg-slate-900">
          <h2 className="text-lg font-bold text-ink dark:text-white">Не знаете, с чего начать?</h2>
          <p className="mt-1 text-sm text-slate-500">В карьерных путях — пошаговые планы от нуля до первой работы, со ссылками на материалы.</p>
          <Link href="/career-paths" className="mt-3 inline-block text-sm font-semibold text-brand hover:underline">Открыть карьерные пути →</Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
