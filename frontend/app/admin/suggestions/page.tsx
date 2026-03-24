'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AdminNav } from '../../../components/admin-nav';
import { getAdminToken, adminApi } from '../../../lib/admin-api';

interface Suggestion {
  id: number;
  type: 'company' | 'school';
  name: string;
  description: string;
  website: string;
  telegram: string;
  email: string;
  contactName: string;
  contactEmail: string;
  status: 'pending' | 'approved' | 'rejected';
  adminNotes: string;
  createdAt: string;
}

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  approved: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

const statusLabels = { pending: 'Ожидает', approved: 'Одобрено', rejected: 'Отклонено' };

export default function AdminSuggestionsPage() {
  const router = useRouter();
  const [items, setItems] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [notes, setNotes] = useState<Record<number, string>>({});

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await adminApi.get('/admin/suggestions', { params: { status: filter || undefined } });
      setItems(data.suggestions ?? []);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    if (!getAdminToken()) { router.push('/admin'); return; }
    reload();
  }, [router, reload]);

  const review = async (id: number, status: 'approved' | 'rejected') => {
    await adminApi.put(`/admin/suggestions/${id}`, { status, notes: notes[id] ?? '' });
    reload();
  };

  return (
    <div className="flex min-h-screen">
      <AdminNav />
      <main className="flex-1 overflow-auto p-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Предложения</h1>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          >
            <option value="">Все</option>
            <option value="pending">Ожидают</option>
            <option value="approved">Одобренные</option>
            <option value="rejected">Отклонённые</option>
          </select>
        </div>

        {loading ? (
          <p className="text-slate-500">Загружаем...</p>
        ) : items.length === 0 ? (
          <p className="text-slate-500">Нет предложений</p>
        ) : (
          <div className="space-y-4">
            {items.map((s) => (
              <div key={s.id} className="rounded-2xl border border-slate-200/70 bg-white p-5 dark:border-slate-700/60 dark:bg-slate-900">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[s.status]}`}>
                        {statusLabels[s.status]}
                      </span>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        {s.type === 'company' ? '🏢 Компания' : '🎓 Школа'}
                      </span>
                      <span className="text-xs text-slate-400">{new Date(s.createdAt).toLocaleDateString('ru')}</span>
                    </div>
                    <h3 className="font-semibold text-slate-900 dark:text-white">{s.name}</h3>
                    {s.description && <p className="text-sm text-slate-500">{s.description}</p>}
                    <div className="flex flex-wrap gap-3 pt-1 text-xs text-slate-400">
                      {s.website && <a href={s.website} target="_blank" rel="noreferrer" className="text-brand hover:underline">{s.website}</a>}
                      {s.telegram && <span>TG: {s.telegram}</span>}
                      {s.email && <span>{s.email}</span>}
                    </div>
                    <p className="text-xs text-slate-500">От: {s.contactName} ({s.contactEmail})</p>
                  </div>
                </div>

                {s.status === 'pending' && (
                  <div className="mt-4 space-y-2">
                    <input
                      type="text"
                      placeholder="Заметки (необязательно)"
                      value={notes[s.id] ?? ''}
                      onChange={(e) => setNotes({ ...notes, [s.id]: e.target.value })}
                      className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => review(s.id, 'approved')}
                        className="rounded-lg bg-green-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-green-700"
                      >
                        ✓ Одобрить
                      </button>
                      <button
                        onClick={() => review(s.id, 'rejected')}
                        className="rounded-lg border border-red-200 px-4 py-1.5 text-xs text-red-500 hover:bg-red-50 dark:border-red-800"
                      >
                        ✕ Отклонить
                      </button>
                    </div>
                  </div>
                )}
                {s.adminNotes && (
                  <p className="mt-2 text-xs text-slate-400">Заметка: {s.adminNotes}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
