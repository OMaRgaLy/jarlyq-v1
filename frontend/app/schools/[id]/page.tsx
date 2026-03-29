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
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{school.name}</h1>
              <FavoriteButton entityType="school" entityId={school.id} />
            </div>

            {school.description && (
              <p className="mt-3 text-slate-600 dark:text-slate-300 leading-relaxed">{school.description}</p>
            )}

            {school.contacts && (
              <div className="mt-4 flex flex-wrap gap-2">
                {school.contacts.website && (
                  <a
                    href={school.contacts.website}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-brand hover:bg-brand/5 dark:border-slate-700"
                  >
                    🌐 {t.company.website}
                  </a>
                )}
                {school.contacts.telegram && (
                  <a
                    href={`https://t.me/${school.contacts.telegram.replace('@', '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-[#229ED9] hover:bg-[#229ED9]/5 dark:border-slate-700"
                  >
                    ✈️ {t.company.telegram}
                  </a>
                )}
                {school.contacts.email && (
                  <a
                    href={`mailto:${school.contacts.email}`}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
                  >
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
                <Link
                  key={c.id}
                  href={`/companies/${c.id}`}
                  className="flex items-center gap-3 rounded-xl border border-slate-200/70 p-3 transition hover:border-brand/40 hover:shadow-sm dark:border-slate-700/50"
                >
                  {c.logoURL?.startsWith('http') ? (
                    <img src={c.logoURL} alt={c.name} className="h-10 w-10 rounded-lg object-cover" />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand/10 text-brand font-bold">
                      {c.name[0]}
                    </div>
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

        {/* Courses */}
        <section className="card p-6 space-y-4">
          <h2 className="text-base font-semibold text-brand uppercase tracking-wide">{t.school.courses}</h2>
          {(school.courses ?? []).length === 0 ? (
            <p className="text-slate-500">{t.school.noCourses}</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {(school.courses ?? []).map((course) => (
                <div
                  key={course.id}
                  className="flex flex-col rounded-xl border border-slate-200/70 bg-slate-50 p-4 dark:border-slate-700/60 dark:bg-slate-800/50"
                >
                  <p className="font-semibold text-slate-900 dark:text-white">{course.title}</p>
                  {course.description && (
                    <p className="mt-1.5 flex-1 text-sm text-slate-600 dark:text-slate-300 line-clamp-3">{course.description}</p>
                  )}
                  {course.externalURL && (
                    <a
                      href={course.externalURL}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-flex text-sm font-medium text-brand hover:underline"
                    >
                      {t.school.goToSite}
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
