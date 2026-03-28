'use client';

import { useEffect, useState } from 'react';
import { AdminNav } from '../../../components/admin-nav';
import { fetchAuditLog, type AuditLogEntry } from '../../../lib/admin-api';

const ACTION_COLORS: Record<string, string> = {
  create: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  update: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  delete: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  approve: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  reject: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
};

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [entityFilter, setEntityFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchAuditLog(page, entityFilter || undefined, actionFilter || undefined)
      .then(({ logs, total }) => { setLogs(logs); setTotal(total); })
      .finally(() => setLoading(false));
  }, [page, entityFilter, actionFilter]);

  const totalPages = Math.ceil(total / 50);

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950">
      <AdminNav />
      <main className="flex-1 overflow-auto p-6">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Журнал действий</h1>
        <p className="mt-1 text-sm text-slate-500">Все действия администраторов и владельцев</p>

        {/* Filters */}
        <div className="mt-4 flex flex-wrap gap-3">
          <select
            value={entityFilter}
            onChange={e => { setEntityFilter(e.target.value); setPage(1); }}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-800"
          >
            <option value="">Все сущности</option>
            {['company', 'school', 'opportunity', 'course', 'stack', 'hackathon', 'user', 'owner-request', 'review'].map(e => (
              <option key={e} value={e}>{e}</option>
            ))}
          </select>
          <select
            value={actionFilter}
            onChange={e => { setActionFilter(e.target.value); setPage(1); }}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-800"
          >
            <option value="">Все действия</option>
            {['create', 'update', 'delete', 'approve', 'reject'].map(a => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
          <span className="self-center text-xs text-slate-400">Всего: {total}</span>
        </div>

        {/* Table */}
        <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200/70 bg-white dark:border-slate-700/60 dark:bg-slate-900">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-left text-xs uppercase text-slate-500">
                <th className="px-4 py-3">Дата</th>
                <th className="px-4 py-3">Пользователь</th>
                <th className="px-4 py-3">Действие</th>
                <th className="px-4 py-3">Сущность</th>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Детали</th>
                <th className="px-4 py-3">IP</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400">Загрузка...</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400">Нет записей</td></tr>
              ) : logs.map(log => (
                <tr key={log.id} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/30">
                  <td className="whitespace-nowrap px-4 py-2.5 text-xs text-slate-500">
                    {new Date(log.created_at).toLocaleString('ru')}
                  </td>
                  <td className="px-4 py-2.5 text-slate-700 dark:text-slate-300">{log.user_email}</td>
                  <td className="px-4 py-2.5">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${ACTION_COLORS[log.action] ?? 'bg-slate-100 text-slate-600'}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-slate-600 dark:text-slate-400">{log.entity}</td>
                  <td className="px-4 py-2.5 text-slate-500">{log.entity_id || '—'}</td>
                  <td className="max-w-[200px] truncate px-4 py-2.5 text-xs text-slate-400">{log.details}</td>
                  <td className="px-4 py-2.5 text-xs text-slate-400">{log.ip}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
              className="rounded-lg border border-slate-200 px-3 py-1 text-sm disabled:opacity-40 dark:border-slate-700"
            >
              &larr;
            </button>
            <span className="text-sm text-slate-500">{page} / {totalPages}</span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(p => p + 1)}
              className="rounded-lg border border-slate-200 px-3 py-1 text-sm disabled:opacity-40 dark:border-slate-700"
            >
              &rarr;
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
