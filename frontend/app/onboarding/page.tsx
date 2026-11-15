'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '../../components/header';
import { api, Stack } from '../../lib/api';
import { getUser } from '../../lib/auth';

const LEVELS = [
  { key: 'schoolkid', emoji: '🎒', title: 'Школьник', hint: 'Ищу первые шаги в IT' },
  { key: 'student', emoji: '🎓', title: 'Студент', hint: 'Нужна стажировка или практика' },
  { key: 'switcher', emoji: '🔄', title: 'Меняю профессию', hint: 'Прихожу в IT из другой сферы' },
  { key: 'junior', emoji: '🚀', title: 'Джуниор', hint: 'Ищу первую работу или рост' },
];

const COUNTRIES = [
  { key: 'KZ', label: '🇰🇿 Казахстан' },
  { key: 'UZ', label: '🇺🇿 Узбекистан' },
  { key: 'KG', label: '🇰🇬 Кыргызстан' },
  { key: 'TJ', label: '🇹🇯 Таджикистан' },
  { key: 'RU', label: '🇷🇺 Россия' },
  { key: 'BY', label: '🇧🇾 Беларусь' },
  { key: 'GE', label: '🇬🇪 Грузия' },
  { key: 'TR', label: '🇹🇷 Турция' },
];

const MAX_STACKS = 10;

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [level, setLevel] = useState('');
  const [country, setCountry] = useState('KZ');
  const [city, setCity] = useState('');
  const [stacks, setStacks] = useState<Stack[]>([]);
  const [picked, setPicked] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!getUser()) { router.replace('/auth?next=/onboarding'); return; }
    api.get<{ stacks: Stack[] }>('/stacks').then((r) => setStacks(r.data.stacks ?? [])).catch(() => {});
  }, [router]);

  const sorted = useMemo(() => [...stacks].sort((a, b) => b.popularity - a.popularity), [stacks]);

  const toggle = (id: number) =>
    setPicked((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : cur.length < MAX_STACKS ? [...cur, id] : cur));

  const finish = async (skip = false) => {
    setSaving(true);
    setError('');
    try {
      await api.put('/users/me/onboarding', skip
        ? { level: '', country: '', city: '', stack_ids: [] }
        : { level, country, city: city.trim(), stack_ids: picked });
      router.push('/internships');
    } catch {
      setError('Не удалось сохранить. Попробуйте ещё раз.');
      setSaving(false);
    }
  };

  const steps = ['Кто вы', 'Где ищете', 'Что интересно'];
  const card = (active: boolean) =>
    `rounded-2xl border-2 p-4 text-left transition ${active ? 'border-brand bg-brand/5' : 'border-slate-200 bg-white hover:border-brand/50 dark:border-slate-700 dark:bg-slate-900'}`;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Header />
      <main className="mx-auto max-w-2xl px-4 py-10">
        <ol className="mb-8 flex items-center gap-2" aria-label="Шаги">
          {steps.map((s, i) => (
            <li key={s} className="flex flex-1 items-center gap-2">
              <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${i <= step ? 'bg-brand text-white' : 'bg-slate-200 text-slate-500 dark:bg-slate-800'}`}>{i + 1}</span>
              <span className={`hidden text-sm sm:inline ${i === step ? 'font-semibold text-ink dark:text-white' : 'text-slate-400'}`}>{s}</span>
              {i < steps.length - 1 && <span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />}
            </li>
          ))}
        </ol>

        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-700/60 dark:bg-slate-900 sm:p-8">
          {step === 0 && (
            <>
              <h1 className="text-2xl font-extrabold text-ink dark:text-white">Добро пожаловать в Jarlyq 👋</h1>
              <p className="mt-2 text-slate-500">Ответьте на три коротких вопроса — подберём стажировки под вас.</p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {LEVELS.map((l) => (
                  <button key={l.key} type="button" onClick={() => setLevel(l.key)} aria-pressed={level === l.key} className={card(level === l.key)}>
                    <span className="text-2xl">{l.emoji}</span>
                    <span className="mt-2 block font-bold text-ink dark:text-white">{l.title}</span>
                    <span className="block text-sm text-slate-500">{l.hint}</span>
                  </button>
                ))}
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <h1 className="text-2xl font-extrabold text-ink dark:text-white">Где вы ищете?</h1>
              <p className="mt-2 text-slate-500">Покажем возможности рядом с вами и удалённые.</p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {COUNTRIES.map((c) => (
                  <button key={c.key} type="button" onClick={() => setCountry(c.key)} aria-pressed={country === c.key} className={card(country === c.key)}>
                    <span className="font-semibold text-ink dark:text-white">{c.label}</span>
                  </button>
                ))}
              </div>
              <label className="mt-5 block text-sm font-medium text-slate-600 dark:text-slate-300" htmlFor="city">Город (необязательно)</label>
              <input id="city" value={city} onChange={(e) => setCity(e.target.value)} maxLength={100} placeholder="Алматы, Астана, Ташкент…"
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm focus:border-brand focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
            </>
          )}

          {step === 2 && (
            <>
              <h1 className="text-2xl font-extrabold text-ink dark:text-white">Какие технологии интересны?</h1>
              <p className="mt-2 text-slate-500">Выберите до {MAX_STACKS}. По ним фильтруем ленту и присылаем уведомления о новых стажировках.</p>
              <div className="mt-6 flex flex-wrap gap-2" role="group" aria-label="Технологии">
                {sorted.map((s) => {
                  const on = picked.includes(s.id);
                  return (
                    <button key={s.id} type="button" onClick={() => toggle(s.id)} aria-pressed={on}
                      className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${on ? 'border-brand bg-brand text-white' : 'border-slate-200 text-slate-600 hover:border-brand hover:text-brand dark:border-slate-700 dark:text-slate-300'}`}>
                      {s.name}
                    </button>
                  );
                })}
              </div>
              <p className="mt-3 text-xs text-slate-400">Выбрано: {picked.length} из {MAX_STACKS}</p>
            </>
          )}

          {error && <p role="alert" className="mt-4 text-sm text-rose-600">{error}</p>}

          <div className="mt-8 flex items-center justify-between gap-3">
            <button type="button" onClick={() => (step === 0 ? finish(true) : setStep(step - 1))} disabled={saving}
              className="text-sm font-medium text-slate-500 hover:text-brand">
              {step === 0 ? 'Пропустить' : '← Назад'}
            </button>
            {step < 2 ? (
              <button type="button" onClick={() => setStep(step + 1)} disabled={step === 0 && !level}
                className="rounded-xl bg-brand px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-40">
                Дальше →
              </button>
            ) : (
              <button type="button" onClick={() => finish(false)} disabled={saving}
                className="rounded-xl bg-brand px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-50">
                {saving ? 'Сохраняем…' : 'Показать стажировки'}
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
