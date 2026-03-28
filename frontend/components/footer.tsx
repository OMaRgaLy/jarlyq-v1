'use client';

import Link from 'next/link';
import { useLang } from '../lib/lang-context';

export function Footer() {
  const { t } = useLang();

  return (
    <footer className="mt-auto border-t border-slate-200/70 bg-white/80 py-8 dark:border-slate-800/60 dark:bg-slate-950/80">
      <div className="mx-auto max-w-5xl px-4">
        <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:justify-between sm:text-left">
          <div>
            <span className="text-base font-bold text-brand">Jarlyq</span>
            <p className="mt-1 text-xs text-slate-400">{t.home.footer}</p>
          </div>
          <div className="flex flex-wrap justify-center gap-x-5 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
            <Link href="/internships" className="hover:text-brand">{t.nav.internships}</Link>
            <Link href="/jobs" className="hover:text-brand">{t.nav.jobs}</Link>
            <Link href="/companies" className="hover:text-brand">{t.nav.companies}</Link>
            <Link href="/schools" className="hover:text-brand">{t.nav.schools}</Link>
            <Link href="/masters" className="hover:text-brand">{t.nav.masters}</Link>
            <Link href="/career-paths" className="hover:text-brand">{t.nav.careerPaths}</Link>
            <Link href="/hackathons" className="hover:text-brand">{t.nav.hackathons}</Link>
            <Link href="/interview" className="hover:text-brand">{t.nav.interview}</Link>
            <Link href="/legal" className="hover:text-brand">{t.legal.title}</Link>
          </div>
        </div>
        <p className="mt-6 text-center text-xs text-slate-400">&copy; {new Date().getFullYear()} Jarlyq.</p>
      </div>
    </footer>
  );
}
