'use client';

import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import { api } from './api';
import type { Translations } from './i18n';

/**
 * Site modules = big sections of the site that the admin can switch:
 *   on   – works normally
 *   soon – shown in navigation with a "soon" badge, its page shows a teaser
 *   off  – hidden everywhere, its page shows "not available"
 *
 * Modules control the interface only; the public API keeps answering.
 * Managed in /admin/modules, stored in the backend (site_modules table).
 */
export type ModuleState = 'on' | 'soon' | 'off';

export interface SiteModule {
  key: string;
  label: string;
  description: string;
  state: ModuleState;
  sortOrder: number;
}

const CACHE_KEY = 'jarlyq_modules_v1';

interface ModulesContextValue {
  /** false until the first answer (cache or network) arrived */
  ready: boolean;
  modules: SiteModule[];
  /** State of a module. Unknown module, or modules not loaded → 'on' (fail open). */
  state: (key: string) => ModuleState;
}

const ModulesContext = createContext<ModulesContextValue>({
  ready: false,
  modules: [],
  state: () => 'on',
});

export function ModulesProvider({ children }: { children: ReactNode }) {
  const [modules, setModules] = useState<SiteModule[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    // 1) Last known answer — avoids a flash of the wrong navigation.
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (raw) {
        setModules(JSON.parse(raw) as SiteModule[]);
        setReady(true);
      }
    } catch { /* storage unavailable or corrupt — ignore */ }

    // 2) Fresh answer. If the API is down and nothing is cached, we fail open:
    //    every section behaves as before this feature existed.
    api.get<{ modules: SiteModule[] }>('/modules')
      .then(({ data }) => {
        if (cancelled) return;
        const list = data.modules ?? [];
        setModules(list);
        setReady(true);
        try { localStorage.setItem(CACHE_KEY, JSON.stringify(list)); } catch { /* ignore */ }
      })
      .catch(() => { if (!cancelled) setReady(true); });

    return () => { cancelled = true; };
  }, []);

  const value = useMemo<ModulesContextValue>(() => {
    const byKey = new Map(modules.map((m) => [m.key, m]));
    return {
      ready,
      modules,
      state: (key) => byKey.get(key)?.state ?? 'on',
    };
  }, [modules, ready]);

  return <ModulesContext.Provider value={value}>{children}</ModulesContext.Provider>;
}

export const useModules = () => useContext(ModulesContext);

/** '/schools?tab=prep' → 'schools'. Module keys equal the first URL segment. */
export function moduleKeyFromHref(href: string): string {
  return href.split('?')[0].split('#')[0].split('/').filter(Boolean)[0] ?? '';
}

/** Translated section name for a module (nav labels already exist in i18n). */
export function moduleTitle(key: string, t: Translations, fallback: string): string {
  const map: Record<string, string> = {
    companies: t.nav.companies,
    internships: t.nav.internships,
    jobs: t.nav.jobs,
    schools: t.nav.schools,
    masters: t.nav.masters,
    'career-paths': t.nav.careerPaths,
    interview: t.nav.interview,
    hackathons: t.nav.hackathons,
    'project-ideas': t.nav.projectIdeas,
    resources: t.nav.resources,
  };
  return map[key] ?? fallback;
}
