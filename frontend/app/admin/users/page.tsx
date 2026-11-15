'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminNav } from '../../../components/admin-nav';
import { getAdminToken, fetchAdminUsers, setUserPremium, AdminUser } from '../../../lib/admin-api';

function premiumActive(u: AdminUser) {
  return !!u.premium_until && new Date(u.premium_until).getTime() > Date.now();
}

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [onlyInterested, setOnlyInterested] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!getAdminToken()) { router.push('/admin'); return; }
    fetchAdminUsers()
      .then(setUsers)
      .catch(() => router.push('/admin'))
      .finally(() => setLoading(false));
  }, [router]);

  const changePremium = async (u: AdminUser, days: number) => {
    setError('');
    try {
      const until = await setUserPremium(u.id, days);
      setUsers((cur) => cur.map((x) => (x.id === u.id ? { ...x, premium_until: until } : x)));
    } catch {
      setError('Не удалось изменить Premium. Попробуйте ещё раз.');
    }
  };

  const filtered = users.filter((u) => {
    if (onlyInterested && !u.premium_interest_at) return false;
    const q = search.toLowerCase();
    return (
      u.first_name.toLowerCase().includes(q) ||
      u.last_name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.phone?.includes(q)
    );
  });
  const interested = users.filter((u) => u.premium_interest_at && !premiumActive(u)).length;

  return (
    <div className="flex min-h-screen">
      <AdminNav />
      <main className="flex-1 overflow-auto p-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Пользователи <span className="text-base font-normal text-slate-400">({users.length})</span>
          </h1>
          <div className="flex items-center gap-3">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
              <input type="checkbox" checked={onlyInterested} onChange={(e) => setOnlyInterested(e.target.checked)} />
              Хотят Premium ({interested})
            </label>
            <input
              type="text"
              placeholder="Поиск по имени / email / телефону"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-72 rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-brand focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>
        </div>
        {error && <p role="alert" className="mb-3 text-sm text-rose-700">{error}</p>}

        {loading ? (
          <p className="text-slate-500">Загружаем...</p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200/70 bg-white dark:border-slate-700/60 dark:bg-slate-900">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400">Имя</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400">Профиль</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400">Регистрация</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400">Premium</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filtered.map((u) => {
                  const active = premiumActive(u);
                  return (
                    <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="px-4 py-3 text-slate-400">#{u.id}</td>
                      <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                        {u.first_name} {u.last_name}
                        {u.role !== 'user' && <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-500 dark:bg-slate-800">{u.role}</span>}
                      </td>
                      <td className="px-4 py-3 text-slate-500">{u.email}</td>
                      <td className="px-4 py-3 text-xs text-slate-500">{[u.level, u.country].filter(Boolean).join(' · ') || '—'}</td>
                      <td className="px-4 py-3 text-xs text-slate-400">{new Date(u.created_at).toLocaleDateString('ru')}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap items-center gap-2">
                          {active ? (
                            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">⭐ до {new Date(u.premium_until!).toLocaleDateString('ru')}</span>
                          ) : u.premium_interest_at ? (
                            <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs font-semibold text-sky-800">хочет Premium</span>
                          ) : null}
                          <button type="button" onClick={() => changePremium(u, 30)} className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-medium hover:border-brand hover:text-brand dark:border-slate-700">+30 дн.</button>
                          {active && (
                            <button type="button" onClick={() => changePremium(u, 0)} className="rounded-lg px-2 py-1 text-xs text-rose-600 hover:underline">отозвать</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-400">Нет пользователей</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
