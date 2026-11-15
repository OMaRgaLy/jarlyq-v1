'use client';

import { useEffect, useState } from 'react';
import { api } from '../lib/api';

interface Lead {
  opportunityId: number;
  title: string;
  type: string;
  applyClicks: number;
  saved: number;
}

/** Owner-dashboard block: what the platform delivered to the company (apply clicks, saves). */
export function CompanyLeads() {
  const [data, setData] = useState<{ leads: Lead[]; totalClicks: number; totalSaved: number } | null>(null);

  useEffect(() => {
    api.get('/dashboard/company/leads').then((r) => setData(r.data)).catch(() => setData(null));
  }, []);

  if (!data) return null;

  return (
    <section className="mb-6 rounded-2xl border border-brand/30 bg-brand/5 p-6" aria-label="Что дала платформа">
      <h2 className="text-lg font-bold">📈 Что дал вам Jarlyq</h2>
      <div className="mt-3 grid grid-cols-2 gap-4">
        <div className="rounded-xl bg-white p-4 dark:bg-slate-900">
          <p className="text-3xl font-extrabold text-brand">{data.totalClicks}</p>
          <p className="text-sm text-slate-500">переходов на вашу страницу отклика</p>
        </div>
        <div className="rounded-xl bg-white p-4 dark:bg-slate-900">
          <p className="text-3xl font-extrabold text-brand">{data.totalSaved}</p>
          <p className="text-sm text-slate-500">студентов сохранили ваши позиции</p>
        </div>
      </div>
      {data.leads.length > 0 && (
        <table className="mt-4 w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-slate-400"><th className="py-1">Позиция</th><th className="text-right">Переходы</th><th className="text-right">Сохранили</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {data.leads.map((l) => (
              <tr key={l.opportunityId}>
                <td className="py-1.5">{l.title}</td>
                <td className="text-right font-semibold">{l.applyClicks}</td>
                <td className="text-right font-semibold">{l.saved}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
