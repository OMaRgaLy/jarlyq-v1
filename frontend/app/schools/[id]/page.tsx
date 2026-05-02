'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Header } from '../../../components/header';
import { JsonLd, educationalOrgJsonLd } from '../../../components/json-ld';
import { FavoriteButton } from '../../../components/favorite-button';
import { useSchool } from '../../../lib/hooks';
import { useLang } from '../../../lib/lang-context';
import { api } from '../../../lib/api';

interface RelatedCompany {
  id: number;
  name: string;
  logoURL?: string;
  industry?: string;
}

export default function SchoolDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const { data: school, isLoading } = useSchool(Number(id));
  const { t } = useLang();
  const [relatedCompanies, setRelatedCompanies] = useState<RelatedCompany[]>([]);

  // Fetch companies that use the same stacks as this school's courses
  useEffect(() => {
    if (!school?.courses?.length) return;
    const stackIds = new Set<number>();
    for (const c of school.courses) {
      for (const s of c.stack ?? []) stackIds.add(s.id);
    }
    if (!stackIds.size) return;
    const params = [...stackIds].map(id => `stack_ids[]=${id}`).join('&');
    api.get<{ companies: RelatedCompany[] }>(`/companies?${params}`)
      .then(({ data }) => setRelatedCompanies((data.companies ?? []).slice(0, 4)))
      .catch(() => {});
  }, [school?.courses]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-100/60 dark:bg-slate-950">
        <Header />
        <main className="mx-auto max-w-4xl px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-6 w-36 rounded-lg bg-slate-200 dark:bg-slate-800" />
            <div className="h-56 rounded-2xl bg-slate-200 dark:bg-slate-800" />
            <div className="h-60 rounded-2xl bg-slate-200 dark:bg-slate-800" />
          </div>
        </main>
      </div>
    );
  }

  if (!school) {
    return (
      <div className="min-h-screen bg-slate-100/60 dark:bg-slate-950">
        <Header />
        <main className="mx-auto max-w-4xl px-4 py-8">
          <p className="text-slate-500">{t.common.notFound}</p>
          <Link href="/schools" className="mt-4 inline-block text-sm text-brand hover:underline">
            {t.school.backToList}
          </Link>
        </main>
      </div>
    );
  }

  // Human-readable type label
  const typeLabels: Record<string, string> = {
    bootcamp: 'Буткемп',
    university: 'Университет',
    state_program: 'Гос. программа',
    university_abroad: 'Зарубежный вуз',
    center: 'Образовательный центр',
    peer_learning: 'Peer-to-peer',
  };
  const typeLabel = typeLabels[school.type] ?? school.type;

  return (
    <div className="min-h-screen bg-slate-100/60 dark:bg-slate-950">
      <Header />
      <JsonLd data={educationalOrgJsonLd(school)} />
      <main className="mx-auto max-w-4xl px-4 py-8 space-y-6">
        <Link href="/schools" className="inline-flex text-sm text-brand hover:underline">
          {t.school.backToList}
        </Link>

        {/* Hero card */}
        <div className="card overflow-hidden">
          {school.coverURL?.startsWith('http') && (
            <div className="relative h-52 w-full bg-slate-100 dark:bg-slate-800">
              <Image
                src={school.coverURL}
                alt={school.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 896px"
                priority
              />
            </div>
          )}

          <div className="p-6">
            {/* Name + logo + favorite */}
            <div className="flex items-start gap-4">
              {school.logoURL?.startsWith('http') && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={school.logoURL} alt={school.name} className="h-14 w-14 rounded-xl object-contain border border-slate-100 dark:border-slate-800 bg-white p-1 shadow-sm shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{school.name}</h1>
                  {school.isVerified && (
                    <span className="text-brand shrink-0" title="Верифицировано">
                      <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                      </svg>
                    </span>
                  )}
                  <FavoriteButton entityType="school" entityId={school.id} />
                </div>

                {/* Meta row: type + location + age */}
                <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <span className="rounded-full border border-slate-200 dark:border-slate-700 px-2 py-0.5 font-medium">{typeLabel}</span>
                  {school.country && <span>🌍 {school.city ? `${school.city}, ${school.country}` : school.country}</span>}
                  {school.ageRange && <span>👤 {school.ageRange}</span>}
                  {school.audience && <span>· {school.audience}</span>}
                  {school.isStateFunded && <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 font-medium">🏛 Гос. финансирование</span>}
                </div>
              </div>
            </div>

            {/* Badges */}
            {(school.badges ?? []).length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {(school.badges ?? []).map(badge => (
                  <span
                    key={badge.id}
                    className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold"
                    style={{
                      color: badge.colorLight,
                      backgroundColor: badge.colorLight + '18',
                      border: `1px solid ${badge.colorLight}40`,
                    }}
                  >
                    <span>{badge.icon === 'verified' ? '✓' : badge.icon}</span>
                    {badge.label}
                  </span>
                ))}
              </div>
            )}

            {/* Description */}
            {school.description && (
              <p className="mt-4 text-slate-600 dark:text-slate-300 leading-relaxed">{school.description}</p>
            )}

            {/* About (markdown-like simple render) */}
            {school.about && (
              <div className="mt-4 prose prose-sm dark:prose-invert max-w-none text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                {school.about}
              </div>
            )}

            {/* Contacts */}
            {school.contacts && (
              <div className="mt-4 flex flex-wrap gap-2">
                {school.contacts.website && (
                  <a href={school.contacts.website} target="_blank" rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-brand hover:bg-brand/5 dark:border-slate-700">
                    🌐 {t.company.website}
                  </a>
                )}
                {school.contacts.telegram && (
                  <a href={`https://t.me/${school.contacts.telegram.replace('@', '')}`} target="_blank" rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-[#229ED9] hover:bg-[#229ED9]/5 dark:border-slate-700">
                    ✈️ {t.company.telegram}
                  </a>
                )}
                {school.contacts.email && (
                  <a href={`mailto:${school.contacts.email}`}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300">
                    📧 {t.company.email}
                  </a>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Related Companies */}
        {relatedCompanies.length > 0 && (
          <section className="card p-6">
            <h2 className="mb-1 text-base font-semibold text-slate-900 dark:text-white">{t.companies.title}</h2>
            <p className="mb-4 text-xs text-slate-400">{t.companies.subtitle}</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {relatedCompanies.map(c => (
                <Link key={c.id} href={`/companies/${c.id}`}
                  className="flex items-center gap-3 rounded-xl border border-slate-200/70 p-3 transition hover:border-brand/40 hover:shadow-sm dark:border-slate-700/50">
                  {c.logoURL?.startsWith('http') ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.logoURL} alt={c.name} className="h-10 w-10 rounded-lg object-cover" />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand/10 text-brand font-bold">{c.name[0]}</div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{c.name}</p>
                    {c.industry && <p className="truncate text-xs text-slate-400">{c.industry}</p>}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Courses / Programs */}
        <section className="card p-6 space-y-4">
          <h2 className="text-base font-semibold text-brand uppercase tracking-wide">
            {school.type === 'state_program' ? 'Направления программы' : t.school.courses}
          </h2>
          {(school.courses ?? []).length === 0 ? (
            <p className="text-slate-500">{t.school.noCourses}</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {(school.courses ?? []).map((course) => (
                <div key={course.id}
                  className="flex flex-col rounded-xl border border-slate-200/70 bg-slate-50 p-4 dark:border-slate-700/60 dark:bg-slate-800/50">
                  <p className="font-semibold text-slate-900 dark:text-white">{course.title}</p>

                  {/* Course meta pills */}
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {course.price === 0 || course.price === undefined ? (
                      <span className="rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 text-xs font-semibold">Бесплатно</span>
                    ) : course.price ? (
                      <span className="rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 text-xs">{course.price.toLocaleString()} {course.priceCurrency ?? '₸'}</span>
                    ) : null}
                    {course.hasEmployment && (
                      <span className="rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-0.5 text-xs font-semibold">🎓 Трудоустройство</span>
                    )}
                    {course.scholarshipAvailable && (
                      <span className="rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-0.5 text-xs font-semibold">✨ Стипендия</span>
                    )}
                    {course.format && (
                      <span className="rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 px-2 py-0.5 text-xs capitalize">{course.format}</span>
                    )}
                    {course.durationWeeks ? (
                      <span className="text-xs text-slate-400">{course.durationWeeks} нед.</span>
                    ) : null}
                  </div>

                  {course.description && (
                    <p className="mt-2 flex-1 text-sm text-slate-600 dark:text-slate-300 line-clamp-3">{course.description}</p>
                  )}
                  {course.externalURL && (
                    <a href={course.externalURL} target="_blank" rel="noreferrer"
                      className="mt-3 inline-flex text-sm font-medium text-brand hover:underline">
                      {t.school.goToSite} →
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
