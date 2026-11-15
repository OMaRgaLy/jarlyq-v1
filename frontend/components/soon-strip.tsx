'use client';

import { useLang } from '../lib/lang-context';
import { useModules, moduleTitle } from '../lib/modules';

/**
 * "Coming soon" block for the home page. It lists exactly the modules the
 * admin marked as "soon", so it can never disagree with the navigation.
 * Renders nothing when no module is in the "soon" state.
 */
export function SoonStrip() {
  const { t } = useLang();
  const { modules } = useModules();

  // 'auth' is infrastructure, not a section visitors wait for.
  const soon = modules.filter((m) => m.state === 'soon' && m.key !== 'auth');
  if (soon.length === 0) return null;

  return (
    <section className="border-y border-slate-200/70 bg-slate-50 px-4 py-14 dark:border-slate-800/60 dark:bg-slate-900/30">
      <div className="mx-auto max-w-5xl">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{t.modules.stripTitle}</h2>
        <p className="mt-2 max-w-2xl text-sm text-slate-500 dark:text-slate-400">{t.modules.stripSub}</p>
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {soon.map((m) => (
            <li
              key={m.key}
              className="rounded-xl border border-slate-200/80 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-semibold text-slate-900 dark:text-white">
                  {moduleTitle(m.key, t, m.label)}
                </h3>
                <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                  {t.modules.soonBadge}
                </span>
              </div>
              {m.description && (
                <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{m.description}</p>
              )}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
