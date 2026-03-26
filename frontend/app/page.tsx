'use client';

import { Header } from '../components/header';
import { useLang } from '../lib/lang-context';
import Link from 'next/link';

export default function Page() {
  const { t } = useLang();

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <Header />

      <main>
        {/* ── Hero ── */}
        <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4 py-24 text-center dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
          {/* Background glow */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="h-[500px] w-[700px] rounded-full bg-brand/10 blur-3xl" />
          </div>

          <div className="relative mx-auto max-w-3xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand/10 px-4 py-1.5 text-sm font-medium text-brand">
              🌍 Where talents meet opportunities
            </div>
            <h1 className="mt-4 text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl md:text-6xl">
              Jarlyq
            </h1>
            <p className="mt-4 text-lg text-slate-300 sm:text-xl">
              {t.home.heroSubtitle}
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/internships"
                className="rounded-xl bg-brand px-6 py-3 text-sm font-semibold text-white shadow-lg hover:bg-brand-dark"
              >
                {t.home.heroCTA1}
              </Link>
              <Link
                href="/companies"
                className="rounded-xl border border-slate-600 bg-white/5 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10"
              >
                {t.home.heroCTA2}
              </Link>
            </div>
          </div>
        </section>

        {/* ── Stats ── */}
        <section className="border-b border-slate-200/70 bg-slate-50 dark:border-slate-800/60 dark:bg-slate-900/40">
          <div className="mx-auto grid max-w-4xl grid-cols-2 divide-x divide-y divide-slate-200/70 dark:divide-slate-800/60 md:grid-cols-4 md:divide-y-0">
            {[
              { num: t.home.stat1Num, label: t.home.stat1Label },
              { num: t.home.stat2Num, label: t.home.stat2Label },
              { num: t.home.stat3Num, label: t.home.stat3Label },
              { num: 'AI', label: t.home.stat4Label },
            ].map((s) => (
              <div key={s.label} className="flex flex-col items-center py-6 text-center">
                <span className="text-2xl font-extrabold text-brand">{s.num}</span>
                <span className="mt-1 text-xs text-slate-500 dark:text-slate-400">{s.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── What we help with ── */}
        <section className="px-4 py-16">
          <div className="mx-auto max-w-5xl">
            <h2 className="text-center text-2xl font-bold text-slate-900 dark:text-slate-50 sm:text-3xl">
              {t.home.featTitle}
            </h2>
            <div className="mt-10 grid gap-6 sm:grid-cols-3">
              {[
                { icon: '🔍', title: t.home.feat1Title, desc: t.home.feat1Desc, href: '/internships' },
                { icon: '🏢', title: t.home.feat2Title, desc: t.home.feat2Desc, href: '/companies' },
                { icon: '🗺️', title: t.home.feat3Title, desc: t.home.feat3Desc, href: '/career-paths' },
              ].map((f) => (
                <Link
                  key={f.href}
                  href={f.href}
                  className="group rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-brand/40 hover:shadow-md dark:border-slate-800/60 dark:bg-slate-900"
                >
                  <div className="mb-3 text-3xl">{f.icon}</div>
                  <h3 className="text-base font-semibold text-slate-900 group-hover:text-brand dark:text-slate-50">
                    {f.title}
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{f.desc}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ── Choose your path ── */}
        <section className="bg-slate-50 px-4 py-16 dark:bg-slate-900/40">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-center text-2xl font-bold text-slate-900 dark:text-slate-50 sm:text-3xl">
              {t.home.pathTitle}
            </h2>
            <div className="mt-10 grid gap-6 sm:grid-cols-2">
              <div className="flex flex-col justify-between rounded-2xl border border-slate-200/70 bg-white p-8 shadow-sm dark:border-slate-800/60 dark:bg-slate-900">
                <div>
                  <div className="mb-3 text-4xl">🔍</div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-slate-50">{t.home.path1Label}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{t.home.path1Desc}</p>
                </div>
                <Link
                  href="/internships"
                  className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark"
                >
                  {t.home.path1CTA}
                </Link>
              </div>

              <div className="flex flex-col justify-between rounded-2xl border border-slate-200/70 bg-white p-8 shadow-sm dark:border-slate-800/60 dark:bg-slate-900">
                <div>
                  <div className="mb-3 text-4xl">🎓</div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-slate-50">{t.home.path2Label}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{t.home.path2Desc}</p>
                </div>
                <Link
                  href="/schools"
                  className="mt-6 inline-flex w-full items-center justify-center rounded-xl border border-brand px-5 py-2.5 text-sm font-semibold text-brand hover:bg-brand/5 dark:hover:bg-brand/10"
                >
                  {t.home.path2CTA}
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── AI teaser ── */}
        <section className="px-4 py-16">
          <div className="mx-auto max-w-3xl rounded-2xl bg-gradient-to-br from-brand/10 to-purple-500/10 p-10 text-center ring-1 ring-brand/20 dark:ring-brand/10">
            <div className="mb-3 text-4xl">🤖</div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50">AI Career Consultant</h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
              Скоро: персональный карьерный консультант на базе Claude AI — посоветует куда подать заявку, какие навыки подтянуть, проверит резюме и сравнит с требованиями компании.
            </p>
            <span className="mt-5 inline-block rounded-full border border-brand/30 bg-brand/5 px-4 py-1.5 text-xs font-semibold text-brand">
              Coming soon
            </span>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-slate-200/70 bg-white/80 py-8 dark:border-slate-800/60 dark:bg-slate-950/80">
        <div className="mx-auto max-w-5xl px-4">
          <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:justify-between sm:text-left">
            <div>
              <span className="text-base font-bold text-brand">Jarlyq</span>
              <p className="mt-1 text-xs text-slate-400">{t.home.footer}</p>
            </div>
            <div className="flex flex-wrap justify-center gap-x-5 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
              <Link href="/internships" className="hover:text-brand">{t.nav.internships}</Link>
              <Link href="/companies" className="hover:text-brand">{t.nav.companies}</Link>
              <Link href="/career-paths" className="hover:text-brand">{t.nav.careerPaths}</Link>
              <Link href="/hackathons" className="hover:text-brand">{t.nav.hackathons}</Link>
              <Link href="/legal" className="hover:text-brand">{t.legal.title}</Link>
            </div>
          </div>
          <p className="mt-6 text-center text-xs text-slate-400">© {new Date().getFullYear()} Jarlyq.</p>
        </div>
      </footer>
    </div>
  );
}
