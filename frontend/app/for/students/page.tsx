'use client';

import Link from 'next/link';
import { Header } from '../../../components/header';
import { Footer } from '../../../components/footer';
import { useLang } from '../../../lib/lang-context';
import { getToken } from '../../../lib/auth';

const sections = [
  { key: 'Schools', icon: '🏫', href: '/schools', color: 'bg-emerald-50 dark:bg-emerald-900/20' },
  { key: 'Universities', icon: '🎓', href: '/schools?tab=universities', color: 'bg-blue-50 dark:bg-blue-900/20' },
  { key: 'Masters', icon: '🌍', href: '/masters', color: 'bg-violet-50 dark:bg-violet-900/20' },
  { key: 'Partners', icon: '📚', href: '/schools?tab=prep', color: 'bg-amber-50 dark:bg-amber-900/20' },
  { key: 'CareerPaths', icon: '🗺️', href: '/career-paths', color: 'bg-purple-50 dark:bg-purple-900/20' },
] as const;

export default function ForStudentsPage() {
  const { t } = useLang();
  const isLoggedIn = !!getToken();

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-slate-950">
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-br from-emerald-600 via-teal-700 to-cyan-800 px-4 py-20 text-center">
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="h-[400px] w-[600px] rounded-full bg-white/5 blur-3xl" />
          </div>
          <div className="relative mx-auto max-w-3xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm font-medium text-white/90">
              🎓 {t.forPath.sectionSchools} & {t.forPath.sectionUniversities}
            </div>
            <h1 className="text-3xl font-extrabold text-white sm:text-4xl md:text-5xl">
              {t.forPath.studentsTitle}
            </h1>
            <p className="mt-4 text-lg text-emerald-100/80">
              {t.forPath.studentsSubtitle}
            </p>
          </div>
        </section>

        {/* How it works — simple 3-step */}
        <section className="border-b border-slate-200/70 bg-slate-50 px-4 py-10 dark:border-slate-800/60 dark:bg-slate-900/40">
          <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-8 text-center">
            {[
              { step: '1', text: 'Выбери направление' },
              { step: '2', text: 'Найди школу или ВУЗ' },
              { step: '3', text: 'Начни обучение' },
            ].map((s) => (
              <div key={s.step} className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand text-sm font-bold text-white">
                  {s.step}
                </div>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{s.text}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Sections grid */}
        <section className="mx-auto max-w-5xl px-4 py-14">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {sections.map(({ key, icon, href, color }) => (
              <Link
                key={href}
                href={href}
                className={`group flex flex-col gap-3 rounded-2xl border border-slate-200/70 ${color} p-6 transition hover:-translate-y-1 hover:shadow-lg dark:border-slate-700/60`}
              >
                <div className="text-3xl">{icon}</div>
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-brand dark:text-white">
                  {t.forPath[`section${key}` as keyof typeof t.forPath]}
                </h3>
                <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                  {t.forPath[`section${key}Desc` as keyof typeof t.forPath]}
                </p>
                <span className="mt-auto text-sm font-medium text-brand">
                  {t.forPath.orBrowse} →
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* Registration CTA */}
        {!isLoggedIn && (
          <section className="bg-slate-50 px-4 py-14 dark:bg-slate-900/40">
            <div className="mx-auto max-w-3xl rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 p-10 text-center ring-1 ring-emerald-500/20">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                {t.forPath.whyRegister}
              </h2>
              <ul className="mx-auto mt-6 max-w-md space-y-3 text-left text-sm text-slate-600 dark:text-slate-300">
                {[t.forPath.benefit1, t.forPath.benefit2, t.forPath.benefit3, t.forPath.benefit4].map((b, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="mt-0.5 text-emerald-500">✓</span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-8">
                <Link
                  href="/profile"
                  className="rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-lg hover:bg-emerald-700"
                >
                  {t.forPath.ctaRegister}
                </Link>
              </div>
              <p className="mt-3 text-xs text-slate-400">{t.forPath.ctaRegisterDesc}</p>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}
