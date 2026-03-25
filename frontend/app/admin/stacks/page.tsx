'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AdminNav } from '../../../components/admin-nav';
import {
  getAdminToken,
  fetchAdminStacks,
  createAdminStack,
  updateAdminStack,
  deleteAdminStack,
  AdminStack,
} from '../../../lib/admin-api';

export default function AdminStacksPage() {
  const router = useRouter();
  const [stacks, setStacks] = useState<AdminStack[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [popularity, setPopularity] = useState(50);
  const [isTrending, setIsTrending] = useState(false);
  const [saving, setSaving] = useState(false);

  const reload = useCallback(() => {
    fetchAdminStacks().then(setStacks).catch(() => router.push('/admin'));
  }, [router]);

  useEffect(() => {
    if (!getAdminToken()) { router.push('/admin'); return; }
    reload();
    setLoading(false);
  }, [router, reload]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      await createAdminStack({ name: name.trim(), popularity, is_trending: isTrending });
      setName('');
      setPopularity(50);
      setIsTrending(false);
      reload();
    } finally { setSaving(false); }
  };

  const handleToggleTrending = async (s: AdminStack) => {
    await updateAdminStack(s.id, { name: s.name, popularity: s.popularity, is_trending: !s.is_trending });
    reload();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить стек?')) return;
    await deleteAdminStack(id);
    reload();
  };

  return (
    <div className="flex min-h-screen">
      <AdminNav />
      <main className="flex-1 p-8">
        <h1 className="mb-6 text-2xl font-bold text-slate-900 dark:text-white">Стеки</h1>

        {/* Create form */}
        <form onSubmit={handleCreate} className="mb-8 flex items-end gap-3 rounded-2xl border border-slate-200/70 bg-white p-5 dark:border-slate-700/60 dark:bg-slate-900">
          <div className="flex-1">
            <label className="mb-1 block text-xs font-medium text-slate-500">Название стека</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Go, Python, React..."
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-brand focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>
          <div className="w-28">
            <label className="mb-1 block text-xs font-medium text-slate-500">Популярность (0–100)</label>
            <input
              type="number"
              value={popularity}
              onChange={(e) => setPopularity(Number(e.target.value))}
              min={0}
              max={100}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-brand focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="flex items-center gap-2 text-xs text-slate-500">
              <input
                type="checkbox"
                checked={isTrending}
                onChange={(e) => setIsTrending(e.target.checked)}
                className="rounded"
              />
              В тренде 🔥
            </label>
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
            >
              {saving ? 'Добавляем...' : '+ Добавить'}
            </button>
          </div>
        </form>

        {/* List */}
        {loading ? <p className="text-slate-500">Загружаем...</p> : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {stacks.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between rounded-xl border border-slate-200/70 bg-white px-4 py-3 dark:border-slate-700/60 dark:bg-slate-900"
              >
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">
                    #{s.name} {s.is_trending && '🔥'}
                  </p>
                  <p className="text-xs text-slate-400">Популярность: {s.popularity}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleToggleTrending(s)}
                    title={s.is_trending ? 'Убрать из тренда' : 'Добавить в тренд'}
                    className={`rounded-lg px-2 py-1 text-xs transition ${s.is_trending ? 'text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20' : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                  >
                    🔥
                  </button>
                  <button
                    onClick={() => handleDelete(s.id)}
                    className="rounded-lg px-2 py-1 text-xs text-red-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
            {stacks.length === 0 && <p className="col-span-3 text-slate-500">Нет стеков</p>}
          </div>
        )}
      </main>
    </div>
  );
}
