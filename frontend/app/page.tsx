'use client';

import { useMemo, useState } from 'react';
import { Header } from '../components/header';
import { Hero } from '../components/hero';
import { FilterBar, FilterState } from '../components/filter-bar';
import { CertificateChecker } from '../components/certificate-checker';
import { CompanyCard } from '../components/company-card';
import { SchoolCard } from '../components/school-card';
import { OnboardingBanner } from '../components/onboarding-banner';
import { CompanyCardSkeleton, SchoolCardSkeleton, StacksSkeleton } from '../components/skeleton';
import { useCompanies, useSchools, useStacks } from '../lib/hooks';
import { useLang } from '../lib/lang-context';
import Link from 'next/link';

export default function Page() {
  const [filters, setFilters] = useState<FilterState>({});
  const { t } = useLang();

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
      (company.opportunities ?? []).map((opportunity) => ({
        ...opportunity,
        company: company.name,
        companyId: company.id,
      }))
    ),
  [companies]);

  return (
    <div className="min-h-screen bg-slate-100/60 dark:bg-slate-950">
      <Header />
      <main className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-8">
        <Hero />
        <OnboardingBanner />
        <FilterBar stacks={stacks} value={filters} onChange={setFilters} />

        {/* Популярные стеки */}
        <section id="stacks" className="card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="section-title mb-0">{t.home.sectionStacks}</h2>
            {!stacksLoading && stacks.some(s => s.isTrending) && (
              <span className="text-xs text-slate-400 dark:text-slate-500">{t.home.trendingLabel}</span>
            )}
          </div>
          {stacksLoading ? (
            <StacksSkeleton />
          ) : stacks.length === 0 ? (
            <div className="py-6 text-center">
              <p className="text-sm text-slate-500">{t.common.loading}</p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-3">
              {stacks.map((stack) => (
                <button
                  key={stack.id}
                  onClick={() => setFilters(f => ({ ...f, stackId: f.stackId === String(stack.id) ? undefined : String(stack.id) }))}
                  className={`flex items-center gap-1 rounded-full px-4 py-2 text-sm font-medium shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
                    filters.stackId === String(stack.id)
                      ? 'bg-brand text-white'
                      : 'bg-white text-slate-700 dark:bg-slate-900 dark:text-slate-100'
                  }`}
                >
                  {stack.isTrending && <span>🔥</span>}
                  #{stack.name}
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Компании */}
        <section id="companies" className="space-y-4">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="section-title">{t.home.sectionCompanies}</h2>
              <p className="text-sm text-slate-600 dark:text-slate-300">{t.home.sectionCompaniesSub}</p>
            </div>
            <Link href="/companies" className="shrink-0 text-sm font-medium text-brand hover:underline">
              {t.companies.viewAll}
            </Link>
          </div>
          {companiesLoading ? (
            <div className="grid gap-6">
              <CompanyCardSkeleton />
              <CompanyCardSkeleton />
            </div>
          ) : companies.length === 0 ? (
            <div className="card flex flex-col items-center gap-3 py-10 text-center">
              <span className="text-4xl">🏢</span>
              <p className="font-semibold text-slate-700 dark:text-slate-200">{t.home.emptyCo}</p>
              <p className="max-w-xs text-sm text-slate-500 dark:text-slate-400">{t.home.emptyCoSub}</p>
              <Link
                href="/career-paths"
                className="mt-1 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
              >
                {t.nav.careerPaths} →
              </Link>
            </div>
          ) : (
            <>
              <div className="grid gap-6">
                {companies.slice(0, 4).map((company) => (
                  <CompanyCard key={company.id} company={company} />
                ))}
              </div>
              {companies.length > 4 && (
                <div className="text-center">
                  <Link
                    href="/companies"
                    className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-600 shadow-sm hover:border-brand hover:text-brand dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                  >
                    {t.companies.viewAll}
                  </Link>
                </div>
              )}
            </>
          )}
        </section>

        {/* Школы */}
        <section id="schools" className="space-y-4">
          <div>
            <h2 className="section-title">{t.home.sectionSchools}</h2>
            <p className="text-sm text-slate-600 dark:text-slate-300">{t.home.sectionSchoolsSub}</p>
          </div>
          {schoolsLoading ? (
            <div className="grid gap-6 md:grid-cols-2">
              <SchoolCardSkeleton />
              <SchoolCardSkeleton />
            </div>
          ) : schools.length === 0 ? (
            <div className="card flex flex-col items-center gap-3 py-10 text-center">
              <span className="text-4xl">🎓</span>
              <p className="font-semibold text-slate-700 dark:text-slate-200">{t.home.emptySch}</p>
              <p className="max-w-xs text-sm text-slate-500 dark:text-slate-400">{t.home.emptySchSub}</p>
              <Link
                href="/interview"
                className="mt-1 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
              >
                {t.nav.interview} →
              </Link>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {schools.map((school) => (
                <SchoolCard key={school.id} school={school} />
              ))}
            </div>
          )}
        </section>

        {/* Возможности */}
        {opportunities.length > 0 && (
          <section id="opportunities" className="card space-y-4 p-6">
            <div>
              <h2 className="section-title">{t.home.sectionOpportunities}</h2>
              <p className="text-sm text-slate-600 dark:text-slate-300">{t.home.sectionOpportunitiesSub}</p>
            </div>
            <ul className="grid gap-4 md:grid-cols-2">
              {opportunities.map((opportunity) => (
                <li
                  key={`${opportunity.id}-${opportunity.company}`}
                  className="rounded-2xl border border-slate-200/70 bg-white p-4 shadow-sm dark:border-slate-700/60 dark:bg-slate-900/70"
                >
                  <p className="text-xs uppercase tracking-wide text-brand">
                    {opportunity.type === 'internship' ? t.common.internship : t.common.vacancy} · {opportunity.level}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-50">
                    {opportunity.title}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {opportunity.company}
                  </p>
                  {opportunity.applyURL && (
                    <a
                      href={opportunity.applyURL}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-flex text-xs text-brand hover:text-brand-dark"
                    >
                      {t.company.apply} →
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        <CertificateChecker />
      </main>
      <footer className="border-t border-slate-200/70 bg-white/80 py-6 text-center text-xs text-slate-500 dark:border-slate-800/60 dark:bg-slate-950/80 dark:text-slate-400">
        <p>© {new Date().getFullYear()} Jarlyq. {t.home.footer}</p>
        <p className="mt-1 flex items-center justify-center gap-3">
          <Link href="/legal" className="hover:text-brand hover:underline">{t.legal.title}</Link>
          <Link href="/internships" className="hover:text-brand hover:underline">{t.nav.internships}</Link>
          <Link href="/hackathons" className="hover:text-brand hover:underline">{t.nav.hackathons}</Link>
        </p>
      </footer>
    </div>
  );
}
