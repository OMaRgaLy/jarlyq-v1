'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AdminNav } from '../../../components/admin-nav';
import {
  getAdminToken,
  fetchReviewQueue,
  approveOpportunity,
  rejectOpportunity,
  type AdminOpportunity,
} from '../../../lib/admin-api';

const TYPE_LABELS: Record<string, string> = {
  internship: 'Стажировка',
  job:        'Вакансия',
  grant:      'Грант',
  vacancy:    'Вакансия',
};

const FORMAT_LABELS: Record<string, string> = {
  remote: 'Удалённо',
  office: 'Офис',
  hybrid: 'Гибрид',
};

const LEVEL_LABELS: Record<string, string> = {
  intern: 'Intern',
  junior: 'Junior',
  mid:    'Middle',
  senior: 'Senior',
};

const SOURCE_LABELS: Record<string, string> = {
  hh:       'hh.ru',
  telegram: 'Telegram',
  kariyer:  'Kariyer.net',
  admin:    'Admin',
};

// ──────────────────────────────────────────────
// Карточка вакансии на проверку
// ──────────────────────────────────────────────

function ReviewCard({
  opp,
  onApprove,
  onReject,
}: {
  opp: AdminOpportunity;
  onApprove: (id: number) => void;
  onReject: (id: number) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);

  const handle = async (action: 'approve' | 'reject') => {
    setLoading(true);
    try {
      if (action === 'approve') await approveOpportunity(opp.id);
      else await rejectOpportunity(opp.id);
      action === 'approve' ? onApprove(opp.id) : onReject(opp.id);
    } finally {
      setLoading(false);
    }
  };

  const sourceLabel = SOURCE_LABELS[opp.source] ?? opp.source;
  const typeLabel   = TYPE_LABELS[opp.type] ?? opp.type;
  const formatLabel = FORMAT_LABELS[opp.work_format] ?? opp.work_format;
  const levelLabel  = LEVEL_LABELS[opp.level] ?? opp.level;

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-800/40 dark:bg-amber-900/10 p-4">
      {/* Шапка */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-0.5 text-xs font-medium">
              {typeLabel}
            </span>
            {levelLabel && (
              <span className="rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 text-xs">
                {levelLabel}
              </span>
            )}
            {formatLabel && (
              <span className="rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 text-xs">
                {formatLabel}
              </span>
            )}
            <span className="text-xs text-slate-400">
              {sourceLabel} · {opp.country ?? '—'}
              {opp.city ? ` · ${opp.city}` : ''}
            </span>
          </div>
          <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm leading-snug">
            {opp.title || <span className="text-red-400 italic">без заголовка</span>}
          </p>
          {opp.external_id && (
            <p className="text-xs text-slate-400 mt-0.5">{opp.external_id}</p>
          )}
        </div>

        {/* Кнопки */}
        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => handle('approve')}
            disabled={loading}
            className="rounded-lg bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 text-xs font-medium disabled:opacity-50 transition-colors"
          >
            ✓ Принять
          </button>
          <button
            onClick={() => handle('reject')}
            disabled={loading}
            className="rounded-lg bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 text-xs font-medium disabled:opacity-50 transition-colors"
          >
            ✕ Удалить
          </button>
        </div>
      </div>

      {/* Зарплата */}
      {(opp.salary_min > 0 || opp.salary_max > 0) && (
        <p className="mt-2 text-xs text-slate-600 dark:text-slate-300">
          💰 {opp.salary_min > 0 ? opp.salary_min.toLocaleString() : '?'}
          {opp.salary_max > 0 ? ` – ${opp.salary_max.toLocaleString()}` : '+'} {opp.salary_currency}
        </p>
      )}

      {/* Описание (сворачиваемое) */}
      {opp.description && (
        <div className="mt-2">
          <button
            onClick={() => setExpanded(p => !p)}
            className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 underline"
          >
            {expanded ? 'Свернуть' : 'Показать описание'}
          </button>
          {expanded && (
            <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto border-t border-amber-100 dark:border-amber-800/30 pt-2">
              {opp.description}
            </p>
          )}
        </div>
      )}

      {/* Ссылки */}
      <div className="mt-2 flex gap-3 text-xs">
        {opp.apply_url && (
          <a href={opp.apply_url} target="_blank" rel="noopener noreferrer"
            className="text-blue-600 dark:text-blue-400 hover:underline">
            Откликнуться →
          </a>
        )}
        {opp.source_url && opp.source_url !== opp.apply_url && (
          <a href={opp.source_url} target="_blank" rel="noopener noreferrer"
            className="text-slate-500 hover:underline">
            Оригинал →
          </a>
        )}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// Страница
// ──────────────────────────────────────────────

export default function ReviewQueuePage() {
  const router = useRouter();
  const [opps, setOpps]       = useState<AdminOpportunity[]>([]);
  const [total, setTotal]     = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState<'all' | 'internship' | 'job' | 'grant'>('all');

  const load = useCallback(async () => {
    if (!getAdminToken()) { router.push('/admin'); return; }
    setLoading(true);
    try {
      const { opportunities, total } = await fetchReviewQueue(100, 0);
      setOpps(opportunities);
      setTotal(total);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { load(); }, [load]);

  const handleApprove = (id: number) => setOpps(p => p.filter(o => o.id !== id));
  const handleReject  = (id: number) => setOpps(p => p.filter(o => o.id !== id));

  const filtered = filter === 'all' ? opps : opps.filter(o => o.type === filter);

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <AdminNav />
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-3xl mx-auto">

          {/* Заголовок */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              ⚠️ Очередь проверки
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Вакансии от парсера с низкой уверенностью AI — проверь и прими или удали.
            </p>
          </div>

          {/* Статистика */}
          {!loading && (
            <div className="mb-4 flex items-center gap-4">
              <span className="text-sm font-semibold text-amber-600 dark:text-amber-400">
                {opps.length} на проверке
              </span>
              {total > opps.length && (
                <span className="text-xs text-slate-400">всего в БД: {total}</span>
              )}
            </div>
          )}

          {/* Фильтр по типу */}
          {!loading && opps.length > 0 && (
            <div className="mb-4 flex gap-2">
              {(['all', 'internship', 'job', 'grant'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                    filter === f
                      ? 'bg-amber-500 border-amber-500 text-white'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {f === 'all' ? 'Все' : TYPE_LABELS[f]}
                  {f !== 'all' && (
                    <span className="ml-1 opacity-70">
                      ({opps.filter(o => o.type === f).length})
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Список */}
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-24 rounded-xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center py-20 text-center">
              <span className="text-5xl mb-4">✅</span>
              <p className="font-semibold text-slate-700 dark:text-slate-200">
                {opps.length === 0 ? 'Очередь пуста' : 'Нет вакансий этого типа'}
              </p>
              <p className="text-sm text-slate-400 mt-1">
                {opps.length === 0
                  ? 'Запусти парсер чтобы наполнить очередь'
                  : 'Выбери другой фильтр'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map(opp => (
                <ReviewCard
                  key={opp.id}
                  opp={opp}
                  onApprove={handleApprove}
                  onReject={handleReject}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
