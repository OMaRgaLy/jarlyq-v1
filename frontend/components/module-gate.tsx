'use client';

import Link from 'next/link';
import { Header } from './header';
import { Footer } from './footer';
import { useLang } from '../lib/lang-context';
import { useModules, moduleTitle } from '../lib/modules';

/**
 * Wrap a section's pages (usually in its layout.tsx):
 *   on   → renders the page
 *   soon → renders a "coming soon" teaser instead
 *   off  → renders "not available"
 */
export function ModuleGate({ module, children }: { module: string; children: React.ReactNode }) {
  const { ready, state } = useModules();

  // Don't flash a disabled page while we don't know yet.
  if (!ready) return <div className="min-h-screen bg-white dark:bg-slate-950" />;

  const s = state(module);
  if (s === 'on') return <>{children}</>;
  return <ModuleUnavailable module={module} soon={s === 'soon'} />;
}

function ModuleUnavailable({ module, soon }: { module: string; soon: boolean }) {
  const { t } = useLang();
  const { modules, state } = useModules();
  const info = modules.find((m) => m.key === module);
  const title = moduleTitle(module, t, info?.label ?? module);
  const companiesOn = state('companies') === 'on';

  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-slate-950">
      <Header />
      <main className="flex flex-1 items-center justify-center px-4 py-20">
        <div className="max-w-xl text-center">
          <span className="inline-block rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
            {soon ? t.modules.soonBadge : title}
          </span>
          <h1 className="mt-5 text-3xl font-bold text-slate-900 dark:text-white sm:text-4xl">
            {soon ? title : t.modules.offTitle}
          </h1>
          <p className="mt-4 text-base leading-relaxed text-slate-600 dark:text-slate-300">
            {soon ? t.modules.soonTitle : t.modules.offText}
          </p>
          {soon && (
            <p className="mt-3 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
              {info?.description || t.modules.soonFallback}
            </p>
          )}
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {companiesOn && (
              <Link href="/companies" className="btn-primary">{t.modules.toCompanies}</Link>
            )}
            <Link href="/" className="btn-secondary">{t.modules.backHome}</Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
