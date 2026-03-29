'use client';

import Link from 'next/link';
import { Header } from '../../../components/header';
import { Footer } from '../../../components/footer';
import { getToken } from '../../../lib/auth';
import { useLang } from '../../../lib/lang-context';

export default function ForStudentsPage() {
  const isLoggedIn = !!getToken();
  const { t } = useLang();

  const sections = [
    {
      icon: '🏫', href: '/schools',
      title: t.forPath.sectionSchools,
      desc: t.forPath.studentsSchoolsDesc,
      gradient: 'from-emerald-500 to-green-600',
      bg: 'bg-emerald-50/80 dark:bg-emerald-950/20',
      tags: t.forPath.studentsTagSchools.split(','),
    },
    {
      icon: '🎓', href: '/schools?tab=universities',
      title: t.forPath.sectionUniversities,
      desc: t.forPath.studentsUniversitiesDesc,
      gradient: 'from-blue-500 to-indigo-600',
      bg: 'bg-blue-50/80 dark:bg-blue-950/20',
      tags: t.forPath.studentsTagUniversities.split(','),
    },
    {
      icon: '🌍', href: '/masters',
      title: t.forPath.sectionMasters,
      desc: t.forPath.studentsMastersDesc,
      gradient: 'from-violet-500 to-purple-600',
      bg: 'bg-violet-50/80 dark:bg-violet-950/20',
      tags: t.forPath.studentsTagMasters.split(','),
    },
    {
      icon: '📚', href: '/schools?tab=prep',
      title: t.forPath.sectionPartners,
      desc: t.forPath.studentsPartnersDesc,
      gradient: 'from-amber-500 to-orange-600',
      bg: 'bg-amber-50/80 dark:bg-amber-950/20',
      tags: t.forPath.studentsTagPartners.split(','),
    },
    {
      icon: '🗺️', href: '/career-paths',
      title: t.forPath.sectionCareerPaths,
      desc: t.forPath.studentsCareerPathsDesc,
      gradient: 'from-rose-500 to-pink-600',
      bg: 'bg-rose-50/80 dark:bg-rose-950/20',
      tags: t.forPath.studentsTagCareerPaths.split(','),
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-slate-950">
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden px-4 py-16 sm:py-24">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -left-40 top-0 h-[400px] w-[400px] rounded-full bg-emerald-100/60 blur-3xl dark:bg-emerald-900/10" />
            <div className="absolute -right-40 bottom-0 h-[300px] w-[300px] rounded-full bg-teal-100/60 blur-3xl dark:bg-teal-900/10" />
          </div>
          <div className="relative mx-auto max-w-3xl text-center">
            <div className="mb-5 inline-flex rounded-full bg-emerald-100 px-4 py-1.5 text-sm font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
              🎓 {t.forPath.studentsHeroBadge}
            </div>
            <h1 className="text-3xl font-extrabold leading-tight text-slate-900 dark:text-white sm:text-5xl">
              {t.forPath.studentsHeroTitle}
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-slate-500 dark:text-slate-400 sm:text-lg">
              {t.forPath.studentsHeroDesc}
            </p>
          </div>
        </section>

        {/* Sections */}
        <section className="mx-auto max-w-5xl px-4 py-16">
          <div className="space-y-5">
            {sections.map(({ icon, href, title, desc, gradient, bg, tags }, i) => (
              <Link
                key={href}
                href={href}
                className={`group flex flex-col gap-5 rounded-3xl ${bg} p-6 transition hover:shadow-xl sm:flex-row sm:items-center sm:p-8 ${i % 2 === 1 ? 'sm:flex-row-reverse' : ''}`}
              >
                <div className={`flex h-20 w-20 shrink-0 items-center justify-center self-center rounded-2xl bg-gradient-to-br ${gradient} text-4xl shadow-lg transition group-hover:scale-110 sm:h-28 sm:w-28 sm:rounded-3xl sm:text-5xl`}>
                  {icon}
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white sm:text-xl">
                    {title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                    {desc}
                  </p>
                  <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
                    {tags.map(f => (
                      <span key={f} className="rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-slate-600 shadow-sm dark:bg-slate-800 dark:text-slate-300">
                        {f}
                      </span>
                    ))}
                  </div>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-emerald-600 transition group-hover:gap-2 dark:text-emerald-400">
                    {t.forPath.goTo}
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* CTA */}
        {!isLoggedIn && (
          <section className="px-4 pb-16">
            <div className="mx-auto max-w-4xl">
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 p-8 text-center sm:p-14">
                <div className="pointer-events-none absolute inset-0">
                  <div className="absolute -right-20 -top-20 h-60 w-60 rounded-full bg-white/10 blur-3xl" />
                </div>
                <div className="relative">
                  <h2 className="text-xl font-bold text-white sm:text-3xl">
                    {t.forPath.studentsCta}
                  </h2>
                  <p className="mx-auto mt-3 max-w-lg text-sm text-emerald-100/80">
                    {t.forPath.studentsCtaDesc}
                  </p>
                  <Link
                    href="/auth"
                    className="mt-6 inline-flex rounded-xl bg-white px-8 py-3.5 text-sm font-bold text-emerald-700 shadow-lg transition hover:bg-emerald-50"
                  >
                    {t.forPath.registerFree}
                  </Link>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}
