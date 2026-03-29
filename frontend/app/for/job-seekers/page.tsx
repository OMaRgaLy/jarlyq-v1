'use client';

import Link from 'next/link';
import { Header } from '../../../components/header';
import { Footer } from '../../../components/footer';
import { useLang } from '../../../lib/lang-context';
import { getToken } from '../../../lib/auth';

const sections = [
  { key: 'Internships', icon: '🔍', href: '/internships', color: 'bg-indigo-50 dark:bg-indigo-900/20' },
  { key: 'Jobs', icon: '💼', href: '/jobs', color: 'bg-emerald-50 dark:bg-emerald-900/20' },
  { key: 'CareerPaths', icon: '🗺️', href: '/career-paths', color: 'bg-purple-50 dark:bg-purple-900/20' },
  { key: 'Companies', icon: '🏢', href: '/companies', color: 'bg-sky-50 dark:bg-sky-900/20' },
  { key: 'Interview', icon: '🎯', href: '/interview', color: 'bg-amber-50 dark:bg-amber-900/20' },
] as const;

export default function ForJobSeekersPage() {
  const { t } = useLang();
  const isLoggedIn = !!getToken();

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-slate-950">
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 px-4 py-20 text-center">
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="h-[400px] w-[600px] rounded-full bg-white/5 blur-3xl" />
          </div>
          <div className="relative mx-auto max-w-3xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm font-medium text-white/90">
              💼 {t.forPath.sectionJobs} & {t.forPath.sectionInternships}
            </div>
            <h1 className="text-3xl font-extrabold text-white sm:text-4xl md:text-5xl">
              {t.forPath.jobSeekersTitle}
            </h1>
            <p className="mt-4 text-lg text-indigo-100/80">
              {t.forPath.jobSeekersSubtitle}
            </p>
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
            <div className="mx-auto max-w-3xl rounded-2xl bg-gradient-to-br from-brand/10 to-purple-500/10 p-10 text-center ring-1 ring-brand/20">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                {t.forPath.whyRegister}
              </h2>
              <ul className="mx-auto mt-6 max-w-md space-y-3 text-left text-sm text-slate-600 dark:text-slate-300">
                {[t.forPath.benefit1, t.forPath.benefit2, t.forPath.benefit3, t.forPath.benefit4].map((b, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="mt-0.5 text-brand">✓</span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <Link
                  href="/profile"
                  className="rounded-xl bg-brand px-6 py-3 text-sm font-semibold text-white shadow-lg hover:bg-brand-dark"
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
