'use client';

import Link from 'next/link';
import { useLang } from '../lib/lang-context';

export function Footer() {
  const { t } = useLang();
  const year = new Date().getFullYear();

  const sections = [
    {
      title: t.nav.opportunities ?? 'Возможности',
      links: [
        { href: '/internships', label: t.nav.internships },
        { href: '/jobs', label: t.nav.jobs },
        { href: '/companies', label: t.nav.companies },
        { href: '/hackathons', label: t.nav.hackathons },
      ],
    },
    {
      title: t.nav.learning ?? 'Обучение',
      links: [
        { href: '/schools', label: t.nav.schools },
        { href: '/masters', label: t.nav.masters },
        { href: '/career-paths', label: t.nav.careerPaths },
        { href: '/interview', label: t.nav.interview },
        { href: '/project-ideas', label: t.nav.projectIdeas ?? 'Идеи проектов' },
      ],
    },
    {
      title: t.nav.platform ?? 'Платформа',
      links: [
        { href: '/suggest', label: t.nav.suggest },
        { href: '/search', label: t.nav.search },
        { href: '/legal', label: t.legal.title },
      ],
    },
  ];

  return (
    <footer className="mt-auto border-t border-slate-200/70 dark:border-slate-800/60 bg-white dark:bg-[#0a0f1e]">
      <div className="mx-auto max-w-6xl px-4 py-12">
        {/* Top section */}
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Link href="/" className="inline-flex items-center gap-2">
              <span className="text-xl font-bold gradient-text">Jarlyq</span>
            </Link>
            <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400 max-w-[200px]">
              {t.home.footer}
            </p>
            {/* Status dot */}
            <div className="mt-4 flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
              <span className="dot-ping text-emerald-500" />
              <span>Все системы работают</span>
            </div>
          </div>

          {/* Nav sections */}
          {sections.map((section) => (
            <div key={section.title}>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {section.title}
              </p>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-slate-600 dark:text-slate-400 hover:text-brand dark:hover:text-brand-light transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800/60 pt-6 sm:flex-row">
          <p className="text-xs text-slate-400 dark:text-slate-500">
            © {year} Jarlyq. Все права защищены.
          </p>
          <div className="flex items-center gap-4 text-xs text-slate-400 dark:text-slate-500">
            <span>🇰🇿 Казахстан</span>
            <span>🇰🇬 Кыргызстан</span>
            <span>🇺🇿 Узбекистан</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
