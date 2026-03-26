'use client';

import Link from 'next/link';
import { useTheme } from 'next-themes';
import { useEffect, useRef, useState } from 'react';
import {
  SunIcon, MoonIcon, HamburgerMenuIcon, Cross1Icon,
  PersonIcon, MagnifyingGlassIcon, ChevronDownIcon,
} from '@radix-ui/react-icons';
import { AuthModal } from './auth-modal';
import { getUser, clearAuth, AuthUser } from '../lib/auth';
import { useLang } from '../lib/lang-context';
import { LOCALES, Locale } from '../lib/i18n';

// ─── Nav groups ──────────────────────────────────────────────────────────────

function useNavGroups() {
  const { t } = useLang();
  return [
    {
      label: t.nav.groupWork,
      items: [
        { href: '/internships', label: t.nav.internships },
        { href: '/jobs', label: t.nav.jobs },
      ],
    },
    {
      label: t.nav.companies,
      href: '/companies',
    },
    {
      label: t.nav.groupPrep,
      items: [
        { href: '/career-paths', label: t.nav.careerPaths },
        { href: '/schools', label: t.nav.schools },
        { href: '/interview', label: t.nav.interview },
        { href: '/hackathons', label: t.nav.hackathons },
      ],
    },
  ] as const;
}

// ─── Desktop dropdown ─────────────────────────────────────────────────────────

function NavDropdown({ label, items }: { label: string; items: readonly { href: string; label: string }[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-brand dark:text-slate-300 dark:hover:bg-slate-800"
      >
        {label}
        <ChevronDownIcon className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 min-w-[180px] rounded-xl border border-slate-200/70 bg-white py-1 shadow-lg dark:border-slate-700/60 dark:bg-slate-900">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-brand dark:text-slate-200 dark:hover:bg-slate-800"
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main header ──────────────────────────────────────────────────────────────

export function Header() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpenGroup, setMobileOpenGroup] = useState<number | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const { t, locale, setLocale } = useLang();
  const navGroups = useNavGroups();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    setMounted(true);
    setUser(getUser());
  }, []);

  // Close mobile menu on resize to desktop
  useEffect(() => {
    const handler = () => { if (window.innerWidth >= 768) setMenuOpen(false); };
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  const handleLogout = () => { clearAuth(); setUser(null); };
  const handleAuthSuccess = () => { setShowAuth(false); setUser(getUser()); };

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-slate-200/60 bg-white/90 backdrop-blur dark:border-slate-800/60 dark:bg-slate-950/90">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">

          {/* ── Logo (flex-none, never moves) ── */}
          <Link href="/" className="flex-none text-xl font-bold text-brand">
            Jarlyq
          </Link>

          {/* ── Desktop nav (flex-1, centered) ── */}
          <nav className="hidden flex-1 items-center justify-center gap-1 md:flex">
            {navGroups.map((group) =>
              'href' in group ? (
                <Link
                  key={group.href}
                  href={group.href}
                  className="whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-brand dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  {group.label}
                </Link>
              ) : (
                <NavDropdown key={group.label} label={group.label} items={group.items} />
              )
            )}
          </nav>

          {/* ── Right actions (flex-none, fixed min-width = no layout shift) ── */}
          <div className="flex flex-none items-center justify-end gap-1.5 md:min-w-[220px]">

            {/* Lang switcher — desktop only */}
            {mounted && (
              <div className="hidden items-center gap-0.5 rounded-lg border border-slate-200/70 bg-slate-50 p-0.5 dark:border-slate-700/60 dark:bg-slate-900/60 md:flex">
                {LOCALES.map((loc) => (
                  <button
                    key={loc.code}
                    type="button"
                    onClick={() => setLocale(loc.code as Locale)}
                    className={`min-w-[2.25rem] rounded-md px-2 py-1 text-center text-xs font-medium transition-colors ${
                      locale === loc.code
                        ? 'bg-brand text-white'
                        : 'text-slate-500 hover:text-brand dark:text-slate-400'
                    }`}
                  >
                    {loc.label}
                  </button>
                ))}
              </div>
            )}

            {/* Search */}
            <Link
              href="/search"
              aria-label={t.nav.search}
              className="rounded-full border border-slate-200/70 bg-white/50 p-2 text-slate-500 shadow-sm hover:text-brand hover:shadow dark:border-slate-700/60 dark:bg-slate-900/60"
            >
              <MagnifyingGlassIcon />
            </Link>

            {/* Theme toggle */}
            <button
              type="button"
              aria-label="Toggle theme"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="rounded-full border border-slate-200/70 bg-white/50 p-2 text-slate-500 shadow-sm hover:text-brand hover:shadow dark:border-slate-700/60 dark:bg-slate-900/60"
            >
              {mounted && theme === 'dark' ? <SunIcon /> : <MoonIcon />}
            </button>

            {/* Auth — desktop */}
            {mounted && (
              user ? (
                <div className="relative hidden md:block" ref={userMenuRef}>
                  <button
                    onClick={() => setUserMenuOpen((v) => !v)}
                    className="flex items-center gap-1.5 rounded-full border border-slate-200/70 bg-white/50 px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm hover:shadow dark:border-slate-700/60 dark:bg-slate-900/60 dark:text-slate-200"
                  >
                    <PersonIcon />
                    <span className="max-w-[80px] truncate">{user.first_name}</span>
                    <ChevronDownIcon className={`transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {userMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-48 rounded-xl border border-slate-200/70 bg-white py-1 shadow-lg dark:border-slate-700/60 dark:bg-slate-900">
                      <Link href="/profile" onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800">
                        <PersonIcon /> {t.nav.myProfile}
                      </Link>
                      <Link href={`/users/${user.id}`} onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800">
                        🌐 {t.nav.publicProfile}
                      </Link>
                      <Link href="/suggest" onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-brand hover:bg-brand/5">
                        + {t.nav.suggest}
                      </Link>
                      <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
                      <button onClick={() => { handleLogout(); setUserMenuOpen(false); }}
                        className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">
                        {t.nav.logout}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => setShowAuth(true)}
                  className="hidden rounded-full border border-slate-200/70 bg-white/50 px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm hover:border-brand hover:text-brand dark:border-slate-700/60 dark:bg-slate-900/60 dark:text-slate-200 md:flex"
                >
                  {t.nav.login}
                </button>
              )
            )}

            {/* Mobile hamburger */}
            <button
              type="button"
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              onClick={() => setMenuOpen((v) => !v)}
              className="rounded-full border border-slate-200/70 bg-white/50 p-2 shadow-sm hover:shadow dark:border-slate-700/60 dark:bg-slate-900/60 md:hidden"
            >
              {menuOpen ? <Cross1Icon /> : <HamburgerMenuIcon />}
            </button>
          </div>
        </div>

        {/* ── Mobile menu ── */}
        {menuOpen && (
          <div className="border-t border-slate-200/60 bg-white dark:border-slate-800/60 dark:bg-slate-950 md:hidden">
            <div className="flex flex-col divide-y divide-slate-100 dark:divide-slate-800">

              {/* Nav groups accordion */}
              {navGroups.map((group, i) =>
                'href' in group ? (
                  <Link
                    key={group.href}
                    href={group.href}
                    onClick={() => setMenuOpen(false)}
                    className="px-5 py-3.5 text-sm font-medium text-slate-700 hover:text-brand dark:text-slate-200"
                  >
                    {group.label}
                  </Link>
                ) : (
                  <div key={group.label}>
                    <button
                      type="button"
                      onClick={() => setMobileOpenGroup(mobileOpenGroup === i ? null : i)}
                      className="flex w-full items-center justify-between px-5 py-3.5 text-sm font-medium text-slate-700 dark:text-slate-200"
                    >
                      {group.label}
                      <ChevronDownIcon className={`transition-transform ${mobileOpenGroup === i ? 'rotate-180' : ''}`} />
                    </button>
                    {mobileOpenGroup === i && (
                      <div className="bg-slate-50 dark:bg-slate-900">
                        {group.items.map((item) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setMenuOpen(false)}
                            className="block px-8 py-2.5 text-sm text-slate-600 hover:text-brand dark:text-slate-300"
                          >
                            {item.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                )
              )}

              {/* Lang + auth row */}
              <div className="flex items-center justify-between px-5 py-3">
                <div className="flex gap-1">
                  {LOCALES.map((loc) => (
                    <button
                      key={loc.code}
                      type="button"
                      onClick={() => { setLocale(loc.code as Locale); setMenuOpen(false); }}
                      className={`min-w-[2.25rem] rounded-md px-2.5 py-1 text-center text-xs font-medium transition-colors ${
                        locale === loc.code
                          ? 'bg-brand text-white'
                          : 'border border-slate-200 text-slate-500 dark:border-slate-700 dark:text-slate-400'
                      }`}
                    >
                      {loc.label}
                    </button>
                  ))}
                </div>

                {mounted && (
                  user ? (
                    <div className="flex items-center gap-2">
                      <Link href="/profile" onClick={() => setMenuOpen(false)}
                        className="text-sm font-medium text-slate-700 dark:text-slate-200">
                        {user.first_name}
                      </Link>
                      <button onClick={() => { handleLogout(); setMenuOpen(false); }}
                        className="text-sm text-red-500">
                        {t.nav.logout}
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setShowAuth(true); setMenuOpen(false); }}
                      className="rounded-full bg-brand px-4 py-1.5 text-sm font-medium text-white"
                    >
                      {t.nav.login}
                    </button>
                  )
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      {showAuth && (
        <AuthModal onClose={() => setShowAuth(false)} onSuccess={handleAuthSuccess} />
      )}
    </>
  );
}
