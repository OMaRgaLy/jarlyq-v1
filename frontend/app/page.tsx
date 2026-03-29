'use client';

import { useEffect, useState } from 'react';
import { Header } from '../components/header';
import { Footer } from '../components/footer';
import { useLang } from '../lib/lang-context';
import Link from 'next/link';
import { getToken } from '../lib/auth';
import { api } from '../lib/api';
import type { Stack } from '../lib/api';

interface RecommendedCompany {
  id: number;
  name: string;
  logoURL?: string;
  industry?: string;
  stack?: Stack[];
}

export default function Page() {
  const { t } = useLang();
  const [recommended, setRecommended] = useState<RecommendedCompany[]>([]);
  const isLoggedIn = !!getToken();

  useEffect(() => {
    if (!getToken()) return;
    (async () => {
      try {
        const { data: stackData } = await api.get<{ stacks: Stack[] }>('/users/me/preferred-stacks');
        if (!stackData.stacks?.length) return;
        const stackIds = new Set(stackData.stacks.map(s => s.id));
        const { data: compData } = await api.get<{ companies: RecommendedCompany[] }>('/companies');
        const matched = (compData.companies ?? []).filter(c =>
          (c.stack ?? []).some(s => stackIds.has(s.id)),
        );
        setRecommended(matched.slice(0, 6));
      } catch { /* ignore */ }
    })();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-slate-950">
      <Header />

      <main className="flex-1">
        {/* ── Hero ── */}
        <section className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800 px-4 pb-36 pt-20 dark:from-slate-950 dark:to-slate-900">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-1/4 top-20 h-72 w-72 rounded-full bg-brand/8 blur-3xl" />
            <div className="absolute right-1/4 bottom-10 h-96 w-96 rounded-full bg-purple-500/6 blur-3xl" />
          </div>

          <div className="relative mx-auto max-w-4xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand/10 px-4 py-1.5 text-sm font-medium text-brand-light">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-brand" />
              </span>
              Where talents meet opportunities
            </div>

            <h1 className="text-5xl font-extrabold leading-[1.1] tracking-tight text-white sm:text-6xl md:text-7xl">
              Jarlyq
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-300 sm:text-xl">
              {t.landing.heroDesc}
            </p>

            <p className="mx-auto mt-3 max-w-xl text-base text-slate-400">
              {t.landing.heroSubDesc}
            </p>
          </div>
        </section>

        {/* ── Two Paths ── */}
        <section className="relative -mt-20 px-4 pb-16">
          <div className="mx-auto grid max-w-5xl gap-6 sm:grid-cols-2">

            {/* Path: Job Seekers */}
            <Link
              href="/for/job-seekers"
              className="group relative overflow-hidden rounded-3xl border border-slate-200/50 bg-white p-7 shadow-xl transition hover:-translate-y-1 hover:shadow-2xl dark:border-slate-700/50 dark:bg-slate-900 sm:p-9"
            >
              <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br from-brand/20 to-purple-500/20 blur-2xl transition-all group-hover:scale-150" />
              <div className="relative">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand to-indigo-600 text-2xl shadow-lg">
                  💼
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white sm:text-2xl">
                  {t.landing.pathJobTitle}
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-slate-500 dark:text-slate-400 sm:text-base">
                  {t.landing.pathJobDesc}
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {t.landing.pathJobTags.split(',').map(tag => (
                    <span key={tag} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-brand transition group-hover:gap-3">
                  {t.forPath.browseOpportunities}
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                </div>
              </div>
            </Link>

            {/* Path: Students */}
            <Link
              href="/for/students"
              className="group relative overflow-hidden rounded-3xl border border-slate-200/50 bg-white p-7 shadow-xl transition hover:-translate-y-1 hover:shadow-2xl dark:border-slate-700/50 dark:bg-slate-900 sm:p-9"
            >
              <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-500/20 blur-2xl transition-all group-hover:scale-150" />
              <div className="relative">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-2xl shadow-lg">
                  🎓
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white sm:text-2xl">
                  {t.landing.pathStudentTitle}
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-slate-500 dark:text-slate-400 sm:text-base">
                  {t.landing.pathStudentDesc}
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {t.landing.pathStudentTags.split(',').map(tag => (
                    <span key={tag} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-emerald-600 transition group-hover:gap-3 dark:text-emerald-400">
                  {t.forPath.startExploring}
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                </div>
              </div>
            </Link>
          </div>
        </section>

        {/* ── What makes Jarlyq different ── */}
        <section className="border-y border-slate-200/70 bg-slate-50/80 px-4 py-14 dark:border-slate-800/60 dark:bg-slate-900/30">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-center text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">
              {t.landing.valueTitle}
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-center text-slate-500 dark:text-slate-400">
              {t.landing.valueDesc}
            </p>
            <div className="mt-10 grid gap-6 sm:grid-cols-3">
              {[
                { icon: '🎯', title: t.landing.feat1Title, desc: t.landing.feat1Desc },
                { icon: '🏢', title: t.landing.feat2Title, desc: t.landing.feat2Desc },
                { icon: '🗺️', title: t.landing.feat3Title, desc: t.landing.feat3Desc },
              ].map(f => (
                <div key={f.title} className="rounded-2xl bg-white p-6 shadow-sm dark:bg-slate-800/50">
                  <div className="mb-3 text-2xl">{f.icon}</div>
                  <h3 className="font-bold text-slate-900 dark:text-white">{f.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── For You (personalized) ── */}
        {recommended.length > 0 && (
          <section className="px-4 py-14">
            <div className="mx-auto max-w-5xl">
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">{t.home.forYouTitle}</h2>
              <p className="mt-1 text-sm text-slate-500">{t.home.forYouSub}</p>
              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {recommended.map(c => (
                  <Link
                    key={c.id}
                    href={`/companies/${c.id}`}
                    className="flex items-center gap-3 rounded-xl border border-slate-200/70 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-md dark:border-slate-800/60 dark:bg-slate-900"
                  >
                    {c.logoURL ? (
                      <img src={c.logoURL} alt={c.name} className="h-10 w-10 rounded-lg object-cover" />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand/10 text-brand font-bold">
                        {c.name[0]}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-slate-900 dark:text-white">{c.name}</p>
                      {c.industry && <p className="truncate text-xs text-slate-400">{c.industry}</p>}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── CTA: Registration ── */}
        {!isLoggedIn && (
          <section className="px-4 py-14">
            <div className="mx-auto max-w-4xl">
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-10 sm:p-14">
                <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-brand/15 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-purple-500/10 blur-3xl" />
                <div className="relative sm:flex sm:items-center sm:gap-10">
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-white sm:text-3xl">{t.landing.ctaTitle}</h2>
                    <p className="mt-3 text-sm leading-relaxed text-slate-300">
                      {t.landing.ctaDesc}
                    </p>
                  </div>
                  <div className="mt-6 shrink-0 sm:mt-0">
                    <Link
                      href="/auth"
                      className="inline-flex rounded-xl bg-white px-8 py-3.5 text-sm font-bold text-slate-900 shadow-lg transition hover:bg-slate-100"
                    >
                      {t.landing.ctaButton}
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ── Stats ── */}
        <section className="border-y border-slate-200/70 dark:border-slate-800/60">
          <div className="mx-auto grid max-w-4xl grid-cols-2 md:grid-cols-4">
            {[
              { num: t.home.stat1Num, label: t.home.stat1Label },
              { num: t.home.stat2Num, label: t.home.stat2Label },
              { num: t.home.stat3Num, label: t.home.stat3Label },
              { num: 'AI', label: t.home.stat4Label },
            ].map((s, i) => (
              <div key={s.label} className={`flex flex-col items-center py-8 text-center ${i > 0 ? 'border-l border-slate-200/70 dark:border-slate-800/60' : ''}`}>
                <span className="text-3xl font-extrabold text-brand">{s.num}</span>
                <span className="mt-1 text-xs text-slate-500 dark:text-slate-400">{s.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── AI teaser ── */}
        <section className="px-4 py-14">
          <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200/70 bg-gradient-to-br from-brand/5 to-purple-500/5 p-10 text-center dark:border-slate-800/60">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand/10 to-purple-500/10 text-3xl">
              🤖
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50">{t.landing.aiTitle}</h2>
            <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-slate-500 dark:text-slate-400">
              {t.landing.aiDesc}
            </p>
            <span className="mt-5 inline-block rounded-full border border-brand/20 bg-brand/5 px-4 py-1.5 text-xs font-semibold text-brand">
              {t.landing.aiSoon}
            </span>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
