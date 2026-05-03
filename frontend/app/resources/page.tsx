'use client';

import { useState, useEffect } from 'react';
import { Header } from '../../components/header';
import { Footer } from '../../components/footer';
import { api } from '../../lib/api';

interface Resource {
  id: number;
  title: string;
  url: string;
  description?: string;
  category: string;
  subcategory?: string;
  isFree: boolean;
  language: string;
  difficulty?: string;
  countryFocus?: string;
}

const CATEGORIES = [
  { value: '',              label: 'Все',                      icon: '🔍' },
  { value: 'courses',       label: 'Курсы',                    icon: '📖' },
  { value: 'scholarships',  label: 'Стипендии',                icon: '🎓' },
  { value: 'test_prep',     label: 'Подготовка к экзаменам',   icon: '📝' },
  { value: 'languages',     label: 'Языки',                    icon: '🌐' },
  { value: 'certifications',label: 'Сертификации',             icon: '🏅' },
  { value: 'security',      label: 'Инфобезопасность',         icon: '🔐' },
  { value: 'communities',   label: 'Сообщества',               icon: '💬' },
  { value: 'career',        label: 'Карьера в IT',             icon: '🚀' },
  { value: 'other',         label: 'Другое',                   icon: '✨' },
];

const DIFFICULTY_LABELS: Record<string, string> = {
  beginner:     'Начинающий',
  intermediate: 'Средний',
  advanced:     'Продвинутый',
};

const LANG_FLAGS: Record<string, string> = { ru: '🇷🇺', en: '🇬🇧', kk: '🇰🇿' };

export default function ResourcesPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('');
  const [freeOnly, setFreeOnly] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (category) params.set('category', category);
    if (freeOnly) params.set('is_free', 'true');
    if (search.trim()) params.set('q', search.trim());
    api.get<{ resources: Resource[] }>(`/resources?${params}`)
      .then(({ data }) => setResources(data.resources ?? []))
      .catch(() => setResources([]))
      .finally(() => setLoading(false));
  }, [category, freeOnly, search]);

  // Group by category for display when "all" selected
  const grouped = category
    ? { [category]: resources }
    : resources.reduce<Record<string, Resource[]>>((acc, r) => {
        (acc[r.category] = acc[r.category] ?? []).push(r);
        return acc;
      }, {});

  const catMeta = (val: string) => CATEGORIES.find(c => c.value === val) ?? { label: val, icon: '📌' };

  return (
    <div className="min-h-screen flex flex-col bg-slate-100/60 dark:bg-slate-950">
      <Header />
      <main className="flex-1 mx-auto w-full max-w-6xl px-4 py-8">

        {/* Hero */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Полезные ресурсы</h1>
          <p className="mt-2 text-slate-500 dark:text-slate-400">
            Курсы, стипендии, подготовка к экзаменам, сертификации, сообщества — всё в одном месте.
          </p>
        </div>

        {/* Search + free filter */}
        <div className="mb-5 flex flex-wrap items-center gap-3">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Поиск: Python, IELTS, SOC..."
            className="flex-1 min-w-[200px] rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-brand focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
          <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-600 dark:text-slate-300">
            <input type="checkbox" checked={freeOnly} onChange={e => setFreeOnly(e.target.checked)} className="rounded" />
            Только бесплатные
          </label>
        </div>

        {/* Category pills */}
        <div className="mb-6 flex flex-wrap gap-2">
          {CATEGORIES.map(cat => (
            <button
              key={cat.value}
              onClick={() => setCategory(cat.value)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                category === cat.value
                  ? 'bg-brand text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:border-brand hover:text-brand dark:bg-slate-900 dark:border-slate-700 dark:text-slate-300'
              }`}
            >
              {cat.icon} {cat.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(9)].map((_, i) => (
              <div key={i} className="h-28 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
            ))}
          </div>
        ) : Object.keys(grouped).length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-2xl">🔍</p>
            <p className="mt-2 text-slate-500">Ничего не нашлось. Попробуй другой запрос.</p>
          </div>
        ) : (
          <div className="space-y-10">
            {Object.entries(grouped).map(([cat, items]) => {
              const meta = catMeta(cat);
              return (
                <section key={cat}>
                  <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white">
                    <span>{meta.icon}</span> {meta.label}
                    <span className="text-sm font-normal text-slate-400">({items.length})</span>
                  </h2>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {items.map(r => (
                      <ResourceCard key={r.id} resource={r} />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

function ResourceCard({ resource: r }: { resource: Resource }) {
  return (
    <a
      href={r.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col gap-2 rounded-2xl border border-slate-200/70 bg-white p-4 transition hover:border-brand hover:shadow-sm dark:border-slate-700/60 dark:bg-slate-900"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="font-semibold text-slate-900 group-hover:text-brand dark:text-white leading-snug line-clamp-2">
          {r.title}
        </p>
        <span className="shrink-0 text-slate-300 dark:text-slate-600 group-hover:text-brand transition">↗</span>
      </div>

      {r.description && (
        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{r.description}</p>
      )}

      <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-1">
        {r.isFree && (
          <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
            Бесплатно
          </span>
        )}
        {r.subcategory && (
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500 dark:bg-slate-800">
            {r.subcategory}
          </span>
        )}
        {r.difficulty && (
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500 dark:bg-slate-800">
            {DIFFICULTY_LABELS[r.difficulty] ?? r.difficulty}
          </span>
        )}
        {r.countryFocus && (
          <span className="text-xs text-slate-400">🇰🇿 {r.countryFocus}</span>
        )}
        <span className="ml-auto text-xs text-slate-300 dark:text-slate-600">
          {LANG_FLAGS[r.language] ?? r.language.toUpperCase()}
        </span>
      </div>
    </a>
  );
}
