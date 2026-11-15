'use client';

import Link from 'next/link';
import { useLang } from '../lib/lang-context';

export function Footer() {
  const { t } = useLang();
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-6 text-sm text-slate-500 sm:flex-row">
        <p>© {year} Jarlyq. {t.home.footer}</p>
        <nav className="flex items-center gap-5">
          <Link href="/internships" className="hover:text-slate-900">{t.nav.internships}</Link>
          <Link href="/companies" className="hover:text-slate-900">{t.nav.companies}</Link>
          <Link href="/schools" className="hover:text-slate-900">{t.nav.schools}</Link>
          <Link href="/legal" className="hover:text-slate-900">{t.legal.title}</Link>
        </nav>
      </div>
    </footer>
  );
}
