'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Header } from '../../components/header';
import { Footer } from '../../components/footer';
import { api, InternshipItem, HRContact, HRContent, Company } from '../../lib/api';
import { useLang } from '../../lib/lang-context';

const FORMAT_OPTIONS = ['remote', 'office', 'hybrid'];

function formatSalary(min?: number, max?: number, currency?: string) {
  if (!min && !max) return null;
  const c = currency || '₸';
  if (min && max) return `${min.toLocaleString()} – ${max.toLocaleString()} ${c}`;
  if (min) return `от ${min.toLocaleString()} ${c}`;
  return `до ${max!.toLocaleString()} ${c}`;
}

function deadlineDays(deadline?: string) {
  if (!deadline) return null;
  const d = new Date(deadline);
  const diff = Math.ceil((d.getTime() - Date.now()) / 86400000);
  if (diff < 0) return 'expired';
  if (diff === 0) return 'сегодня';
  return `${diff} дн.`;
}

function isExpired(deadline?: string) {
  if (!deadline) return false;
  return new Date(deadline).getTime() < Date.now();
}

export default function InternshipsPage() {
  const { t } = useLang();
  const [internships, setInternships] = useState<InternshipItem[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [hrContacts, setHRContacts] = useState<Record<number, HRContact[]>>({});
  const [hrContent, setHRContent] = useState<HRContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [city, setCity] = useState('');
  const [format, setFormat] = useState('');
  const [yearRoundOnly, setYearRoundOnly] = useState(false);
  const [paidOnly, setPaidOnly] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams();
    if (city.trim()) params.set('city', city.trim());
    if (format) params.set('work_format', format);
    if (yearRoundOnly) params.set('is_year_round', 'true');
    if (paidOnly) params.set('is_paid', 'true');

    setLoading(true);
    Promise.all([
      api.get(`/internships?${params.toString()}`).then(r => r.data.internships ?? []),
      api.get('/companies?widget_internship=true').then(r => r.data.companies ?? []).catch(() => []),
      api.get('/companies?hr_content=true').then(r => r.data.hr_content ?? []).catch(() => []),
    ]).then(([items, cos, content]) => {
      setInternships(items);
      setCompanies(cos.slice(0, 6));
      setHRContent(Array.isArray(content) ? content.slice(0, 6) : []);
    }).finally(() => setLoading(false));
  }, [city, format, yearRoundOnly, paidOnly]);

  const formatLabel: Record<string, string> = {
    remote: t.company.remote,
    office: t.company.office,
    hybrid: t.company.hybrid,
  };

  const contentTypeLabel: Record<string, string> = {
    article: t.internships.hrContentTypes.article,
    tip: t.internships.hrContentTypes.tip,
    speech: t.internships.hrContentTypes.speech,
    video: t.internships.hrContentTypes.video,
  };

  const yearRound = internships.filter(i => i.isYearRound);
  const seasonal = internships.filter(i => !i.isYearRound);

  return (
    <div className="min-h-screen flex flex-col bg-slate-100/60 dark:bg-slate-950">
      <Header />
      <main className="flex-1 mx-auto max-w-6xl px-4 py-8">
        {/* Hero */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{t.internships.title}</h1>
          <p className="mt-2 text-slate-500 dark:text-slate-400">{t.internships.subtitle}</p>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200/70 bg-white p-4 dark:border-slate-700/60 dark:bg-slate-900">
          <div className="flex-1 min-w-[160px]">
            <label className="mb-1 block text-xs font-medium text-slate-500">{t.internships.filterCity}</label>
            <input
              type="text"
              value={city}
              onChange={e => setCity(e.target.value)}
              placeholder="Алматы, Астана..."
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-brand focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>
          <div className="w-36">
            <label className="mb-1 block text-xs font-medium text-slate-500">{t.internships.filterFormat}</label>
            <select
              value={format}
              onChange={e => setFormat(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-brand focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
              <option value="">Все</option>
              {FORMAT_OPTIONS.map(f => (
                <option key={f} value={f}>{formatLabel[f]}</option>
              ))}
            </select>
          </div>
          <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-600 dark:text-slate-300 pb-1">
            <input type="checkbox" checked={yearRoundOnly} onChange={e => setYearRoundOnly(e.target.checked)} className="rounded" />
            {t.internships.filterYearRound}
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-600 dark:text-slate-300 pb-1">
            <input type="checkbox" checked={paidOnly} onChange={e => setPaidOnly(e.target.checked)} className="rounded" />
            {t.internships.filterPaid}
          </label>
        </div>

        {/* OSS disclaimer */}
        <div className="mb-6 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-700 dark:border-amber-800/40 dark:bg-amber-900/20 dark:text-amber-400">
          <span className="mt-0.5 text-base">⚠️</span>
          <span>{t.internships.ossDisclaimer}</span>
        </div>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-44 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
            ))}
          </div>
        ) : internships.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-2xl">🔍</p>
            <p className="mt-2 text-slate-500">{t.internships.empty}</p>
          </div>
        ) : (
          <>
            {/* Year-round section */}
            {yearRound.length > 0 && (
              <section className="mb-8">
                <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">
                  🔄 {t.internships.filterYearRound}
                </h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {yearRound.map(item => (
                    <InternshipCard key={item.id} item={item} t={t} formatLabel={formatLabel} />
                  ))}
                </div>
              </section>
            )}

            {/* Seasonal internships */}
            {seasonal.length > 0 && (
              <section className="mb-8">
                {yearRound.length > 0 && (
                  <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">📅 Сезонные</h2>
                )}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {[...seasonal].sort((a, b) => (isExpired(a.deadline) ? 1 : 0) - (isExpired(b.deadline) ? 1 : 0)).map(item => (
                    <InternshipCard key={item.id} item={item} t={t} formatLabel={formatLabel} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        {/* Companies open to interns */}
        {!loading && companies.length > 0 && (
          <section className="mt-10">
            <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">
              🏢 {t.internships.emptyCompanies}
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {companies.map(c => (
                <Link key={c.id} href={`/companies/${c.id}`}
                  className="flex items-center gap-3 rounded-xl border border-slate-200/70 bg-white px-4 py-3 transition hover:border-brand dark:border-slate-700/60 dark:bg-slate-900"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-lg dark:bg-slate-800">
                    {c.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-900 dark:text-white">{c.name}</p>
                    {c.industry && <p className="text-xs text-slate-500">{c.industry}</p>}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* HR Content strip */}
        {!loading && hrContent.length > 0 && (
          <section className="mt-12">
            <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">
              💡 {t.internships.hrContent}
            </h2>
            <div className="flex gap-4 overflow-x-auto pb-2">
              {hrContent.map(c => (
                <a
                  key={c.id}
                  href={c.url || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-64 shrink-0 flex-col gap-2 rounded-xl border border-slate-200/70 bg-white p-4 transition hover:border-brand dark:border-slate-700/60 dark:bg-slate-900"
                >
                  <span className="self-start rounded-full bg-brand/10 px-2 py-0.5 text-xs font-medium text-brand">
                    {contentTypeLabel[c.type] ?? c.type}
                  </span>
                  <p className="text-sm font-medium leading-snug text-slate-900 dark:text-white line-clamp-3">{c.title}</p>
                  <p className="mt-auto text-xs text-slate-400">{c.authorName} · {c.authorPos}</p>
                </a>
              ))}
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}

function InternshipCard({
  item, t, formatLabel,
}: {
  item: InternshipItem;
  t: ReturnType<typeof useLang>['t'];
  formatLabel: Record<string, string>;
}) {
  const salary = formatSalary(item.salaryMin, item.salaryMax, item.salaryCurrency);
  const daysLeft = deadlineDays(item.deadline);

  return (
    <article className={`flex flex-col gap-3 rounded-2xl border border-slate-200/70 bg-white p-5 transition hover:shadow-md dark:border-slate-700/60 dark:bg-slate-900 ${daysLeft === 'expired' ? 'opacity-60' : ''}`}>
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-base font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          {item.companyLogoURL?.startsWith('http') ? (
            <img src={item.companyLogoURL} alt={item.companyName} className="h-10 w-10 rounded-xl object-cover" />
          ) : (
            item.companyName.charAt(0)
          )}
        </div>
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-slate-500 dark:text-slate-400">{item.companyName}</p>
          <Link href={`/internships/${item.id}`} className="truncate font-semibold text-slate-900 hover:text-brand dark:text-white">{item.title}</Link>
        </div>
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-1.5">
        {item.isYearRound && (
          <span className="rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
            {t.internships.yearRound}
          </span>
        )}
        {item.workFormat && (
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            {formatLabel[item.workFormat] ?? item.workFormat}
          </span>
        )}
        {item.city && (
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-500 dark:bg-slate-800 dark:text-slate-400">
            📍 {item.city}
          </span>
        )}
        {!item.isVerified && (
          <span className="rounded-full border border-amber-200 px-2 py-0.5 text-xs text-amber-600 dark:border-amber-800/40 dark:text-amber-400">
            Не верифицировано
          </span>
        )}
      </div>

      {/* Salary + deadline */}
      <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-2 dark:border-slate-800">
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
          {salary || (item.salaryMin === 0 ? t.internships.unpaid : '')}
        </span>
        {daysLeft === 'expired' ? (
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-400 dark:bg-slate-800">
            Завершено
          </span>
        ) : daysLeft ? (
          <span className="text-xs text-red-500">
            {t.internships.deadline}: {daysLeft}
          </span>
        ) : null}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        {item.applyURL && (
          <a
            href={item.applyURL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 rounded-xl bg-brand py-2 text-center text-xs font-semibold text-white hover:bg-brand-dark"
          >
            {t.internships.apply}
          </a>
        )}
        <Link
          href={`/companies/${item.companyId}`}
          className="flex-1 rounded-xl border border-slate-200 py-2 text-center text-xs font-medium text-slate-600 hover:border-brand hover:text-brand dark:border-slate-700 dark:text-slate-300"
        >
          {t.internships.details}
        </Link>
      </div>
    </article>
  );
}
