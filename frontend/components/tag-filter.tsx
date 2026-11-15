'use client';

import { useMemo, useState } from 'react';
import type { Stack } from '../lib/api';

export const TAG_CATEGORIES: { key: string; label: string }[] = [
  { key: 'language', label: 'Языки' },
  { key: 'framework', label: 'Фреймворки' },
  { key: 'mobile', label: 'Мобильная разработка' },
  { key: 'database', label: 'Базы данных' },
  { key: 'devops', label: 'DevOps и облака' },
  { key: 'data', label: 'Данные и ИИ' },
  { key: 'qa', label: 'Тестирование' },
  { key: 'design', label: 'Дизайн' },
  { key: 'management', label: 'Продукт и управление' },
  { key: 'methodology', label: 'Методологии' },
  { key: 'security', label: 'Безопасность' },
  { key: 'business', label: 'Бизнес и маркетинг' },
];

const VISIBLE = 16;

const chip = (on: boolean) =>
  `rounded-full border px-3 py-1 text-sm transition-colors ${
    on ? 'border-brand bg-brand text-white' : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400'
  }`;

/**
 * Search by technology, skill, methodology or profession. Works for every IT role,
 * not only programmers: pick a category or just type "Figma", "Scrum", "QA", "Go"…
 */
export function TagFilter({ stacks, selected, onChange, title = 'Технологии, навыки и методологии' }: {
  stacks: Stack[];
  selected: number[];
  onChange: (ids: number[]) => void;
  title?: string;
}) {
  const [text, setText] = useState('');
  const [cat, setCat] = useState('');
  const [all, setAll] = useState(false);

  const categories = useMemo(
    () => TAG_CATEGORIES.filter((c) => stacks.some((s) => s.category === c.key)),
    [stacks],
  );

  const shown = useMemo(() => {
    const q = text.trim().toLowerCase();
    return stacks
      .filter((s) => (!cat || s.category === cat) && (!q || s.name.toLowerCase().includes(q)))
      .sort((a, b) => b.popularity - a.popularity);
  }, [stacks, text, cat]);

  const list = all || text ? shown : shown.slice(0, VISIBLE);
  const toggle = (id: number) =>
    onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);
  const picked = stacks.filter((s) => selected.includes(s.id));

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-sm font-semibold text-slate-900">{title}</p>
        <input
          type="search"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Найти: Go, Figma, Scrum, QA…"
          aria-label="Найти технологию, навык или методологию"
          className="min-w-[200px] flex-1 rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand sm:max-w-xs"
        />
        {selected.length > 0 && (
          <button type="button" onClick={() => onChange([])} className="text-sm text-slate-500 hover:text-slate-900">
            Сбросить
          </button>
        )}
      </div>

      {categories.length > 0 && (
        <div className="-mx-1 mt-3 flex gap-1.5 overflow-x-auto px-1 pb-1" role="group" aria-label="Категории">
          <button type="button" onClick={() => setCat('')} aria-pressed={!cat}
            className={`whitespace-nowrap rounded-md px-2.5 py-1 text-sm ${!cat ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>
            Все
          </button>
          {categories.map((c) => (
            <button key={c.key} type="button" onClick={() => { setCat(c.key); setAll(false); }} aria-pressed={cat === c.key}
              className={`whitespace-nowrap rounded-md px-2.5 py-1 text-sm ${cat === c.key ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>
              {c.label}
            </button>
          ))}
        </div>
      )}

      {picked.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {picked.map((s) => (
            <button key={s.id} type="button" onClick={() => toggle(s.id)} className={chip(true)} aria-label={`Убрать ${s.name}`}>
              {s.name} ×
            </button>
          ))}
        </div>
      )}

      <div className="mt-3 flex flex-wrap gap-1.5">
        {list.filter((s) => !selected.includes(s.id)).map((s) => (
          <button key={s.id} type="button" onClick={() => toggle(s.id)} className={chip(false)}>
            {s.name}
          </button>
        ))}
        {list.length === 0 && <p className="text-sm text-slate-500">Ничего не нашли. Попробуйте другое слово.</p>}
        {!all && !text && shown.length > VISIBLE && (
          <button type="button" onClick={() => setAll(true)} className="px-2 text-sm font-medium text-brand hover:underline">
            Ещё {shown.length - VISIBLE}
          </button>
        )}
      </div>
    </div>
  );
}
