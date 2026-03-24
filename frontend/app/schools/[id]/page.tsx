'use client';

import { use } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Header } from '../../../components/header';
import { useSchool } from '../../../lib/hooks';
import { useLang } from '../../../lib/lang-context';

export default function SchoolDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: school, isLoading } = useSchool(Number(id));
  const { t } = useLang();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-100/60 dark:bg-slate-950">
        <Header />
        <main className="mx-auto max-w-4xl px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-48 rounded-xl bg-slate-200 dark:bg-slate-800" />
            <div className="h-40 rounded-2xl bg-slate-200 dark:bg-slate-800" />
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
          <Link href="/#schools" className="mt-4 inline-block text-sm text-brand hover:underline">
            {t.school.backToList}
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100/60 dark:bg-slate-950">
      <Header />
      <main className="mx-auto max-w-4xl px-4 py-8 space-y-6">
        <Link href="/#schools" className="inline-flex text-sm text-brand hover:underline">
          {t.school.backToList}
        </Link>

        {/* Header card */}
        <div className="card p-6">
          {school.coverURL && (
            <div className="relative mb-4 h-32 w-full overflow-hidden rounded-xl">
              <Image
                src={school.coverURL}
                alt={school.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 896px"
              />
            </div>
          )}
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{school.name}</h1>
          {school.description && (
            <p className="mt-2 text-slate-600 dark:text-slate-300">{school.description}</p>
          )}

          {school.contacts && (
            <div className="mt-4 flex flex-wrap gap-3">
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

        {/* Courses */}
        <section className="card p-6 space-y-4">
          <h2 className="text-lg font-semibold text-brand uppercase tracking-wide">
            {t.school.courses}
          </h2>
          {(school.courses ?? []).length === 0 ? (
            <p className="text-slate-500">{t.school.noCourses}</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {(school.courses ?? []).map((course) => (
                <div
                  key={course.id}
                  className="rounded-xl border border-slate-200/70 bg-slate-50 p-4 dark:border-slate-700/60 dark:bg-slate-800/50"
                >
                  <p className="font-semibold text-slate-900 dark:text-white">{course.title}</p>
                  {course.description && (
                    <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-300">{course.description}</p>
                  )}
                  {course.externalURL && (
                    <a
                      href={course.externalURL}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-flex text-sm text-brand hover:text-brand-dark hover:underline"
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
