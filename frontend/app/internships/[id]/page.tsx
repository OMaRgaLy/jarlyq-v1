'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Header } from '../../../components/header';
import { Footer } from '../../../components/footer';
import { CompanyLogo } from '../../../components/opportunity-card';
import { FavoriteButton } from '../../../components/favorite-button';
import { JsonLd, jobPostingJsonLd } from '../../../components/json-ld';
import { api, InternshipItem } from '../../../lib/api';
import { useLang } from '../../../lib/lang-context';
import { TONE_CLASS, applyTo, deadlineInfo, statusMeta, useTracker } from '../../../lib/tracker';

const FORMAT_LABEL: Record<string, string> = { remote: 'Удалённо', office: 'Офис', hybrid: 'Гибрид' };
const COUNTRY_FLAGS: Record<string, string> = { KZ: '🇰🇿', KG: '🇰🇬', UZ: '🇺🇿', TJ: '🇹🇯', RU: '🇷🇺', BY: '🇧🇾', GE: '🇬🇪', TR: '🇹🇷' };
const SOURCE_LABELS: Record<string, string> = { hh: 'hh.kz', 'hh.ru': 'hh.ru', tg: 'Telegram', telegram: 'Telegram' };

type LoadState =
  | { kind: 'loading' }
  | { kind: 'ok'; item: InternshipItem }
  | { kind: 'locked'; title: string; companyName: string }
  | { kind: 'missing' };

// Defined at module level: a component declared inside the page would be re-created on every
// render, remounting the header (and closing its menus) each time the state changes.
function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-950">
      <Header />
      <main className="mx-auto w-full max-w-3xl flex-1 space-y-6 px-4 py-8">{children}</main>
      <Footer />
    </div>
  );
}

export default function InternshipDetailPage({ params }: { params: { id: string } }) {
  const { t } = useLang();
  const router = useRouter();
  const pathname = usePathname();
  const tracker = useTracker();
  const id = Number(params.id);

  const [state, setState] = useState<LoadState>({ kind: 'loading' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    api.get<{ internship: InternshipItem }>(`/internships/${id}`)
      .then((r) => { if (!cancelled) setState({ kind: 'ok', item: r.data.internship }); })
      .catch((e) => {
        if (cancelled) return;
        const data = e?.response?.data;
        if (e?.response?.status === 403 && data?.error === 'premium_required') {
          setState({ kind: 'locked', title: data.title ?? '', companyName: data.companyName ?? '' });
        } else {
          setState({ kind: 'missing' });
        }
      });
    return () => { cancelled = true; };
  }, [id, tracker.loggedIn]);

  if (state.kind === 'loading') {
    return <Shell><div className="animate-pulse space-y-4"><div className="h-6 w-48 rounded-lg bg-slate-200 dark:bg-slate-800" /><div className="h-64 rounded-2xl bg-slate-200 dark:bg-slate-800" /></div></Shell>;
  }

  if (state.kind === 'missing') {
    return (
      <Shell>
        <p className="text-slate-500">{t.common.notFound}</p>
        <Link href="/internships" className="inline-block text-sm text-brand hover:underline">&larr; {t.internships.title}</Link>
      </Shell>
    );
  }

  if (state.kind === 'locked') {
    return (
      <Shell>
        <div className="rounded-3xl border border-amber-200 bg-amber-50 p-8 text-center dark:border-amber-800/40 dark:bg-amber-900/20">
          <p className="text-4xl">⭐</p>
          <h1 className="mt-3 text-2xl font-extrabold text-ink dark:text-white">{state.title || 'Новая стажировка'}</h1>
          {state.companyName && <p className="mt-1 text-slate-600 dark:text-slate-300">{state.companyName}</p>}
          <p className="mx-auto mt-4 max-w-md text-sm text-amber-900 dark:text-amber-200">
            Эта позиция сначала доступна Premium-подписчикам — в течение суток после публикации. Для остальных она откроется автоматически.
          </p>
          <Link href="/premium" className="mt-5 inline-block rounded-xl bg-brand px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark">Узнать про Premium</Link>
        </div>
      </Shell>
    );
  }

  const item = state.item;
  const info = deadlineInfo(item.deadline, item.isYearRound);
  const closed = info.tone === 'expired';
  const tracked = tracker.byOpp.get(item.id);
  const status = tracked ? statusMeta(tracked.status) : null;
  const salary =
    item.salaryMin || item.salaryMax
      ? `${item.salaryMin?.toLocaleString('ru') ?? '?'} – ${item.salaryMax?.toLocaleString('ru') ?? '?'} ${item.salaryCurrency ?? 'KZT'}`
      : null;
  const countryCode = item.country?.toUpperCase();
  const sourceLabel = item.source && item.source !== 'admin' && item.source !== 'import' ? SOURCE_LABELS[item.source] ?? item.source : null;

  const guard = (fn: () => Promise<void>) => async () => {
    setBusy(true);
    setError('');
    try { await fn(); } catch { setError('Что-то пошло не так. Попробуйте ещё раз.'); } finally { setBusy(false); }
  };

  const toggleSave = guard(async () => {
    if (!tracker.loggedIn) { router.push(`/auth?next=${encodeURIComponent(pathname)}`); return; }
    if (tracked) await tracker.remove(item.id); else await tracker.save(item.id);
  });
  const apply = guard(async () => { await applyTo(item.id); await tracker.reload(); });

  return (
    <Shell>
      <JsonLd data={jobPostingJsonLd(item, item.companyName)} />
      <Link href={item.type === 'vacancy' ? '/jobs' : '/internships'} className="inline-flex text-sm text-brand hover:underline">
        &larr; {item.type === 'vacancy' ? 'Вакансии' : t.internships.title}
      </Link>

      <article className="space-y-6 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-700/60 dark:bg-slate-900 sm:p-8">
        <div className="flex items-center gap-4">
          <CompanyLogo name={item.companyName} url={item.companyLogoURL} size={64} />
          <div className="min-w-0 flex-1">
            <Link href={`/companies/${item.companyId}`} className="text-sm font-semibold text-brand hover:underline">{item.companyName}</Link>
            {countryCode && <p className="text-xs text-slate-400">{COUNTRY_FLAGS[countryCode] ?? ''} {countryCode}{item.city ? ` · ${item.city}` : ''}</p>}
          </div>
          <FavoriteButton entityType="opportunity" entityId={item.id} />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-extrabold text-ink dark:text-white">{item.title}</h1>
          {status && <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${status.chip}`}>{status.label}</span>}
        </div>

        <div className="flex flex-wrap gap-2 text-xs font-medium">
          <span className={`rounded-full px-3 py-1 font-semibold ${TONE_CLASS[info.tone]}`}>{info.text}</span>
          {item.deadline && !item.isYearRound && (
            <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600 dark:bg-slate-800 dark:text-slate-300">до {new Date(item.deadline).toLocaleDateString('ru', { timeZone: 'UTC' })}</span>
          )}
          {item.level && <span className="rounded-full bg-brand/10 px-3 py-1 text-brand">{item.level}</span>}
          {item.workFormat && <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600 dark:bg-slate-800 dark:text-slate-300">{FORMAT_LABEL[item.workFormat] ?? item.workFormat}</span>}
          {sourceLabel && <span className="rounded-full border border-slate-200 px-3 py-1 text-slate-500 dark:border-slate-700">via {sourceLabel}</span>}
        </div>

        {(item.stacks?.length ?? 0) > 0 && (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Технологии</p>
            <div className="flex flex-wrap gap-2">
              {item.stacks!.map((s) => <span key={s} className="rounded-full bg-brand/10 px-3 py-1 text-sm font-medium text-brand-dark dark:text-brand-light">{s}</span>)}
            </div>
          </div>
        )}

        {salary && (
          <p className="text-sm"><span className="text-slate-400">{t.reviews.salaryRating}: </span><span className="font-semibold text-ink dark:text-white">{salary}</span></p>
        )}

        {item.description && (
          <section>
            <h2 className="mb-2 text-lg font-bold text-ink dark:text-white">{item.type === 'vacancy' ? 'О вакансии' : 'О стажировке'}</h2>
            <p className="whitespace-pre-line text-slate-600 dark:text-slate-300">{item.description}</p>
          </section>
        )}
        {item.requirements && (
          <section>
            <h2 className="mb-2 text-lg font-bold text-ink dark:text-white">Кого ищут</h2>
            <p className="whitespace-pre-line text-slate-600 dark:text-slate-300">{item.requirements}</p>
          </section>
        )}

        <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 pt-5 dark:border-slate-800">
          {item.applyURL && !closed ? (
            <button type="button" onClick={apply} disabled={busy} className="rounded-xl bg-brand px-7 py-3 text-sm font-semibold text-white shadow-sm hover:bg-brand-dark disabled:opacity-50">
              Откликнуться ↗
            </button>
          ) : closed ? (
            <span className="text-sm text-slate-500">Приём заявок закрыт</span>
          ) : null}
          <button type="button" onClick={toggleSave} disabled={busy} aria-pressed={!!tracked}
            className={`rounded-xl border px-5 py-3 text-sm font-semibold transition disabled:opacity-50 ${tracked ? 'border-brand bg-brand/10 text-brand' : 'border-slate-200 text-slate-700 hover:border-brand hover:text-brand dark:border-slate-700 dark:text-slate-200'}`}>
            {tracked ? '★ В трекере' : '☆ Сохранить в трекер'}
          </button>
          {tracked && <Link href="/tracker" className="text-sm font-medium text-brand hover:underline">Мои отклики →</Link>}
        </div>
        {error && <p role="alert" className="text-sm text-rose-600">{error}</p>}
        {!tracker.loggedIn && <p className="text-xs text-slate-400">Войдите, чтобы сохранять стажировки и получать напоминания о дедлайне.</p>}
      </article>

      <div className="text-center text-sm text-slate-500">
        <Link href={`/companies/${item.companyId}`} className="text-brand hover:underline">Все возможности от {item.companyName} &rarr;</Link>
      </div>
    </Shell>
  );
}
