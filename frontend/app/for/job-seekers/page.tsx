'use client';

import Link from 'next/link';
import { Header } from '../../../components/header';
import { Footer } from '../../../components/footer';
import { useLang } from '../../../lib/lang-context';
import { getToken } from '../../../lib/auth';

export default function ForJobSeekersPage() {
  const { t } = useLang();
  const isLoggedIn = !!getToken();

  const sections = [
    {
      key: 'Internships' as const, icon: '🔍', href: '/internships',
      gradient: 'from-indigo-500 to-blue-600',
      bg: 'bg-indigo-50 dark:bg-indigo-950/30',
      features: ['20+ компаний', 'Фильтр по городу', 'Дедлайны'],
    },
    {
      key: 'Jobs' as const, icon: '💼', href: '/jobs',
      gradient: 'from-emerald-500 to-teal-600',
      bg: 'bg-emerald-50 dark:bg-emerald-950/30',
      features: ['Junior & Middle', 'По стеку', 'Зарплаты'],
    },
    {
      key: 'CareerPaths' as const, icon: '🗺️', href: '/career-paths',
      gradient: 'from-purple-500 to-violet-600',
      bg: 'bg-purple-50 dark:bg-purple-950/30',
      features: ['Пошаговые треки', 'От Junior до Senior', 'Материалы'],
    },
    {
      key: 'Companies' as const, icon: '🏢', href: '/companies',
      gradient: 'from-sky-500 to-cyan-600',
      bg: 'bg-sky-50 dark:bg-sky-950/30',
      features: ['Стек технологий', 'Отзывы', 'Открытые позиции'],
    },
    {
      key: 'Interview' as const, icon: '🎯', href: '/interview',
      gradient: 'from-amber-500 to-orange-600',
      bg: 'bg-amber-50 dark:bg-amber-950/30',
      features: ['Реальные вопросы', 'По уровням', 'С ответами'],
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-slate-950">
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden px-4 py-24">
          {/* Background art */}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -left-40 top-0 h-[500px] w-[500px] rounded-full bg-indigo-100/50 blur-3xl dark:bg-indigo-900/10" />
            <div className="absolute -right-40 bottom-0 h-[400px] w-[400px] rounded-full bg-purple-100/50 blur-3xl dark:bg-purple-900/10" />
          </div>

          <div className="relative mx-auto max-w-3xl text-center">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-indigo-100 px-4 py-1.5 text-sm font-semibold text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
              💼 Для тех, кто ищет работу
            </div>
            <h1 className="text-4xl font-extrabold leading-tight text-slate-900 dark:text-white sm:text-5xl">
              {t.forPath.jobSeekersTitle}
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-slate-500 dark:text-slate-400">
              {t.forPath.jobSeekersSubtitle}
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link href="/internships" className="rounded-xl bg-slate-900 px-7 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100">
                {t.forPath.sectionInternships} →
              </Link>
              <Link href="/jobs" className="rounded-xl border-2 border-slate-200 bg-white px-7 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                {t.forPath.sectionJobs} →
              </Link>
            </div>
          </div>
        </section>

        {/* Sections — alternating layout */}
        <section className="mx-auto max-w-5xl px-4 pb-16">
          <div className="space-y-6">
            {sections.map(({ key, icon, href, gradient, bg, features }, i) => (
              <Link
                key={href}
                href={href}
                className={`group flex flex-col gap-6 rounded-3xl ${bg} p-8 transition hover:shadow-xl sm:flex-row sm:items-center ${i % 2 === 1 ? 'sm:flex-row-reverse' : ''}`}
              >
                {/* Visual element */}
                <div className={`flex h-28 w-28 shrink-0 items-center justify-center self-center rounded-3xl bg-gradient-to-br ${gradient} text-5xl shadow-lg transition group-hover:scale-105 sm:h-32 sm:w-32`}>
                  {icon}
                </div>

                {/* Content */}
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white sm:text-2xl">
                    {t.forPath[`section${key}`]}
                  </h3>
                  <p className="mt-2 leading-relaxed text-slate-500 dark:text-slate-400">
                    {t.forPath[`section${key}Desc`]}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {features.map(f => (
                      <span key={f} className="rounded-full bg-white/80 px-3 py-1 text-xs font-medium text-slate-600 shadow-sm dark:bg-slate-800 dark:text-slate-300">
                        {f}
                      </span>
                    ))}
                  </div>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand transition group-hover:gap-2">
                    Перейти
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Registration CTA */}
        {!isLoggedIn && (
          <section className="px-4 pb-16">
            <div className="mx-auto max-w-4xl">
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 p-10 text-center sm:p-14">
                <div className="pointer-events-none absolute inset-0">
                  <div className="absolute -right-20 -top-20 h-60 w-60 rounded-full bg-white/10 blur-3xl" />
                  <div className="absolute -bottom-20 -left-20 h-60 w-60 rounded-full bg-purple-400/10 blur-3xl" />
                </div>
                <div className="relative">
                  <h2 className="text-2xl font-bold text-white sm:text-3xl">
                    {t.forPath.whyRegister}
                  </h2>
                  <div className="mx-auto mt-6 grid max-w-lg gap-3 sm:grid-cols-2">
                    {[t.forPath.benefit1, t.forPath.benefit2, t.forPath.benefit3, t.forPath.benefit4].map((b, i) => (
                      <div key={i} className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-3 text-left text-sm text-white/90">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/20 text-xs">✓</span>
                        {b}
                      </div>
                    ))}
                  </div>
                  <Link
                    href="/profile"
                    className="mt-8 inline-flex rounded-xl bg-white px-8 py-3.5 text-sm font-bold text-indigo-700 shadow-lg transition hover:bg-indigo-50"
                  >
                    {t.forPath.ctaRegister}
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
