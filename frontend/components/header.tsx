'use client';

import Link from 'next/link';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { SunIcon, MoonIcon } from '@radix-ui/react-icons';

export function Header() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return (
    <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur border-b border-slate-200/60 dark:border-slate-800/60">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-xl font-bold text-brand">
          Jarlyq
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300 md:flex">
          <Link href="#companies" className="hover:text-brand">
            Компании
          </Link>
          <Link href="#schools" className="hover:text-brand">
            Школы
          </Link>
          <Link href="#opportunities" className="hover:text-brand">
            Вакансии
          </Link>
          <Link href="#certificates" className="hover:text-brand">
            Проверка сертификата
          </Link>
        </nav>
        <button
          type="button"
          aria-label="Сменить тему"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="rounded-full border border-slate-200/70 dark:border-slate-700/60 bg-white/50 dark:bg-slate-900/60 p-2 shadow-sm hover:shadow"
        >
          {mounted && theme === 'dark' ? <SunIcon /> : <MoonIcon />}
        </button>
      </div>
    </header>
  );
}
