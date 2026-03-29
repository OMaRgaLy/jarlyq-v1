'use client';

import Link from 'next/link';
import { Header } from '../../../components/header';
import { Footer } from '../../../components/footer';
import { useLang } from '../../../lib/lang-context';
import { getToken } from '../../../lib/auth';

export default function ForStudentsPage() {
  const { t } = useLang();
  const isLoggedIn = !!getToken();

  const sections = [
    {
      key: 'Schools' as const, icon: '🏫', href: '/schools',
      gradient: 'from-emerald-500 to-green-600',
      bg: 'bg-emerald-50 dark:bg-emerald-950/30',
      features: ['Буткемпы', 'Онлайн/офлайн', 'С трудоустройством'],
    },
    {
      key: 'Universities' as const, icon: '🎓', href: '/schools?tab=universities',
      gradient: 'from-blue-500 to-indigo-600',
      bg: 'bg-blue-50 dark:bg-blue-950/30',
      features: ['IT-факультеты', 'Гос. гранты', 'Бакалавриат'],
    },
    {
      key: 'Masters' as const, icon: '🌍', href: '/masters',
      gradient: 'from-violet-500 to-purple-600',
      bg: 'bg-violet-50 dark:bg-violet-950/30',
      features: ['Европа & Азия', 'Стипендии', 'Дедлайны'],
    },
    {
      key: 'Partners' as const, icon: '📚', href: '/schools?tab=prep',
      gradient: 'from-amber-500 to-orange-600',
      bg: 'bg-amber-50 dark:bg-amber-950/30',
      features: ['ЕНТ / SAT / IELTS', 'Проверенные курсы', 'Подготовка'],
    },
    {
      key: 'CareerPaths' as const, icon: '🗺️', href: '/career-paths',
      gradient: 'from-rose-500 to-pink-600',
      bg: 'bg-rose-50 dark:bg-rose-950/30',
      features: ['Выбор направления', 'Пошаговый план', 'Материалы'],
    },
  ];

  const steps = [
    { num: '01', title: 'Определись с направлением', desc: 'Frontend, Backend, Data Science, Дизайн — выбери что ближе', icon: '🧭' },
    { num: '02', title: 'Найди где учиться', desc: 'Школы, буткемпы, университеты — сравни и выбери лучший вариант', icon: '🏫' },
    { num: '03', title: 'Начни обучение', desc: 'Записывайся на курсы, следуй карьерному треку, набирайся опыта', icon: '🚀' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-slate-950">
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden px-4 py-24">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -left-40 top-0 h-[500px] w-[500px] rounded-full bg-emerald-100/50 blur-3xl dark:bg-emerald-900/10" />
            <div className="absolute -right-40 bottom-0 h-[400px] w-[400px] rounded-full bg-teal-100/50 blur-3xl dark:bg-teal-900/10" />
          </div>

          <div className="relative mx-auto max-w-3xl text-center">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-1.5 text-sm font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
              🎓 Для школьников и студентов
            </div>
            <h1 className="text-4xl font-extrabold leading-tight text-slate-900 dark:text-white sm:text-5xl">
              {t.forPath.studentsTitle}
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-slate-500 dark:text-slate-400">
              {t.forPath.studentsSubtitle}
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link href="/schools" className="rounded-xl bg-slate-900 px-7 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100">
                {t.forPath.sectionSchools} →
              </Link>
              <Link href="/career-paths" className="rounded-xl border-2 border-slate-200 bg-white px-7 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                {t.forPath.sectionCareerPaths} →
              </Link>
            </div>
          </div>
        </section>

        {/* How it works — 3 steps */}
        <section className="border-y border-slate-200/70 bg-slate-50/80 px-4 py-14 dark:border-slate-800/60 dark:bg-slate-900/30">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-center text-xl font-bold text-slate-900 dark:text-white">Как начать?</h2>
            <div className="mt-10 grid gap-8 sm:grid-cols-3">
              {steps.map(s => (
                <div key={s.num} className="text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-3xl shadow-sm dark:bg-slate-800">
                    {s.icon}
                  </div>
                  <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{s.num}</div>
                  <h3 className="mt-1 font-bold text-slate-900 dark:text-white">{s.title}</h3>
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Sections — alternating layout */}
        <section className="mx-auto max-w-5xl px-4 py-16">
          <div className="space-y-6">
            {sections.map(({ key, icon, href, gradient, bg, features }, i) => (
              <Link
                key={href}
                href={href}
                className={`group flex flex-col gap-6 rounded-3xl ${bg} p-8 transition hover:shadow-xl sm:flex-row sm:items-center ${i % 2 === 1 ? 'sm:flex-row-reverse' : ''}`}
              >
                <div className={`flex h-28 w-28 shrink-0 items-center justify-center self-center rounded-3xl bg-gradient-to-br ${gradient} text-5xl shadow-lg transition group-hover:scale-105 sm:h-32 sm:w-32`}>
                  {icon}
                </div>
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
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-emerald-600 transition group-hover:gap-2 dark:text-emerald-400">
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
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 p-10 text-center sm:p-14">
                <div className="pointer-events-none absolute inset-0">
                  <div className="absolute -right-20 -top-20 h-60 w-60 rounded-full bg-white/10 blur-3xl" />
                  <div className="absolute -bottom-20 -left-20 h-60 w-60 rounded-full bg-emerald-300/10 blur-3xl" />
                </div>
                <div className="relative">
                  <h2 className="text-2xl font-bold text-white sm:text-3xl">{t.forPath.whyRegister}</h2>
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
                    className="mt-8 inline-flex rounded-xl bg-white px-8 py-3.5 text-sm font-bold text-emerald-700 shadow-lg transition hover:bg-emerald-50"
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
