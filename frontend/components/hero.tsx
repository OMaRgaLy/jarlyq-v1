'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useLang } from '../lib/lang-context';

export function Hero() {
  const { t } = useLang();

  return (
    <section className="relative overflow-hidden rounded-3xl border border-slate-200/60 bg-gradient-to-br from-sky-50 via-white to-emerald-50 p-8 dark:border-slate-800/60 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900">
      <div className="relative z-10 grid gap-6 md:grid-cols-2 md:items-center">
        <div className="space-y-4">
          <span className="inline-flex items-center rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wider text-brand shadow-sm dark:bg-slate-900">
            {t.home.heroBadge}
          </span>
          <h1 className="text-3xl font-bold leading-tight text-slate-900 dark:text-slate-50 md:text-4xl">
            {t.home.heroTitle}
          </h1>
          <p className="text-base text-slate-700 dark:text-slate-300">
            {t.home.heroSubtitle}
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/career-paths"
              className="rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow transition hover:bg-brand-dark"
            >
              {t.home.heroCTA1}
            </Link>
            <Link
              href="/jobs"
              className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow transition hover:border-brand hover:text-brand dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              {t.home.heroCTA2}
            </Link>
          </div>
        </div>
        <div className="relative hidden h-72 md:block">
          <Image
            src="https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=900&q=80"
            alt={t.home.heroImageAlt}
            fill
            className="rounded-2xl object-cover shadow-lg"
            priority
          />
        </div>
      </div>
      <div className="absolute inset-0 -z-0 bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.15),_transparent_50%)]" />
    </section>
  );
}
