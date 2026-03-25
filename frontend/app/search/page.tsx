'use client';

import { useEffect, useRef, useState, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { MagnifyingGlassIcon } from '@radix-ui/react-icons';
import { Header } from '../../components/header';
import { api } from '../../lib/api';
import { useLang } from '../../lib/lang-context';

interface SearchCompany { id: number; name: string; logoURL?: string; industry?: string }
interface SearchSchool  { id: number; name: string; description?: string }
interface SearchOpp     { id: number; type: string; title: string; level: string; companyId: number; companyName: string }

interface SearchResults {
  companies: SearchCompany[];
  schools: SearchSchool[];
  opportunities: SearchOpp[];
  query: string;
}

const levelColors: Record<string, string> = {
  intern:  'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  junior:  'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  middle:  'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  senior:  'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
};

function SearchContent() {
  const { t } = useLang();
  const router = useRouter();
  const searchParams = useSearchParams();
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState(searchParams.get('q') ?? '');
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const doSearch = useCallback(async (q: string) => {
    if (q.length < 2) { setResults(null); return; }
    setLoading(true);
    try {
      const { data } = await api.get<SearchResults>('/search', { params: { q } });
      setResults(data);
    } catch {
      setResults(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const q = searchParams.get('q') ?? '';
    setQuery(q);
    if (q.length >= 2) doSearch(q);
  }, [searchParams, doSearch]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleInput = (val: string) => {
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      router.replace(`/search${val.length >= 2 ? `?q=${encodeURIComponent(val)}` : ''}`, { scroll: false });
      doSearch(val);
    }, 300);
  };

  const total = results
    ? results.companies.length + results.schools.length + results.opportunities.length
    : 0;

  return (
    <div className="min-h-screen bg-slate-100/60 dark:bg-slate-950">
      <Header />
      <main className="mx-auto max-w-2xl px-4 py-8 space-y-6">

        {/* Search input */}
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => handleInput(e.target.value)}
            placeholder={t.search.placeholder}
            className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-base shadow-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />
          {loading && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin rounded-full border-2 border-brand border-t-transparent" />
          )}
        </div>

        {/* Empty state */}
        {query.length >= 2 && !loading && results && total === 0 && (
          <div className="card flex flex-col items-center gap-2 py-12 text-center">
            <span className="text-4xl">🔍</span>
            <p className="font-semibold text-slate-700 dark:text-slate-200">{t.search.empty}</p>
            <p className="text-sm text-slate-400">«{query}»</p>
          </div>
        )}

        {results && total > 0 && (
          <>
            {/* Companies */}
            {results.companies.length > 0 && (
              <section className="space-y-2">
                <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400">{t.search.companies}</h2>
                <div className="card divide-y divide-slate-100 dark:divide-slate-800">
                  {results.companies.map(c => (
                    <Link key={c.id} href={`/companies/${c.id}`}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      {c.logoURL?.startsWith('http') ? (
                        <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-slate-700">
                          <Image src={c.logoURL} alt={c.name} fill className="object-contain p-0.5" sizes="32px" />
                        </div>
                      ) : (
                        <div className="h-8 w-8 shrink-0 rounded-lg bg-brand/10 flex items-center justify-center text-xs font-bold text-brand">
                          {c.name[0]}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="truncate font-medium text-slate-900 dark:text-white">{c.name}</p>
                        {c.industry && <p className="truncate text-xs text-slate-400">{c.industry}</p>}
                      </div>
                    </Link>
                  ))}
                </div>
                <Link href={`/#companies`} className="text-xs text-brand hover:underline">{t.search.seeAll} →</Link>
              </section>
            )}

            {/* Schools */}
            {results.schools.length > 0 && (
              <section className="space-y-2">
                <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400">{t.search.schools}</h2>
                <div className="card divide-y divide-slate-100 dark:divide-slate-800">
                  {results.schools.map(s => (
                    <Link key={s.id} href={`/schools/${s.id}`}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <div className="h-8 w-8 shrink-0 rounded-lg bg-emerald-100 flex items-center justify-center text-sm dark:bg-emerald-900/30">
                        🎓
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-slate-900 dark:text-white">{s.name}</p>
                        {s.description && <p className="truncate text-xs text-slate-400 line-clamp-1">{s.description}</p>}
                      </div>
                    </Link>
                  ))}
                </div>
                <Link href={`/#schools`} className="text-xs text-brand hover:underline">{t.search.seeAll} →</Link>
              </section>
            )}

            {/* Opportunities */}
            {results.opportunities.length > 0 && (
              <section className="space-y-2">
                <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400">{t.search.opportunities}</h2>
                <div className="card divide-y divide-slate-100 dark:divide-slate-800">
                  {results.opportunities.map(o => (
                    <Link key={o.id} href={`/companies/${o.companyId}`}
                      className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-slate-900 dark:text-white">{o.title}</p>
                        <p className="truncate text-xs text-slate-400">{o.companyName}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1.5">
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500 dark:bg-slate-800">
                          {o.type === 'internship' ? t.common.internship : t.common.vacancy}
                        </span>
                        {o.level && (
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${levelColors[o.level] ?? 'bg-slate-100 text-slate-500'}`}>
                            {o.level}
                          </span>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
                <Link href="/internships" className="text-xs text-brand hover:underline">{t.search.seeAll} →</Link>
              </section>
            )}
          </>
        )}

        {/* Hint when empty query */}
        {query.length < 2 && (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <MagnifyingGlassIcon className="h-10 w-10 text-slate-200 dark:text-slate-700" />
            <p className="text-sm text-slate-400">{t.search.placeholder}</p>
          </div>
        )}

      </main>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense>
      <SearchContent />
    </Suspense>
  );
}
