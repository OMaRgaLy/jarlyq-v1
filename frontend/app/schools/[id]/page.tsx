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

        {/* Hero card */}
        <div className="card overflow-hidden">
          {school.coverURL && (
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
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{school.name}</h1>

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
