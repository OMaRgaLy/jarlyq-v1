'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminNav } from '../../../../components/admin-nav';
import { getAdminToken } from '../../../../lib/admin-api';
import { parseURL, approveRecords } from '../../../../lib/pipeline-api';
import { useEffect } from 'react';

type ParsedData = Record<string, unknown>;

const FIELD_LABELS: Record<string, string> = {
  name: 'Название',
  description: 'Описание',
  description_ru: 'Описание (RU)',
  industry: 'Индустрия',
  country: 'Страна',
  city: 'Город',
  website: 'Сайт',
  employee_count: 'Сотрудников',
  size_category: 'Размер',
  has_internship: 'Стажировки',
  work_formats: 'Формат работы',
  stack: 'Стек технологий',
  source_url: 'Источник',
};

const EXAMPLE_URLS = [
  'https://kaspi.kz',
  'https://kolesa.kz',
  'https://yandex.kz',
  'https://epam.com',
  'https://alem.school',
];

export default function ParseURLPage() {
  const router = useRouter();
  useEffect(() => { if (!getAdminToken()) router.push('/admin'); }, [router]);

  const [url, setUrl]                     = useState('');
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState('');
  const [result, setResult]               = useState<{ record_id: string; data: ParsedData } | null>(null);
  const [editedData, setEditedData]       = useState<ParsedData>({});
  const [approving, setApproving]         = useState(false);
  const [approved, setApproved]           = useState(false);
  const [history, setHistory]             = useState<{ url: string; name: string; record_id: string }[]>([]);

  const handleParse = async () => {
    const trimmed = url.trim();
    if (!trimmed) return;
    setLoading(true);
    setError('');
    setResult(null);
    setApproved(false);

    try {
      const res = await parseURL(trimmed);
      setResult(res);
      setEditedData({ ...res.data });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!result) return;
    setApproving(true);
    try {
      await approveRecords([result.record_id]);
      setApproved(true);
      setHistory((prev) => [
        { url: url.trim(), name: String(editedData.name || ''), record_id: result.record_id },
        ...prev.slice(0, 9),
      ]);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setApproving(false);
    }
  };

  const setField = (key: string, val: unknown) =>
    setEditedData((prev) => ({ ...prev, [key]: val }));

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
      <AdminNav />
      <main className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex items-center gap-3 border-b border-slate-200/70 bg-white px-6 py-4 dark:border-slate-700/60 dark:bg-slate-900">
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Парсинг URL</h1>
            <p className="text-xs text-slate-500">Добавить компанию по ссылке на сайт — AI извлечёт данные автоматически</p>
          </div>
          <a href="/admin/pipeline" className="text-sm text-brand hover:underline">← Парсеры</a>
        </header>

        <div className="flex flex-1 overflow-hidden">
          {/* Left: URL input + history */}
          <div className="flex w-80 flex-shrink-0 flex-col gap-4 overflow-y-auto border-r border-slate-200/70 p-4 dark:border-slate-700/60">
            {/* URL input */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-400">
                URL сайта компании
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleParse()}
                  placeholder="https://company.kz"
                  className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                />
              </div>
              <button
                onClick={handleParse}
                disabled={loading || !url.trim()}
                className="mt-2 w-full rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white disabled:opacity-40 hover:opacity-90 transition"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    AI парсит...
                  </span>
                ) : 'Распарсить'}
              </button>

              {error && (
                <div className="mt-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                  {error}
                </div>
              )}
            </div>

            {/* Examples */}
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Примеры</p>
              <div className="flex flex-col gap-1">
                {EXAMPLE_URLS.map((u) => (
                  <button
                    key={u}
                    onClick={() => setUrl(u)}
                    className="rounded px-2 py-1.5 text-left font-mono text-xs text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    {u}
                  </button>
                ))}
              </div>
            </div>

            {/* History */}
            {history.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">История</p>
                <div className="flex flex-col gap-1">
                  {history.map((h, i) => (
                    <div key={i} className="rounded-lg bg-green-50 px-3 py-2 dark:bg-green-900/20">
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{h.name || '—'}</p>
                      <p className="font-mono text-xs text-slate-400">{h.url}</p>
                      <p className="text-xs text-green-600">Добавлено в staging</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* How it works */}
            <div className="rounded-xl border border-slate-200/70 bg-white p-4 dark:border-slate-700/60 dark:bg-slate-900">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Как работает</p>
              <ol className="flex flex-col gap-2 text-xs text-slate-500">
                <li className="flex gap-2"><span className="font-bold text-brand">1.</span> Загружаем HTML страницы</li>
                <li className="flex gap-2"><span className="font-bold text-brand">2.</span> Очищаем от скриптов и CSS</li>
                <li className="flex gap-2"><span className="font-bold text-brand">3.</span> AI извлекает: название, описание, стек, индустрию</li>
                <li className="flex gap-2"><span className="font-bold text-brand">4.</span> Запись появляется в Staging</li>
                <li className="flex gap-2"><span className="font-bold text-brand">5.</span> Редактируешь и одобряешь → в БД</li>
              </ol>
            </div>
          </div>

          {/* Right: parsed result */}
          <div className="flex flex-1 flex-col overflow-y-auto">
            {!result && !loading && (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
                <div className="text-4xl">🔍</div>
                <p className="text-slate-500">Введи URL корпоративного сайта</p>
                <p className="max-w-sm text-xs text-slate-400">
                  AI прочитает страницу и автоматически извлечёт название, описание, стек технологий и другие данные компании
                </p>
              </div>
            )}

            {loading && (
              <div className="flex flex-1 flex-col items-center justify-center gap-4">
                <svg className="h-8 w-8 animate-spin text-brand" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                <div className="text-center">
                  <p className="font-medium text-slate-700 dark:text-slate-300">AI анализирует сайт...</p>
                  <p className="text-sm text-slate-400">{url}</p>
                </div>
              </div>
            )}

            {result && (
              <div className="p-6">
                {/* Result header */}
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    {!!editedData.logo_url && (
                      <img
                        src={String(editedData.logo_url)}
                        alt=""
                        className="h-10 w-10 rounded-lg object-contain border border-slate-100"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    )}
                    <div>
                      <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                        {String(editedData.name || '—')}
                      </h2>
                      <p className="text-sm text-slate-500">{url}</p>
                    </div>
                  </div>
                  {!approved ? (
                    <button
                      onClick={handleApprove}
                      disabled={approving}
                      className="flex-shrink-0 rounded-xl bg-green-600 px-5 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                    >
                      {approving ? 'Добавляю...' : '✓ Добавить в БД'}
                    </button>
                  ) : (
                    <div className="flex-shrink-0 rounded-xl bg-green-100 px-5 py-2 text-sm font-semibold text-green-700">
                      ✓ Добавлено в staging
                    </div>
                  )}
                </div>

                {/* Editable fields */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Text fields */}
                  {([
                    ['name', 'Название', false],
                    ['industry', 'Индустрия', false],
                    ['country', 'Страна', false],
                    ['city', 'Город', false],
                    ['website', 'Сайт', false],
                    ['employee_count', 'Сотрудников', false],
                  ] as [string, string, boolean][]).map(([key, label]) => (
                    <div key={key}>
                      <label className="mb-1 block text-xs font-medium text-slate-500">{label}</label>
                      <input
                        type="text"
                        value={String(editedData[key] || '')}
                        onChange={(e) => setField(key, e.target.value)}
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                      />
                    </div>
                  ))}

                  {/* Stack */}
                  <div className="col-span-2">
                    <label className="mb-1 block text-xs font-medium text-slate-500">Стек технологий (через запятую)</label>
                    <input
                      type="text"
                      value={Array.isArray(editedData.stack) ? (editedData.stack as string[]).join(', ') : ''}
                      onChange={(e) => setField('stack', e.target.value.split(',').map((s) => s.trim()).filter(Boolean))}
                      placeholder="Python, Go, React, PostgreSQL..."
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                    />
                  </div>

                  {/* Description */}
                  <div className="col-span-2">
                    <label className="mb-1 block text-xs font-medium text-slate-500">Описание</label>
                    <textarea
                      value={String(editedData.description || '')}
                      onChange={(e) => setField('description', e.target.value)}
                      rows={4}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                    />
                  </div>

                  {/* Booleans */}
                  <div className="col-span-2 flex gap-6">
                    <label className="flex cursor-pointer items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={!!editedData.has_internship}
                        onChange={(e) => setField('has_internship', e.target.checked)}
                        className="accent-brand"
                      />
                      Есть стажировки
                    </label>
                  </div>

                  {/* Work formats */}
                  <div className="col-span-2">
                    <label className="mb-2 block text-xs font-medium text-slate-500">Формат работы</label>
                    <div className="flex gap-3">
                      {['remote', 'hybrid', 'office'].map((fmt) => {
                        const fmts = Array.isArray(editedData.work_formats) ? editedData.work_formats as string[] : [];
                        return (
                          <label key={fmt} className="flex cursor-pointer items-center gap-1.5 text-sm">
                            <input
                              type="checkbox"
                              checked={fmts.includes(fmt)}
                              onChange={(e) => {
                                const next = e.target.checked
                                  ? [...fmts, fmt]
                                  : fmts.filter((f) => f !== fmt);
                                setField('work_formats', next);
                              }}
                              className="accent-brand"
                            />
                            {fmt}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Raw JSON toggle */}
                <details className="mt-6">
                  <summary className="cursor-pointer text-xs text-slate-400 hover:text-slate-600">Показать сырой JSON</summary>
                  <pre className="mt-2 overflow-x-auto rounded-lg bg-slate-900 p-4 text-xs text-slate-300">
                    {JSON.stringify(result.data, null, 2)}
                  </pre>
                </details>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
