'use client';

import { useMemo, useState } from 'react';
import { Header } from '../components/header';
import { Hero } from '../components/hero';
import { FilterBar, FilterState } from '../components/filter-bar';
import { CertificateChecker } from '../components/certificate-checker';
import { CompanyCard } from '../components/company-card';
import { SchoolCard } from '../components/school-card';
import { useCompanies, useSchools, useStacks } from '../lib/hooks';

export default function Page() {
  const [filters, setFilters] = useState<FilterState>({});
  const { data: stacks = [], isLoading: stacksLoading } = useStacks();
  const { data: companies = [], isLoading: companiesLoading } = useCompanies({
    'stack_ids[]': filters.stackId ? [filters.stackId] : undefined,
    'region_ids[]': filters.regionId ? [filters.regionId] : undefined,
    level: filters.level
  });
  const { data: schools = [], isLoading: schoolsLoading } = useSchools({
    'stack_ids[]': filters.stackId ? [filters.stackId] : undefined,
    'region_ids[]': filters.regionId ? [filters.regionId] : undefined
  });

  const opportunities = useMemo(() =>
    companies.flatMap((company) =>
      company.opportunities.map((opportunity) => ({
        ...opportunity,
        company: company.name
      }))
    ),
  [companies]);

  return (
    <div className="min-h-screen bg-slate-100/60 dark:bg-slate-950">
      <Header />
      <main className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-8">
        <Hero />
        <FilterBar stacks={stacks} value={filters} onChange={setFilters} />

        <section id="stacks" className="card p-6">
          <h2 className="section-title">Популярные стеки</h2>
          {stacksLoading ? (
            <p className="text-sm text-slate-500">Загружаем данные…</p>
          ) : (
            <div className="flex flex-wrap gap-3">
              {stacks.map((stack) => (
                <span
                  key={stack.id}
                  className="rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:bg-slate-900 dark:text-slate-100"
                >
                  #{stack.name}
                </span>
              ))}
            </div>
          )}
        </section>

        <section id="companies" className="space-y-4">
          <div>
            <h2 className="section-title">Компании региона</h2>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Управляйте виджетами профиля компании и показывайте обучение, стажировки и вакансии тем, кому это важно.
            </p>
          </div>
          {companiesLoading ? (
            <p className="text-sm text-slate-500">Загружаем компании…</p>
          ) : companies.length === 0 ? (
            <p className="text-sm text-slate-500">Пока нет результатов. Попробуйте другой фильтр.</p>
          ) : (
            <div className="grid gap-6">
              {companies.map((company) => (
                <CompanyCard key={company.id} company={company} />
              ))}
            </div>
          )}
        </section>

        <section id="schools" className="space-y-4">
          <div>
            <h2 className="section-title">Школы и курсы</h2>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Управляйте витриной курсов без кода и отслеживайте UTM-метки для эффективности кампаний.
            </p>
          </div>
          {schoolsLoading ? (
            <p className="text-sm text-slate-500">Загружаем школы…</p>
          ) : schools.length === 0 ? (
            <p className="text-sm text-slate-500">Нет курсов по выбранному стеку или региону.</p>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {schools.map((school) => (
                <SchoolCard key={school.id} school={school} />
              ))}
            </div>
          )}
        </section>

        <section id="opportunities" className="card space-y-4 p-6">
          <div>
            <h2 className="section-title">Актуальные возможности</h2>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Стажировки и вакансии с быстрым доступом к подаче заявки и указанием требуемого уровня.
            </p>
          </div>
          {companiesLoading ? (
            <p className="text-sm text-slate-500">Загружаем предложения…</p>
          ) : opportunities.length === 0 ? (
            <p className="text-sm text-slate-500">Нет возможностей для выбранных фильтров.</p>
          ) : (
            <ul className="grid gap-4 md:grid-cols-2">
              {opportunities.map((opportunity) => (
                <li key={`${opportunity.id}-${opportunity.company}`} className="rounded-2xl border border-slate-200/70 bg-white p-4 shadow-sm dark:border-slate-700/60 dark:bg-slate-900/70">
                  <p className="text-xs uppercase tracking-wide text-brand">
                    {opportunity.type === 'internship' ? 'Стажировка' : 'Вакансия'} · {opportunity.level}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-50">{opportunity.title}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Компания: {opportunity.company}</p>
                  {opportunity.applyURL && (
                    <a
                      href={opportunity.applyURL}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-flex text-xs text-brand hover:text-brand-dark"
                    >
                      Подать заявку →
                    </a>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        <CertificateChecker />
      </main>
      <footer className="border-t border-slate-200/70 bg-white/80 py-6 text-center text-xs text-slate-500 dark:border-slate-800/60 dark:bg-slate-950/80 dark:text-slate-400">
        © {new Date().getFullYear()} Jarlyq. Сделано для роста IT-комьюнити Центральной Азии.
      </footer>
    </div>
  );
}
