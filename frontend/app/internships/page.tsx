'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Header } from '../../components/header';
import { Footer } from '../../components/footer';
import { OpportunityCard } from '../../components/opportunity-card';
import { api, InternshipItem, HRContent, Company, Stack } from '../../lib/api';
import { useLang } from '../../lib/lang-context';
import { useTracker } from '../../lib/tracker';

const FORMATS = [
  { key: 'office', label: 'Офис' },
  { key: 'hybrid', label: 'Гибрид' },
  { key: 'remote', label: 'Удалённо' },
];

const COUNTRIES = [
  { key: '', label: 'Все страны' },
  { key: 'KZ', label: '🇰🇿 Казахстан' },
  { key: 'UZ', label: '🇺🇿 Узбекистан' },
  { key: 'KG', label: '🇰🇬 Кыргызстан' },
  { key: 'TJ', label: '🇹🇯 Таджикистан' },
  { key: 'RU', label: '🇷🇺 Россия' },
  { key: 'BY', label: '🇧🇾 Беларусь' },
  { key: 'GE', label: '🇬🇪 Грузия' },
  { key: 'TR', label: '🇹🇷 Турция' },
];

const chip = (active: boolean) =>
  `shrink-0 whitespace-nowrap rounded-full border px-3 py-1.5 text-sm font-medium transition ${
    active
      ? 'border-brand bg-brand text-white'
      : 'border-slate-200 bg-white text-slate-600 hover:border-brand hover:text-brand dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'
  }`;

const field =
  'w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-brand focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white';

export default function InternshipsPage() {
  const { t } = useLang();
  const tracker = useTracker();

  const [items, setItems] = useState<InternshipItem[]>([]);
  const [locked, setLocked] = useState(0);
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const [allStacks, setAllStacks] = useState<Stack[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [hrContent, setHRContent] = useState<HRContent[]>([]);
  const [hasPrefs, setHasPrefs] = useState(false);

  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [picked, setPicked] = useState<number[]>([]);
  const [format, setFormat] = useState('');
  const [country, setCountry] = useState('');
  const [forMe, setForMe] = useState(false);
  const [sort, setSort] = useState<'deadline' | 'new'>('deadline');
  const [moreOpen, setMoreOpen] = useState(false);
  const [city, setCity] = useState('');
  const [yearRoundOnly, setYearRoundOnly] = useState(false);
  const [paidOnly, setPaidOnly] = useState(false);
  const [educationLevel, setEducationLevel] = useState('');
  const [careerSwitchers, setCareerSwitchers] = useState(false);
  const [schoolkidsOnly, setSchoolkidsOnly] = useState(false);

  // Deep links such as /internships?stack_ids=3,5&country=KZ (used by the Stacks page).
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const ids = (sp.get('stack_ids') ?? '').split(',').map(Number).filter((n) => Number.isInteger(n) && n > 0);
    if (ids.length) setPicked(ids);
    const c = sp.get('country');
    if (c && /^[A-Za-z]{2}$/.test(c)) setCountry(c.toUpperCase());
  }, []);

  // Debounce the search box so we don't fire a request on every keystroke.
  useEffect(() => {
    const id = setTimeout(() => setDebounced(query.trim()), 300);
    return () => clearTimeout(id);
  }, [query]);

  // One-time data: popular stacks, companies, HR content, and whether the user follows stacks.
  useEffect(() => {
    api.get<{ stacks: Stack[] }>('/stacks').then((r) => setAllStacks(r.data.stacks ?? [])).catch(() => {});
    api.get('/companies?widget_internship=true').then((r) => setCompanies((r.data.companies ?? []).slice(0, 6))).catch(() => {});
    api.get('/companies?hr_content=true').then((r) => {
      const c = r.data.hr_content;
      setHRContent(Array.isArray(c) ? c.slice(0, 6) : []);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!tracker.loggedIn) { setHasPrefs(false); return; }
    api.get<{ stacks: Stack[] }>('/users/me/preferred-stacks')
      .then((r) => setHasPrefs((r.data.stacks ?? []).length > 0))
      .catch(() => setHasPrefs(false));
  }, [tracker.loggedIn]);

  const params = useMemo(() => {
    const p = new URLSearchParams();
    if (debounced) p.set('q', debounced);
    if (picked.length) p.set('stack_ids', picked.join(','));
    if (format) p.set('work_format', format);
    if (country) p.set('country', country);
    if (forMe) p.set('for_me', 'true');
    if (sort === 'new') p.set('sort', 'new');
    if (city.trim()) p.set('city', city.trim());
    if (yearRoundOnly) p.set('is_year_round', 'true');
    if (paidOnly) p.set('is_paid', 'true');
    if (educationLevel) p.set('education_level', educationLevel);
    if (careerSwitchers) p.set('career_switchers', 'true');
    if (schoolkidsOnly) p.set('schoolkids', 'true');
    return p.toString();
  }, [debounced, picked, format, country, forMe, sort, city, yearRoundOnly, paidOnly, educationLevel, careerSwitchers, schoolkidsOnly]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setFailed(false);
    api.get(`/internships?${params}`)
      .then((r) => {
        if (cancelled) return;
        setItems(r.data.internships ?? []);
        setLocked(r.data.premiumLocked ?? 0);
        setIsPremium(!!r.data.isPremium);
      })
      .catch(() => { if (!cancelled) { setFailed(true); setItems([]); } })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [params, tracker.loggedIn]);

  const togglePick = (id: number) =>
    setPicked((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));

  const pickByName = (name: string) => {
    const s = allStacks.find((x) => x.name.toLowerCase() === name.toLowerCase());
    if (s && !picked.includes(s.id)) setPicked((cur) => [...cur, s.id]);
  };

  const popular = useMemo(
    () => [...allStacks].sort((a, b) => b.popularity - a.popularity).slice(0, 14),
    [allStacks],
  );

  const filtersActive =
    !!debounced || picked.length > 0 || !!format || !!country || forMe || !!city || yearRoundOnly || paidOnly ||
    !!educationLevel || careerSwitchers || schoolkidsOnly;

  const resetAll = () => {
    setQuery(''); setPicked([]); setFormat(''); setCountry(''); setForMe(false); setCity('');
    setYearRoundOnly(false); setPaidOnly(false); setEducationLevel(''); setCareerSwitchers(false); setSchoolkidsOnly(false);
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-950">
      <Header />

      {/* Hero */}
      <section className="bg-gradient-to-br from-ink-deep via-ink to-brand">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
          <h1 className="text-4xl font-extrabold text-white sm:text-5xl">{t.internships.title}</h1>
          <p className="mt-3 max-w-2xl text-lg text-white/80">
            Актуальные наборы в IT-компании Центральной Азии. Сохраняйте — мы напомним о дедлайне.
          </p>
          <div className="mt-6 max-w-2xl">
            <label htmlFor="search" className="sr-only">Поиск по должности, компании, городу</label>
            <input
              id="search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Поиск по должности, компании, городу…"
              className="w-full rounded-2xl border-0 bg-white px-5 py-3.5 text-base text-slate-900 shadow-lg placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-light"
            />
          </div>
        </div>
      </section>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        {/* Filters */}
        <div className="space-y-3">
          {/* One scrollable row on phones instead of five wrapped rows of chips. */}
          <div className="-mx-4 flex items-center gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0" role="group" aria-label="Технологии">
            {popular.map((s) => (
              <button key={s.id} type="button" onClick={() => togglePick(s.id)} aria-pressed={picked.includes(s.id)} className={chip(picked.includes(s.id))}>
                {s.name}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {FORMATS.map((f) => (
              <button key={f.key} type="button" onClick={() => setFormat(format === f.key ? '' : f.key)} aria-pressed={format === f.key} className={chip(format === f.key)}>
                {f.label}
              </button>
            ))}
            <select value={country} onChange={(e) => setCountry(e.target.value)} aria-label="Страна" className={`${field} w-auto`}>
              {COUNTRIES.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
            </select>
            {hasPrefs && (
              <button type="button" onClick={() => setForMe(!forMe)} aria-pressed={forMe} className={chip(forMe)}>
                ✨ Подходит мне
              </button>
            )}
            <button type="button" onClick={() => setMoreOpen(!moreOpen)} aria-expanded={moreOpen} className={chip(moreOpen)}>
              Ещё фильтры
            </button>
            <select value={sort} onChange={(e) => setSort(e.target.value as 'deadline' | 'new')} aria-label="Сортировка" className={`${field} ml-auto w-auto`}>
              <option value="deadline">Сначала горящие</option>
              <option value="new">Сначала новые</option>
            </select>
          </div>

          {moreOpen && (
            <div className="grid gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 dark:border-slate-700/60 dark:bg-slate-900 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">{t.internships.filterCity}</label>
                <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Алматы, Астана…" className={field} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">Образование</label>
                <select value={educationLevel} onChange={(e) => setEducationLevel(e.target.value)} className={field}>
                  <option value="">Любое</option>
                  <option value="none">Без диплома</option>
                  <option value="schoolkid">Школьникам</option>
                  <option value="student_1_2">Студент 1–2 курса</option>
                  <option value="student_3_4">Студент 3–4 курса</option>
                  <option value="bachelor">Бакалавр+</option>
                </select>
              </div>
              <div className="flex flex-wrap items-end gap-x-5 gap-y-2 pb-1 text-sm text-slate-600 dark:text-slate-300">
                <label className="flex cursor-pointer items-center gap-2"><input type="checkbox" checked={yearRoundOnly} onChange={(e) => setYearRoundOnly(e.target.checked)} /> {t.internships.filterYearRound}</label>
                <label className="flex cursor-pointer items-center gap-2"><input type="checkbox" checked={paidOnly} onChange={(e) => setPaidOnly(e.target.checked)} /> {t.internships.filterPaid}</label>
                <label className="flex cursor-pointer items-center gap-2"><input type="checkbox" checked={careerSwitchers} onChange={(e) => setCareerSwitchers(e.target.checked)} /> Смена профессии</label>
                <label className="flex cursor-pointer items-center gap-2"><input type="checkbox" checked={schoolkidsOnly} onChange={(e) => setSchoolkidsOnly(e.target.checked)} /> Для школьников</label>
              </div>
            </div>
          )}
        </div>

        {/* Premium early-access teaser */}
        {!isPremium && locked > 0 && (
          <Link href="/premium" className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900 transition hover:border-amber-300 dark:border-amber-800/40 dark:bg-amber-900/20 dark:text-amber-200">
            <span>
              <strong>⭐ {locked} {locked === 1 ? 'новая стажировка' : 'новых стажировок'}</strong> уже доступны Premium — на день раньше всех.
            </span>
            <span className="font-semibold underline">Узнать про Premium →</span>
          </Link>
        )}

        {/* Results */}
        <div className="mt-6 flex items-baseline justify-between">
          <p className="text-sm text-slate-500" aria-live="polite">
            {loading ? 'Загружаем…' : `Найдено: ${items.length}`}
          </p>
          {filtersActive && (
            <button type="button" onClick={resetAll} className="text-sm font-medium text-brand hover:underline">Сбросить фильтры</button>
          )}
        </div>

        <div className="mt-3 space-y-3">
          {loading ? (
            [...Array(4)].map((_, i) => <div key={i} className="h-32 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />)
          ) : failed ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center text-rose-800 dark:border-rose-900/40 dark:bg-rose-900/20 dark:text-rose-200">
              Не удалось загрузить стажировки. Обновите страницу через минуту.
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center dark:border-slate-700 dark:bg-slate-900">
              <p className="text-3xl">🔍</p>
              <p className="mt-2 font-semibold text-slate-800 dark:text-slate-100">
                {filtersActive ? 'По этим фильтрам ничего нет' : 'Стажировок пока нет'}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                {filtersActive ? 'Попробуйте убрать часть фильтров.' : 'Знаете компанию, которая набирает стажёров? Расскажите нам.'}
              </p>
              <div className="mt-4 flex justify-center gap-3">
                {filtersActive && <button type="button" onClick={resetAll} className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark">Сбросить фильтры</button>}
                <Link href="/suggest" className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-brand hover:text-brand dark:border-slate-600 dark:text-slate-200">Предложить компанию</Link>
              </div>
            </div>
          ) : (
            items.map((item) => (
              <OpportunityCard
                key={item.id}
                item={item}
                tracked={tracker.byOpp.get(item.id)}
                loggedIn={tracker.loggedIn}
                onChanged={tracker.reload}
                onSave={tracker.save}
                onUnsave={tracker.remove}
                onStackClick={pickByName}
              />
            ))
          )}
        </div>

        {/* Companies open to interns */}
        {!loading && companies.length > 0 && (
          <section className="mt-12">
            <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">🏢 {t.internships.emptyCompanies}</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {companies.map((c) => (
                <Link key={c.id} href={`/companies/${c.id}`}
                  className="flex items-center gap-3 rounded-xl border border-slate-200/70 bg-white px-4 py-3 transition hover:border-brand dark:border-slate-700/60 dark:bg-slate-900">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-lg dark:bg-slate-800">{c.name.charAt(0)}</div>
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-900 dark:text-white">{c.name}</p>
                    {c.industry && <p className="text-xs text-slate-500">{c.industry}</p>}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* HR content */}
        {!loading && hrContent.length > 0 && (
          <section className="mt-12">
            <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">💡 {t.internships.hrContent}</h2>
            <div className="flex gap-4 overflow-x-auto pb-2">
              {hrContent.map((c) => (
                <a key={c.id} href={c.url || '#'} target="_blank" rel="noopener noreferrer"
                  className="flex w-64 shrink-0 flex-col gap-2 rounded-xl border border-slate-200/70 bg-white p-4 transition hover:border-brand dark:border-slate-700/60 dark:bg-slate-900">
                  <span className="self-start rounded-full bg-brand/10 px-2 py-0.5 text-xs font-medium text-brand">
                    {t.internships.hrContentTypes[c.type] ?? c.type}
                  </span>
                  <p className="line-clamp-3 text-sm font-medium leading-snug text-slate-900 dark:text-white">{c.title}</p>
                  <p className="mt-auto text-xs text-slate-400">{c.authorName} · {c.authorPos}</p>
                </a>
              ))}
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}
