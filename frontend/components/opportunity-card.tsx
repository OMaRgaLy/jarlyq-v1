'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { InternshipItem } from '../lib/api';
import { TONE_CLASS, TrackerItem, applyTo, deadlineInfo, statusMeta } from '../lib/tracker';

const FORMAT_LABEL: Record<string, string> = { remote: 'Удалённо', office: 'Офис', hybrid: 'Гибрид' };

function formatSalary(min?: number, max?: number, currency?: string) {
  if (!min && !max) return null;
  const c = currency || '₸';
  if (min && max) return `${min.toLocaleString('ru')} – ${max.toLocaleString('ru')} ${c}`;
  if (min) return `от ${min.toLocaleString('ru')} ${c}`;
  return `до ${max!.toLocaleString('ru')} ${c}`;
}

export function CompanyLogo({ name, url, size = 56 }: { name: string; url?: string; size?: number }) {
  const style = { width: size, height: size };
  if (url?.startsWith('http')) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt={name} style={style} className="shrink-0 rounded-2xl bg-white object-cover ring-1 ring-slate-200 dark:ring-slate-700" />;
  }
  return (
    <div
      style={style}
      className="flex shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-ink-deep to-brand text-lg font-bold text-white"
      aria-hidden
    >
      {name.trim().charAt(0).toUpperCase() || '?'}
    </div>
  );
}

interface Props {
  item: InternshipItem;
  tracked?: TrackerItem;
  loggedIn: boolean;
  /** Called after any tracker change so the page can reload the tracker. */
  onChanged: () => void;
  onSave: (oppId: number) => Promise<void>;
  onUnsave: (oppId: number) => Promise<void>;
  onStackClick?: (name: string) => void;
}

export function OpportunityCard({ item, tracked, loggedIn, onChanged, onSave, onUnsave, onStackClick }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const info = deadlineInfo(item.deadline, item.isYearRound);
  const closed = info.tone === 'expired';
  const salary = formatSalary(item.salaryMin, item.salaryMax, item.salaryCurrency);
  const early = item.premiumUntil && new Date(item.premiumUntil).getTime() > Date.now();
  const meta = [item.companyName, item.city, item.workFormat ? FORMAT_LABEL[item.workFormat] ?? item.workFormat : null]
    .filter(Boolean)
    .join(' · ');

  const needAuth = () => router.push(`/auth?next=${encodeURIComponent(pathname || '/internships')}`);

  const toggleSave = async () => {
    if (!loggedIn) return needAuth();
    setBusy(true);
    setError('');
    try {
      if (tracked) await onUnsave(item.id);
      else await onSave(item.id);
      onChanged();
    } catch {
      setError('Не удалось сохранить. Попробуйте ещё раз.');
    } finally {
      setBusy(false);
    }
  };

  const apply = async () => {
    setBusy(true);
    setError('');
    try {
      await applyTo(item.id);
      onChanged();
    } catch {
      setError('Не удалось открыть страницу отклика.');
    } finally {
      setBusy(false);
    }
  };

  const status = tracked ? statusMeta(tracked.status) : null;

  return (
    <article className={`group flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:border-brand/40 hover:shadow-md dark:border-slate-700/60 dark:bg-slate-900 sm:flex-row sm:items-center ${closed ? 'opacity-70' : ''}`}>
      <CompanyLogo name={item.companyName} url={item.companyLogoURL} />

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Link href={`${item.type === 'vacancy' ? '/jobs' : '/internships'}/${item.id}`} className="text-lg font-bold text-ink hover:text-brand dark:text-white">
            {item.title}
          </Link>
          {early && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
              ⭐ Early access
            </span>
          )}
          {status && (
            <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${status.chip}`}>{status.label}</span>
          )}
        </div>
        <p className="mt-0.5 text-sm text-brand dark:text-brand-light">
          <Link href={`/companies/${item.companyId}`} className="hover:underline">{item.companyName}</Link>
          {meta.slice(item.companyName.length)}
        </p>

        {(item.stacks?.length ?? 0) > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {item.stacks!.slice(0, 6).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => onStackClick?.(s)}
                className="rounded-full bg-brand/10 px-2.5 py-1 text-xs font-medium text-brand-dark transition hover:bg-brand/20 dark:text-brand-light"
              >
                {s}
              </button>
            ))}
            {item.stacks!.length > 6 && <span className="px-1 py-1 text-xs text-slate-400">+{item.stacks!.length - 6}</span>}
          </div>
        )}
        {salary && <p className="mt-2 text-sm font-semibold text-slate-700 dark:text-slate-200">{salary}</p>}
        {error && <p role="alert" className="mt-2 text-xs text-rose-600">{error}</p>}
      </div>

      <div className="flex shrink-0 flex-row items-center justify-between gap-3 sm:flex-col sm:items-end">
        <div className="text-left sm:text-right">
          {item.deadline && !item.isYearRound && (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              до {new Date(item.deadline).toLocaleDateString('ru', { timeZone: 'UTC' })}
            </p>
          )}
          <span className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${TONE_CLASS[info.tone]}`}>
            {info.text}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleSave}
            disabled={busy}
            aria-pressed={!!tracked}
            aria-label={tracked ? 'Убрать из трекера' : 'Сохранить в трекер'}
            title={tracked ? 'В вашем трекере. Нажмите, чтобы убрать' : 'Сохранить и не пропустить дедлайн'}
            className={`rounded-xl border px-3 py-2 text-sm transition disabled:opacity-50 ${
              tracked
                ? 'border-brand bg-brand/10 text-brand'
                : 'border-slate-200 text-slate-500 hover:border-brand hover:text-brand dark:border-slate-700'
            }`}
          >
            {tracked ? '★' : '☆'}
          </button>
          {item.applyURL && !closed && (
            <button
              type="button"
              onClick={apply}
              disabled={busy}
              className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark disabled:opacity-50"
            >
              Откликнуться ↗
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
