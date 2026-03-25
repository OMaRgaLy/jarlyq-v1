'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AdminNav } from '../../../components/admin-nav';
import {
  getAdminToken,
  fetchAdminReviews,
  approveAdminReview,
  rejectAdminReview,
  AdminReview,
} from '../../../lib/admin-api';

const statusColors = {
  pending:  'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  approved: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};
const statusLabels = { pending: 'Ожидает', approved: 'Одобрено', rejected: 'Отклонено' };

function Stars({ n }: { n: number }) {
  return (
    <span className="text-amber-400">
      {'★'.repeat(Math.round(n))}{'☆'.repeat(5 - Math.round(n))}
    </span>
  );
}

export default function AdminReviewsPage() {
  const router = useRouter();
  const [items, setItems] = useState<AdminReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [acting, setActing] = useState<number | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await fetchAdminReviews(filter));
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    if (!getAdminToken()) { router.push('/admin'); return; }
    reload();
  }, [router, reload]);

  const act = async (id: number, action: 'approve' | 'reject') => {
    setActing(id);
    try {
      if (action === 'approve') await approveAdminReview(id);
      else await rejectAdminReview(id);
      reload();
    } finally {
      setActing(null);
    }
  };

  return (
    <div className="flex min-h-screen">
      <AdminNav />
      <main className="flex-1 overflow-auto p-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Отзывы</h1>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          >
            <option value="pending">Ожидают ({filter === 'pending' ? items.length : '?'})</option>
            <option value="approved">Одобренные</option>
            <option value="rejected">Отклонённые</option>
          </select>
        </div>

        {loading ? (
          <p className="text-slate-500">Загружаем...</p>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <span className="text-4xl">✅</span>
            <p className="text-slate-500">Нет отзывов в этом статусе</p>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((r) => (
              <div key={r.id} className="rounded-2xl border border-slate-200/70 bg-white p-5 dark:border-slate-700/60 dark:bg-slate-900">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[r.status]}`}>
                        {statusLabels[r.status]}
                      </span>
                      <span className="text-xs text-slate-400">
                        Компания #{r.company_id} · {r.author_name}
                        {r.is_anonymous && ' (аноним)'}
                      </span>
                      <span className="text-xs text-slate-400">
                        {new Date(r.created_at).toLocaleDateString('ru')}
                      </span>
                      {r.employment_type && (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500 dark:bg-slate-800">
                          {r.employment_type}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Stars n={r.overall_rating} />
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                        {r.overall_rating}/5
                      </span>
                    </div>

                    {r.pros && (
                      <div>
                        <p className="text-xs font-medium text-green-600 dark:text-green-400">+ Плюсы</p>
                        <p className="text-sm text-slate-600 dark:text-slate-300">{r.pros}</p>
                      </div>
                    )}
                    {r.cons && (
                      <div>
                        <p className="text-xs font-medium text-red-500">− Минусы</p>
                        <p className="text-sm text-slate-600 dark:text-slate-300">{r.cons}</p>
                      </div>
                    )}
                  </div>

                  {r.status === 'pending' && (
                    <div className="flex shrink-0 flex-col gap-2">
                      <button
                        onClick={() => act(r.id, 'approve')}
                        disabled={acting === r.id}
                        className="rounded-lg bg-green-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-60"
                      >
                        ✓ Одобрить
                      </button>
                      <button
                        onClick={() => act(r.id, 'reject')}
                        disabled={acting === r.id}
                        className="rounded-lg border border-red-200 px-4 py-1.5 text-xs text-red-500 hover:bg-red-50 dark:border-red-800 disabled:opacity-60"
                      >
                        ✕ Отклонить
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
