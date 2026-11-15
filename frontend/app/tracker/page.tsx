'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Header } from '../../components/header';
import { Footer } from '../../components/footer';
import { CompanyLogo } from '../../components/opportunity-card';
import { api } from '../../lib/api';
import { AppStatus, STATUSES, TONE_CLASS, TrackerItem, deadlineInfo, useTracker } from '../../lib/tracker';

function detailHref(i: TrackerItem) {
  return i.type === 'vacancy' ? `/jobs/${i.opportunityId}` : `/internships/${i.opportunityId}`;
}

function TrackerCard({
  item, onStatus, onNote, onRemove,
}: {
  item: TrackerItem;
  onStatus: (s: AppStatus) => void;
  onNote: (n: string) => void;
  onRemove: () => void;
}) {
  const info = deadlineInfo(item.deadline, item.isYearRound);
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState(item.note);
  const finished = item.status === 'offer' || item.status === 'rejected';

  return (
    <article className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-700/60 dark:bg-slate-900">
      <div className="flex items-start gap-3">
        <CompanyLogo name={item.companyName} url={item.companyLogoURL} size={40} />
        <div className="min-w-0 flex-1">
          <Link href={detailHref(item)} className="block truncate font-semibold text-ink hover:text-brand dark:text-white">{item.title}</Link>
          <Link href={`/companies/${item.companyId}`} className="block truncate text-sm text-brand hover:underline">{item.companyName}</Link>
        </div>
      </div>

      {!finished && (
        <span className={`mt-3 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${TONE_CLASS[info.tone]}`}>{info.text}</span>
      )}

      <div className="mt-3 flex items-center gap-2">
        <label className="sr-only" htmlFor={`st-${item.id}`}>Статус</label>
        <select
          id={`st-${item.id}`}
          value={item.status}
          onChange={(e) => onStatus(e.target.value as AppStatus)}
          className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
        >
          {STATUSES.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
        </select>
        <button type="button" onClick={() => setOpen(!open)} aria-expanded={open}
          className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm text-slate-600 hover:border-brand hover:text-brand dark:border-slate-700 dark:text-slate-300">
          {item.note ? '📝' : '＋'}
        </button>
      </div>

      {open && (
        <div className="mt-3">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={1000}
            rows={3}
            placeholder="Заметка: с кем говорили, что подготовить…"
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-brand focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
          <div className="mt-2 flex justify-between">
            <button type="button" onClick={() => onNote(note)} className="rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-dark">Сохранить</button>
            <button type="button" onClick={onRemove} className="text-xs text-rose-600 hover:underline">Убрать из трекера</button>
          </div>
        </div>
      )}
    </article>
  );
}

export default function TrackerPage() {
  const tracker = useTracker();
  const [tgLinked, setTgLinked] = useState<boolean | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!tracker.loggedIn) return;
    api.get<{ linked: boolean }>('/telegram/status').then((r) => setTgLinked(r.data.linked)).catch(() => setTgLinked(null));
  }, [tracker.loggedIn]);

  const run = async (fn: () => Promise<void>) => {
    setError('');
    try { await fn(); } catch { setError('Не получилось сохранить изменение. Попробуйте ещё раз.'); }
  };

  const columns = useMemo(
    () => STATUSES.map((s) => ({ ...s, items: tracker.items.filter((i) => i.status === s.key) })),
    [tracker.items],
  );

  // Saved but not yet applied, closing within a week — the ones worth acting on today.
  const urgent = useMemo(
    () => tracker.items
      .filter((i) => i.status === 'saved' && !i.isYearRound)
      .map((i) => ({ i, d: deadlineInfo(i.deadline, i.isYearRound).days }))
      .filter((x) => x.d !== null && x.d >= 0 && x.d <= 7)
      .sort((a, b) => (a.d as number) - (b.d as number)),
    [tracker.items],
  );

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-950">
      <Header />
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-10">
          <h1 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">Мои отклики</h1>
          <p className="mt-2 max-w-2xl text-slate-600">Сохраняйте стажировки, следите за статусом и не пропускайте дедлайны.</p>
          {tracker.loggedIn && (
            <div className="mt-5 flex flex-wrap gap-2">
              {columns.map((c) => (
                <span key={c.key} className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">{c.label}: {c.items.length}</span>
              ))}
            </div>
          )}
        </div>
      </section>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        {tracker.loading ? (
          <div className="grid gap-4 md:grid-cols-3">{[...Array(3)].map((_, i) => <div key={i} className="h-40 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />)}</div>
        ) : !tracker.loggedIn ? (
          <div className="mx-auto max-w-lg rounded-2xl border border-slate-200 bg-white p-10 text-center dark:border-slate-700 dark:bg-slate-900">
            <p className="text-4xl">📌</p>
            <h2 className="mt-3 text-xl font-bold text-ink dark:text-white">Войдите, чтобы вести трекер</h2>
            <p className="mt-2 text-sm text-slate-500">Он хранит ваши сохранённые стажировки и напоминает о дедлайнах.</p>
            <Link href="/auth?next=/tracker" className="mt-5 inline-block rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark">Войти или зарегистрироваться</Link>
          </div>
        ) : tracker.items.length === 0 ? (
          <div className="mx-auto max-w-lg rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center dark:border-slate-700 dark:bg-slate-900">
            <p className="text-4xl">🗂️</p>
            <h2 className="mt-3 text-xl font-bold text-ink dark:text-white">Здесь пока пусто</h2>
            <p className="mt-2 text-sm text-slate-500">Нажмите ☆ на карточке стажировки — она появится здесь, а мы напомним о дедлайне.</p>
            <Link href="/internships" className="mt-5 inline-block rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark">Смотреть стажировки</Link>
          </div>
        ) : (
          <>
            {error && <p role="alert" className="mb-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

            {tgLinked === false && (
              <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-sky-200 bg-sky-50 px-5 py-4 text-sm text-sky-900 dark:border-sky-900/40 dark:bg-sky-900/20 dark:text-sky-200">
                <span>🔔 Подключите Telegram — пришлём напоминание за 7, 3 и 1 день до дедлайна.</span>
                <Link href="/profile" className="font-semibold underline">Подключить</Link>
              </div>
            )}

            {urgent.length > 0 && (
              <section className="mb-8">
                <h2 className="mb-3 text-lg font-bold text-ink dark:text-white">🔥 Горящие дедлайны</h2>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {urgent.map(({ i }) => {
                    const info = deadlineInfo(i.deadline, i.isYearRound);
                    return (
                      <Link key={i.id} href={detailHref(i)} className="flex items-center gap-3 rounded-2xl border border-rose-200 bg-white p-4 transition hover:border-rose-300 dark:border-rose-900/40 dark:bg-slate-900">
                        <CompanyLogo name={i.companyName} url={i.companyLogoURL} size={40} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold text-ink dark:text-white">{i.title}</p>
                          <p className="truncate text-sm text-slate-500">{i.companyName}</p>
                        </div>
                        <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${TONE_CLASS[info.tone]}`}>{info.text}</span>
                      </Link>
                    );
                  })}
                </div>
              </section>
            )}

            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-5">
              {columns.map((col) => (
                <section key={col.key} aria-label={col.label}>
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-200">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs ${col.chip}`}>{col.label}</span>
                    <span className="text-slate-400">{col.items.length}</span>
                  </h3>
                  <div className="space-y-3">
                    {col.items.length === 0 && <p className="rounded-xl border border-dashed border-slate-200 px-3 py-6 text-center text-xs text-slate-400 dark:border-slate-700">Пусто</p>}
                    {col.items.map((item) => (
                      <TrackerCard
                        key={`${item.id}-${item.updatedAt}`}
                        item={item}
                        onStatus={(s) => run(() => tracker.setStatus(item.opportunityId, s))}
                        onNote={(n) => run(() => tracker.setNote(item.opportunityId, n))}
                        onRemove={() => run(() => tracker.remove(item.opportunityId))}
                      />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
