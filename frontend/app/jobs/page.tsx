'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Header } from '../../components/header';
import { api, InternshipItem } from '../../lib/api';
import { useLang } from '../../lib/lang-context';

export default function JobsPage() {
  const { t } = useLang();
  const [vacancies, setVacancies] = useState<InternshipItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [city, setCity] = useState('');
  const [format, setFormat] = useState('');

  useEffect(() => {
    setLoading(true);
    const params: Record<string, string> = {};
    if (city) params.city = city;
    if (format) params.work_format = format;

    api.get<{ companies: { id: number; name: string; logoURL?: string; opportunities: { id: number; type: string; title: string; level?: string; workFormat?: string; city?: string; salaryMin?: number; salaryMax?: number; salaryCurrency?: string; applyURL?: string; description?: string; deadline?: string }[] }[] }>('/companies')
      .then(({ data }) => {
        const items: InternshipItem[] = [];
        for (const c of data.companies ?? []) {
          for (const opp of c.opportunities ?? []) {
            if (opp.type !== 'vacancy') continue;
            if (city && !opp.city?.toLowerCase().includes(city.toLowerCase())) continue;
            if (format && opp.workFormat !== format) continue;
            items.push({
              ...opp,
              id: opp.id,
              type: 'vacancy',
              title: opp.title,
              companyName: c.name,
              companyLogoURL: c.logoURL,
              companyId: c.id,
            } as InternshipItem);
          }
        }
        setVacancies(items);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [city, format]);

  return (
    <div className="min-h-screen bg-slate-100/60 dark:bg-slate-950">
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{t.jobs.title}</h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">{t.jobs.subtitle}</p>
        </div>

        <div className="mb-6 flex flex-wrap gap-3">
          <select value={city} onChange={e => { setCity(e.target.value); }}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white">
            <option value="">{t.internships.filterCity}</option>
            <option value="Алматы">Алматы</option>
            <option value="Астана">Астана</option>
            <option value="Remote">Remote</option>
          </select>
          <select value={format} onChange={e => { setFormat(e.target.value); }}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white">
            <option value="">{t.internships.filterFormat}</option>
            <option value="remote">Remote</option>
            <option value="office">Office</option>
            <option value="hybrid">Hybrid</option>
          </select>
        </div>

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {[1,2,3,4].map(i => (
              <div key={i} className="h-40 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
            ))}
          </div>
        ) : vacancies.length === 0 ? (
          <p className="text-sm text-slate-500">{t.jobs.empty}</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {vacancies.map(v => {
              const salary = (v.salaryMin || v.salaryMax)
                ? `${v.salaryMin?.toLocaleString() ?? '?'} – ${v.salaryMax?.toLocaleString() ?? '?'} ${v.salaryCurrency ?? 'KZT'}`
                : null;

              return (
                <article key={v.id} className="flex flex-col gap-3 rounded-2xl border border-slate-200/70 bg-white p-5 transition hover:shadow-md dark:border-slate-700/60 dark:bg-slate-900">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-base font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      {v.companyLogoURL?.startsWith('http') ? (
                        <img src={v.companyLogoURL} alt={v.companyName} className="h-10 w-10 rounded-xl object-cover" />
                      ) : (
                        v.companyName.charAt(0)
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium text-slate-500 dark:text-slate-400">{v.companyName}</p>
                      <Link href={`/internships/${v.id}`} className="truncate font-semibold text-slate-900 hover:text-brand dark:text-white">
                        {v.title}
                      </Link>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {v.level && <span className="rounded-full bg-brand/10 px-2.5 py-0.5 text-xs font-medium text-brand">{v.level}</span>}
                    {v.workFormat && <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">{v.workFormat}</span>}
                    {v.city && <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-500 dark:bg-slate-800 dark:text-slate-400">📍 {v.city}</span>}
                  </div>

                  <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-2 dark:border-slate-800">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                      {salary ?? ''}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    {v.applyURL && (
                      <a href={v.applyURL} target="_blank" rel="noreferrer"
                        className="flex-1 rounded-xl bg-brand py-2 text-center text-xs font-semibold text-white hover:bg-brand-dark">
                        {t.internships.apply}
                      </a>
                    )}
                    <Link href={`/companies/${v.companyId}`}
                      className="flex-1 rounded-xl border border-slate-200 py-2 text-center text-xs font-medium text-slate-600 hover:border-brand hover:text-brand dark:border-slate-700 dark:text-slate-300">
                      {t.internships.details}
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
