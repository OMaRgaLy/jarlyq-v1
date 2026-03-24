'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Header } from '../../../components/header';
import { useCompany } from '../../../lib/hooks';
import { useLang } from '../../../lib/lang-context';
import type { CompanyShowcase } from '../../../lib/api';

const levelColors: Record<string, string> = {
  intern: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  junior: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  middle: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  senior: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
};

const showcaseTypeColors: Record<string, string> = {
  internship: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  event: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  vacancy: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  news: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
};

function ShowcaseTypeLabel({ type, t }: { type: CompanyShowcase['type']; t: { showcaseInternship: string; showcaseEvent: string; showcaseVacancy: string; showcaseNews: string } }) {
  const labels: Record<CompanyShowcase['type'], string> = {
    internship: t.showcaseInternship,
    event: t.showcaseEvent,
    vacancy: t.showcaseVacancy,
    news: t.showcaseNews,
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${showcaseTypeColors[type] ?? 'bg-slate-100 text-slate-600'}`}>
      {labels[type]}
    </span>
  );
}

export default function CompanyDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const { data: company, isLoading } = useCompany(Number(id));
  const { t } = useLang();
  const [activePhoto, setActivePhoto] = useState(0);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-100/60 dark:bg-slate-950">
        <Header />
        <main className="mx-auto max-w-4xl px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-6 w-36 rounded-lg bg-slate-200 dark:bg-slate-800" />
            <div className="h-56 rounded-2xl bg-slate-200 dark:bg-slate-800" />
            <div className="h-40 rounded-2xl bg-slate-200 dark:bg-slate-800" />
            <div className="h-60 rounded-2xl bg-slate-200 dark:bg-slate-800" />
          </div>
        </main>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen bg-slate-100/60 dark:bg-slate-950">
        <Header />
        <main className="mx-auto max-w-4xl px-4 py-8">
          <p className="text-slate-500">{t.common.notFound}</p>
          <Link href="/#companies" className="mt-4 inline-block text-sm text-brand hover:underline">
            {t.company.backToList}
          </Link>
        </main>
      </div>
    );
  }

  const internships = (company.opportunities ?? []).filter((o) => o.type === 'internship');
  const vacancies = (company.opportunities ?? []).filter((o) => o.type === 'vacancy');
  const photos = company.photos ?? [];
  const offices = company.offices ?? [];
  const showcase = company.showcase ?? [];

  return (
    <div className="min-h-screen bg-slate-100/60 dark:bg-slate-950">
      <Header />
      <main className="mx-auto max-w-4xl px-4 py-8 space-y-6">
        <Link href="/#companies" className="inline-flex text-sm text-brand hover:underline">
          {t.company.backToList}
        </Link>

        {/* Hero card: cover + logo + name + meta */}
        <div className="card overflow-hidden">
          {/* Cover / photo gallery */}
          {photos.length > 0 && photos[activePhoto].url && photos[activePhoto].url.startsWith('http') ? (
            <div className="relative h-52 w-full bg-slate-100 dark:bg-slate-800">
              <Image
                src={photos[activePhoto].url}
                alt={photos[activePhoto].caption || company.name}
                fill
                className="object-cover transition-opacity duration-300"
                sizes="(max-width: 768px) 100vw, 896px"
                priority
              />
              {photos.length > 1 && (
                <>
                  <button
                    onClick={() => setActivePhoto((p) => (p - 1 + photos.length) % photos.length)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-1.5 text-white hover:bg-black/60"
                    aria-label="Previous photo"
                  >
                    ‹
                  </button>
                  <button
                    onClick={() => setActivePhoto((p) => (p + 1) % photos.length)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-1.5 text-white hover:bg-black/60"
                    aria-label="Next photo"
                  >
                    ›
                  </button>
                  <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1">
                    {photos.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setActivePhoto(i)}
                        className={`h-1.5 rounded-full transition-all ${i === activePhoto ? 'w-5 bg-white' : 'w-1.5 bg-white/50'}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          ) : company.coverURL && company.coverURL.startsWith('http') ? (
            <div className="relative h-52 w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
              <Image
                src={company.coverURL}
                alt={company.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 896px"
                priority
              />
            </div>
          ) : null}

          <div className="p-6">
            <div className="flex items-start gap-4">
              {company.logoURL && company.logoURL.startsWith('http') && (
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-700">
                  <Image
                    src={company.logoURL}
                    alt={`${company.name} logo`}
                    fill
                    className="object-contain p-1"
                    sizes="64px"
                  />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{company.name}</h1>
                {company.industry && (
                  <p className="text-sm text-slate-500 dark:text-slate-400">{company.industry}</p>
                )}
              </div>
            </div>

            {/* Stats row */}
            {(company.foundedYear || company.employeeCount) && (
              <div className="mt-4 flex flex-wrap gap-4">
                {company.foundedYear ? (
                  <div className="text-sm">
                    <span className="text-slate-400">{t.company.founded}: </span>
                    <span className="font-medium text-slate-700 dark:text-slate-200">{company.foundedYear}</span>
                  </div>
                ) : null}
                {company.employeeCount ? (
                  <div className="text-sm">
                    <span className="text-slate-400">{t.company.employees}: </span>
                    <span className="font-medium text-slate-700 dark:text-slate-200">{company.employeeCount}</span>
                  </div>
                ) : null}
              </div>
            )}

            {/* Description */}
            {company.description && (
              <p className="mt-4 text-slate-600 dark:text-slate-300">{company.description}</p>
            )}

            {/* Contacts */}
            {company.contacts && (
              <div className="mt-4 flex flex-wrap gap-2">
                {company.contacts.website && (
                  <a
                    href={company.contacts.website}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-brand hover:bg-brand/5 dark:border-slate-700"
                  >
                    🌐 {t.company.website}
                  </a>
                )}
                {company.contacts.telegram && (
                  <a
                    href={`https://t.me/${company.contacts.telegram.replace('@', '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-[#229ED9] hover:bg-[#229ED9]/5 dark:border-slate-700"
                  >
                    ✈️ {t.company.telegram}
                  </a>
                )}
                {company.contacts.email && (
                  <a
                    href={`mailto:${company.contacts.email}`}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
                  >
                    📧 {t.company.email}
                  </a>
                )}
              </div>
            )}
          </div>
        </div>

        {/* About section */}
        {company.about && (
          <section className="card p-6">
            <h2 className="mb-3 text-base font-semibold text-slate-900 dark:text-white">{t.company.about}</h2>
            <p className="whitespace-pre-line text-slate-600 dark:text-slate-300 leading-relaxed">{company.about}</p>
          </section>
        )}

        {/* Showcase / Витрина */}
        {showcase.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">{t.company.showcase}</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {showcase.map((item) => (
                <div
                  key={item.id}
                  className="card overflow-hidden flex flex-col"
                >
                  {item.imageURL && item.imageURL.startsWith('http') && (
                    <div className="relative h-36 w-full bg-slate-100 dark:bg-slate-800">
                      <Image
                        src={item.imageURL}
                        alt={item.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 100vw, 448px"
                      />
                    </div>
                  )}
                  <div className="flex flex-col gap-2 p-4 flex-1">
                    <ShowcaseTypeLabel type={item.type} t={t.company} />
                    <p className="font-semibold text-slate-900 dark:text-white">{item.title}</p>
                    {item.description && (
                      <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2">{item.description}</p>
                    )}
                    {item.linkURL && (
                      <a
                        href={item.linkURL}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-auto inline-flex text-sm font-medium text-brand hover:underline"
                      >
                        {t.company.learnMore} →
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Offices */}
        {offices.length > 0 && (
          <section className="card p-6">
            <h2 className="mb-4 text-base font-semibold text-slate-900 dark:text-white">{t.company.offices}</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {offices.map((office) => (
                <div
                  key={office.id}
                  className="flex items-start gap-3 rounded-xl border border-slate-200/70 bg-slate-50 p-3 dark:border-slate-700/60 dark:bg-slate-800/50"
                >
                  <span className="mt-0.5 text-lg">{office.isHQ ? '🏢' : '📍'}</span>
                  <div>
                    <p className="font-medium text-slate-800 dark:text-slate-100">
                      {office.city}, {office.country}
                      {office.isHQ && (
                        <span className="ml-2 rounded-full bg-brand/10 px-2 py-0.5 text-xs font-semibold text-brand">{t.company.hq}</span>
                      )}
                    </p>
                    {office.address && (
                      <p className="text-sm text-slate-500">{office.address}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Internships */}
        {internships.length > 0 && (
          <section className="card p-6 space-y-4">
            <h2 className="text-base font-semibold text-brand uppercase tracking-wide">{t.company.internships}</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {internships.map((opp) => (
                <div
                  key={opp.id}
                  className="rounded-xl border border-slate-200/70 bg-slate-50 p-4 dark:border-slate-700/60 dark:bg-slate-800/50"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-slate-900 dark:text-white">{opp.title}</p>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${levelColors[opp.level] ?? 'bg-slate-100 text-slate-600'}`}>
                      {opp.level}
                    </span>
                  </div>
                  {opp.description && (
                    <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-300">{opp.description}</p>
                  )}
                  {opp.applyURL && (
                    <a
                      href={opp.applyURL}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-flex rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-dark"
                    >
                      {t.company.apply}
                    </a>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Vacancies */}
        {vacancies.length > 0 && (
          <section className="card p-6 space-y-4">
            <h2 className="text-base font-semibold text-brand uppercase tracking-wide">{t.company.vacancies}</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {vacancies.map((opp) => (
                <div
                  key={opp.id}
                  className="rounded-xl border border-slate-200/70 bg-slate-50 p-4 dark:border-slate-700/60 dark:bg-slate-800/50"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-slate-900 dark:text-white">{opp.title}</p>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${levelColors[opp.level] ?? 'bg-slate-100 text-slate-600'}`}>
                      {opp.level}
                    </span>
                  </div>
                  {opp.description && (
                    <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-300">{opp.description}</p>
                  )}
                  {opp.applyURL && (
                    <a
                      href={opp.applyURL}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-flex rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-dark"
                    >
                      {t.company.respond}
                    </a>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {internships.length === 0 && vacancies.length === 0 && (
          <div className="card p-6 text-center text-slate-500">
            {t.company.noOpportunities}
          </div>
        )}
      </main>
    </div>
  );
}
