'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminNav } from '../../../components/admin-nav';
import { getAdminToken, fetchAdminUsers, AdminUser } from '../../../lib/admin-api';

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!getAdminToken()) { router.push('/admin'); return; }
    fetchAdminUsers()
      .then(setUsers)
      .catch(() => router.push('/admin'))
      .finally(() => setLoading(false));
  }, [router]);

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      u.first_name.toLowerCase().includes(q) ||
      u.last_name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.phone?.includes(q)
    );
  });

  return (
    <div className="flex min-h-screen">
      <AdminNav />
      <main className="flex-1 overflow-auto p-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Пользователи <span className="text-base font-normal text-slate-400">({users.length})</span>
          </h1>
          <input
            type="text"
            placeholder="Поиск по имени / email / телефону"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-72 rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-brand focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        </div>

        {loading ? (
          <p className="text-slate-500">Загружаем...</p>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white dark:border-slate-700/60 dark:bg-slate-900">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400">Имя</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400">Телефон</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400">Дата регистрации</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filtered.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-4 py-3 text-slate-400">#{u.id}</td>
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                      {u.first_name} {u.last_name}
                    </td>
                    <td className="px-4 py-3 text-slate-500">{u.email}</td>
                    <td className="px-4 py-3 text-slate-500">
                      {u.phone ? (
                        <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700 dark:bg-green-900/30 dark:text-green-400">
                          {u.phone}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400">
                      {new Date(u.created_at).toLocaleDateString('ru')}
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                      Нет пользователей
                    </td>
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
