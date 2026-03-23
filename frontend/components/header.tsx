'use client';

import Link from 'next/link';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { SunIcon, MoonIcon, HamburgerMenuIcon, Cross1Icon, PersonIcon } from '@radix-ui/react-icons';
import { AuthModal } from './auth-modal';
import { getUser, clearAuth, AuthUser } from '../lib/auth';

const navLinks = [
  { href: '/jobs', label: 'Вакансии' },
  { href: '/career-paths', label: 'Карьерные пути' },
  { href: '/interview', label: 'Собеседования' },
  { href: '/project-ideas', label: 'Портфолио' },
  { href: '/#companies', label: 'Компании' },
  { href: '/#schools', label: 'Школы' },
];

export function Header() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    setMounted(true);
    setUser(getUser());
  }, []);

  const handleLogout = () => {
    clearAuth();
    setUser(null);
  };

  const handleAuthSuccess = () => {
    setShowAuth(false);
    setUser(getUser());
  };

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-slate-200/60 bg-white/80 backdrop-blur dark:border-slate-800/60 dark:bg-slate-950/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link href="/" className="text-xl font-bold text-brand">
            Jarlyq
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300 md:flex">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} className="hover:text-brand">
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {/* Theme toggle */}
            <button
              type="button"
              aria-label="Сменить тему"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="rounded-full border border-slate-200/70 bg-white/50 p-2 shadow-sm hover:shadow dark:border-slate-700/60 dark:bg-slate-900/60"
            >
              {mounted && theme === 'dark' ? <SunIcon /> : <MoonIcon />}
            </button>

            {/* Auth button */}
            {mounted && (
              user ? (
                <div className="relative hidden md:block">
                  <button
                    className="flex items-center gap-2 rounded-full border border-slate-200/70 bg-white/50 px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm hover:shadow dark:border-slate-700/60 dark:bg-slate-900/60 dark:text-slate-200"
                    onClick={handleLogout}
                    title="Выйти"
                  >
                    <PersonIcon />
                    <span>{user.first_name}</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowAuth(true)}
                  className="hidden rounded-full border border-slate-200/70 bg-white/50 px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm hover:border-brand hover:text-brand dark:border-slate-700/60 dark:bg-slate-900/60 dark:text-slate-200 md:flex"
                >
                  Войти
                </button>
              )
            )}

            {/* Mobile hamburger */}
            <button
              type="button"
              aria-label={menuOpen ? 'Закрыть меню' : 'Открыть меню'}
              onClick={() => setMenuOpen((v) => !v)}
              className="rounded-full border border-slate-200/70 bg-white/50 p-2 shadow-sm hover:shadow dark:border-slate-700/60 dark:bg-slate-900/60 md:hidden"
            >
              {menuOpen ? <Cross1Icon /> : <HamburgerMenuIcon />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="border-t border-slate-200/60 bg-white/95 dark:border-slate-800/60 dark:bg-slate-950/95 md:hidden">
            <nav className="flex flex-col gap-1 px-4 py-3">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-brand dark:text-slate-300 dark:hover:bg-slate-900"
                >
                  {link.label}
                </Link>
              ))}
              {mounted && (
                user ? (
                  <button
                    onClick={() => { handleLogout(); setMenuOpen(false); }}
                    className="rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-500 hover:bg-slate-100"
                  >
                    Выйти ({user.first_name})
                  </button>
                ) : (
                  <button
                    onClick={() => { setShowAuth(true); setMenuOpen(false); }}
                    className="rounded-lg px-3 py-2.5 text-left text-sm font-medium text-brand hover:bg-brand/5"
                  >
                    Войти
                  </button>
                )
              )}
            </nav>
          </div>
        )}
      </header>

      {showAuth && (
        <AuthModal
          onClose={() => setShowAuth(false)}
          onSuccess={handleAuthSuccess}
        />
      )}
    </>
  );
}
