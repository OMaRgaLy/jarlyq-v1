'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminNav } from '../../../components/admin-nav';
import { getAdminToken, runImport, ImportResponse, ImportRow } from '../../../lib/admin-api';

/** Columns the importer understands, with a short hint shown to the admin. */
const COLUMNS: { key: string; hint: string; required?: boolean }[] = [
  { key: 'company', hint: 'Название компании', required: true },
  { key: 'title', hint: 'Название стажировки / вакансии', required: true },
  { key: 'type', hint: 'internship (стажировка) или vacancy (вакансия); по умолчанию стажировка' },
  { key: 'apply_url', hint: 'Ссылка для отклика (https://…)' },
  { key: 'deadline', hint: 'Дедлайн: 2026-12-31 или 31.12.2026' },
  { key: 'year_round', hint: 'да, если приём круглый год' },
  { key: 'city', hint: 'Город' },
  { key: 'country', hint: 'Страна: KZ, UZ… или «Казахстан»' },
  { key: 'work_format', hint: 'office / hybrid / remote (или офис / гибрид / удалённо)' },
  { key: 'level', hint: 'Intern, Junior…' },
  { key: 'stacks', hint: 'Технологии через ; например Go; PostgreSQL' },
  { key: 'salary_min', hint: 'Число' },
  { key: 'salary_max', hint: 'Число' },
  { key: 'salary_currency', hint: 'KZT, USD…' },
  { key: 'description', hint: 'Описание' },
  { key: 'requirements', hint: 'Требования' },
  { key: 'premium_hours', hint: 'Показать только Premium на N часов (0 — всем сразу)' },
  { key: 'company_country', hint: 'Страна компании (заполнится, если у компании пусто)' },
  { key: 'company_website', hint: 'Сайт компании' },
  { key: 'company_logo_url', hint: 'Ссылка на логотип' },
  { key: 'company_description', hint: 'Описание компании' },
  { key: 'company_stacks', hint: 'Технологии компании через ;' },
];

/** Russian / loose header names → canonical column keys. */
const ALIASES: Record<string, string> = {
  'компания': 'company', 'название компании': 'company',
  'название': 'title', 'должность': 'title', 'позиция': 'title', 'вакансия': 'title',
  'тип': 'type', 'ссылка': 'apply_url', 'ссылка на отклик': 'apply_url', 'url': 'apply_url',
  'дедлайн': 'deadline', 'срок': 'deadline', 'круглый год': 'year_round',
  'город': 'city', 'страна': 'country', 'формат': 'work_format', 'уровень': 'level',
  'стек': 'stacks', 'технологии': 'stacks', 'зарплата от': 'salary_min', 'зарплата до': 'salary_max',
  'валюта': 'salary_currency', 'описание': 'description', 'требования': 'requirements',
  'сайт': 'company_website', 'сайт компании': 'company_website', 'логотип': 'company_logo_url',
  'описание компании': 'company_description', 'стек компании': 'company_stacks', 'страна компании': 'company_country',
};

/** Minimal RFC-4180 parser (quotes, escaped quotes, newlines inside cells) with delimiter detection. */
function parseTable(text: string): string[][] {
  const src = text.replace(/^﻿/, '');
  const firstLine = src.split(/\r?\n/, 1)[0] ?? '';
  const counts = { '\t': 0, ';': 0, ',': 0 } as Record<string, number>;
  for (const ch of firstLine) if (ch in counts) counts[ch]++;
  const delim = (Object.keys(counts) as string[]).sort((a, b) => counts[b] - counts[a])[0];

  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (quoted) {
      if (ch === '"') {
        if (src[i + 1] === '"') { cell += '"'; i++; } else quoted = false;
      } else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === delim) { row.push(cell); cell = ''; }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && src[i + 1] === '\n') i++;
      row.push(cell); cell = '';
      rows.push(row); row = [];
    } else cell += ch;
  }
  if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
  return rows.filter((r) => r.some((c) => c.trim() !== ''));
}

function toRows(table: string[][]): { rows: ImportRow[]; unknown: string[]; missing: string[] } {
  if (table.length < 2) return { rows: [], unknown: [], missing: ['company', 'title'] };
  const known = new Set(COLUMNS.map((c) => c.key));
  const keys = table[0].map((h) => {
    const norm = h.trim().toLowerCase();
    return known.has(norm) ? norm : ALIASES[norm] ?? '';
  });
  const unknown = table[0].filter((_, i) => keys[i] === '' && table[0][i].trim() !== '');
  const missing = COLUMNS.filter((c) => c.required && !keys.includes(c.key)).map((c) => c.key);
  const rows = table.slice(1).map((cells) => {
    const r: ImportRow = {};
    keys.forEach((k, i) => { if (k) r[k] = (cells[i] ?? '').trim(); });
    return r;
  });
  return { rows, unknown, missing };
}

export default function AdminImportPage() {
  const router = useRouter();
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<ImportResponse | null>(null);

  useEffect(() => { if (!getAdminToken()) router.push('/admin'); }, [router]);

  const parsed = useMemo(() => toRows(parseTable(text)), [text]);
  const canRun = parsed.rows.length > 0 && parsed.missing.length === 0 && parsed.rows.length <= 500;

  const onFile = async (file?: File) => {
    if (!file) return;
    setResult(null);
    setText(await file.text());
  };

  const run = async (dryRun: boolean) => {
    setBusy(true);
    setError('');
    try {
      setResult(await runImport(parsed.rows, dryRun));
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(msg || 'Не удалось выполнить импорт. Проверьте, что вы вошли как администратор.');
    } finally {
      setBusy(false);
    }
  };

  const template = () => {
    const blob = new Blob(['﻿' + COLUMNS.map((c) => c.key).join(',') + '\n'], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'jarlyq-import-template.csv';
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="flex min-h-screen">
      <AdminNav />
      <main className="flex-1 overflow-auto p-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Импорт из таблицы</h1>
        <p className="mt-1 max-w-3xl text-sm text-slate-500">
          Скопируйте строки из Google Sheets / Excel (или загрузите CSV). Компании создаются сами, а повторная загрузка той же таблицы
          обновляет стажировки, а не дублирует их. Сначала нажмите «Проверить» — ничего не сохранится, пока вы не подтвердите.
        </p>

        <details className="mt-4 rounded-xl border border-slate-200 bg-white p-4 text-sm dark:border-slate-700 dark:bg-slate-900">
          <summary className="cursor-pointer font-semibold text-slate-700 dark:text-slate-200">Какие бывают колонки</summary>
          <ul className="mt-3 grid gap-x-8 gap-y-1 sm:grid-cols-2">
            {COLUMNS.map((c) => (
              <li key={c.key}><code className="rounded bg-slate-100 px-1 dark:bg-slate-800">{c.key}</code>{c.required && <b className="text-rose-600"> *</b>} — <span className="text-slate-500">{c.hint}</span></li>
            ))}
          </ul>
          <button type="button" onClick={template} className="mt-3 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold hover:border-brand hover:text-brand dark:border-slate-600">Скачать шаблон (CSV)</button>
        </details>

        <div className="mt-5 grid gap-3">
          <textarea
            value={text}
            onChange={(e) => { setText(e.target.value); setResult(null); }}
            rows={8}
            placeholder={'company\ttitle\tapply_url\tdeadline\tcity\tstacks\nНазвание компании\tBackend Intern\thttps://…\t31.12.2026\tАлматы\tGo; PostgreSQL'}
            className="w-full rounded-xl border border-slate-200 bg-white p-3 font-mono text-xs focus:border-brand focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            aria-label="Данные таблицы"
          />
          <input type="file" accept=".csv,.tsv,.txt,text/csv" onChange={(e) => onFile(e.target.files?.[0])} className="text-sm" aria-label="Загрузить файл" />
        </div>

        {text && (
          <div className="mt-4 space-y-2 text-sm">
            <p className="text-slate-600 dark:text-slate-300">Найдено строк: <b>{parsed.rows.length}</b></p>
            {parsed.missing.length > 0 && <p className="text-rose-700">Не хватает обязательных колонок: {parsed.missing.join(', ')}</p>}
            {parsed.unknown.length > 0 && <p className="text-amber-700">Эти колонки не распознаны и будут пропущены: {parsed.unknown.join(', ')}</p>}
            {parsed.rows.length > 500 && <p className="text-rose-700">Максимум 500 строк за раз — разбейте таблицу.</p>}
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-3">
          <button type="button" disabled={!canRun || busy} onClick={() => run(true)}
            className="rounded-xl border border-brand px-5 py-2.5 text-sm font-semibold text-brand hover:bg-brand/5 disabled:cursor-not-allowed disabled:opacity-40">
            {busy ? 'Работаем…' : 'Проверить (ничего не сохранится)'}
          </button>
          <button type="button" disabled={!canRun || busy || !result?.dry_run || result.created + result.updated === 0} onClick={() => run(false)}
            className="rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-40">
            Импортировать {result?.dry_run ? result.created + result.updated : ''} {result?.dry_run ? 'корректных строк' : ''}
          </button>
        </div>
        {error && <p role="alert" className="mt-3 text-sm text-rose-700">{error}</p>}

        {result && (
          <section className="mt-6" aria-live="polite">
            <p className={`rounded-xl px-4 py-3 text-sm font-semibold ${result.errors ? 'bg-amber-50 text-amber-900' : 'bg-emerald-50 text-emerald-900'}`}>
              {result.dry_run
                ? `Проверка, ничего не сохранено. Будет создано: ${result.created}, обновлено: ${result.updated}, с ошибками: ${result.errors}`
                : `Готово. Создано: ${result.created}, обновлено: ${result.updated}, с ошибками: ${result.errors}`}
            </p>
            <table className="mt-3 w-full max-w-3xl text-sm">
              <thead><tr className="text-left text-xs text-slate-400"><th className="py-1 pr-4">Строка</th><th className="pr-4">Результат</th><th>Что не так</th></tr></thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {result.results.map((r) => (
                  <tr key={r.row}>
                    <td className="py-1.5 pr-4 text-slate-500">{r.row}</td>
                    <td className="pr-4">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${r.status === 'error' ? 'bg-rose-100 text-rose-800' : r.status === 'created' ? 'bg-emerald-100 text-emerald-800' : 'bg-sky-100 text-sky-800'}`}>
                        {r.status === 'error' ? 'ошибка'
                          : r.status === 'created' ? (result.dry_run ? 'будет создано' : 'создано')
                          : (result.dry_run ? 'будет обновлено' : 'обновлено')}
                      </span>
                    </td>
                    <td className="text-rose-700">{r.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}
      </main>
    </div>
  );
}
