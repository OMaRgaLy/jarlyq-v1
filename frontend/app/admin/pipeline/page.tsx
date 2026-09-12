'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AdminNav } from '../../../components/admin-nav';
import { getAdminToken } from '../../../lib/admin-api';
import {
  fetchSources,
  fetchCountries,
  fetchJobs,
  fetchPipelineStatus,
  startJob,
  cancelJob,
  jobLogsWS,
  PipelineSource,
  PipelineJob,
  PipelineStatus,
} from '../../../lib/pipeline-api';

const STATUS_COLORS: Record<string, string> = {
  pending:   'bg-yellow-100 text-yellow-700',
  running:   'bg-blue-100 text-blue-700',
  done:      'bg-green-100 text-green-700',
  error:     'bg-red-100 text-red-700',
  cancelled: 'bg-slate-100 text-slate-500',
};
const STATUS_LABELS: Record<string, string> = {
  pending: 'Ожидание', running: 'Работает',
  done: 'Готово', error: 'Ошибка', cancelled: 'Отменено',
};

const COUNTRY_LABELS: Record<string, string> = {
  KZ: '🇰🇿 KZ', UZ: '🇺🇿 UZ', KG: '🇰🇬 KG', RU: '🇷🇺 RU',
  BY: '🇧🇾 BY', AZ: '🇦🇿 AZ', AM: '🇦🇲 AM', GE: '🇬🇪 GE', TR: '🇹🇷 TR',
};

export default function PipelinePage() {
  const router = useRouter();
  const [serverOnline, setServerOnline] = useState<boolean | null>(null);
  const [status, setStatus] = useState<PipelineStatus | null>(null);
  const [sources, setSources] = useState<PipelineSource[]>([]);
  const [jobs, setJobs] = useState<PipelineJob[]>([]);

  // Форма запуска
  const [selectedSource, setSelectedSource] = useState('hh_companies');
  const [selectedCountries, setSelectedCountries] = useState<string[]>(['KZ']);
  const [dryRun, setDryRun] = useState(false);
  const [launching, setLaunching] = useState(false);

  // Активные логи
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [logs, setLogs] = useState<{ ts: string; line: string }[]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Проверяем авторизацию
  useEffect(() => {
    if (!getAdminToken()) router.push('/admin');
  }, [router]);

  // Проверяем pipeline server
  const checkServer = useCallback(async () => {
    try {
      const s = await fetchPipelineStatus();
      setStatus(s);
      setServerOnline(true);
    } catch {
      setServerOnline(false);
    }
  }, []);

  const loadSources = useCallback(async () => {
    try { setSources(await fetchSources()); } catch {}
  }, []);

  const loadJobs = useCallback(async () => {
    try { setJobs(await fetchJobs(20)); } catch {}
  }, []);

  useEffect(() => {
    checkServer();
    loadSources();
    loadJobs();
    const t = setInterval(() => { checkServer(); loadJobs(); }, 5000);
    return () => clearInterval(t);
  }, [checkServer, loadSources, loadJobs]);

  // Авто-скролл логов
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // WebSocket логи
  const connectLogs = useCallback((jobId: string) => {
    wsRef.current?.close();
    setLogs([]);
    setActiveJobId(jobId);
    const ws = jobLogsWS(jobId);
    wsRef.current = ws;
    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      setLogs((prev) => [...prev, msg]);
    };
    ws.onerror = () => setLogs((prev) => [...prev, { ts: '', line: '⚠ WebSocket ошибка' }]);
  }, []);

  // Запуск парсера
  const handleRun = async () => {
    if (!selectedSource || selectedCountries.length === 0) return;
    setLaunching(true);
    try {
      const { job_id } = await startJob(selectedSource, selectedCountries, dryRun);
      await loadJobs();
      connectLogs(job_id);
    } catch (e: unknown) {
      alert(`Ошибка: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setLaunching(false);
    }
  };

  const handleCancel = async (id: string) => {
    await cancelJob(id);
    loadJobs();
  };

  const toggleCountry = (code: string) =>
    setSelectedCountries((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code],
    );

  const sourcesByEntity = sources.reduce<Record<string, PipelineSource[]>>(
    (acc, s) => { (acc[s.entity] ||= []).push(s); return acc; }, {}
  );

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
      <AdminNav />
      <main className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex items-center gap-3 border-b border-slate-200/70 bg-white px-6 py-4 dark:border-slate-700/60 dark:bg-slate-900">
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Парсеры данных</h1>
            <p className="text-xs text-slate-500">Сбор компаний, школ и вакансий из внешних источников</p>
          </div>
          {/* Server status badge */}
          <div className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
            serverOnline === null ? 'bg-slate-100 text-slate-500' :
            serverOnline ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
          }`}>
            <span className={`h-1.5 w-1.5 rounded-full ${
              serverOnline === null ? 'bg-slate-400' :
              serverOnline ? 'bg-green-500' : 'bg-red-500'
            }`} />
            {serverOnline === null ? 'Проверка...' :
             serverOnline ? 'Pipeline Server онлайн' : 'Server недоступен'}
          </div>
        </header>

        <div className="flex flex-1 overflow-hidden">
          {/* Left panel */}
          <div className="flex w-80 flex-shrink-0 flex-col gap-4 overflow-y-auto border-r border-slate-200/70 p-4 dark:border-slate-700/60">

            {/* Server offline warning */}
            {serverOnline === false && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                <p className="font-semibold">Pipeline Server не запущен</p>
                <p className="mt-1 font-mono text-red-600">cd scripts && python server.py</p>
              </div>
            )}

            {/* Status cards */}
            {status && (
              <div className="grid grid-cols-2 gap-2">
                <StatusCard label="В staging" value={status.staging_pending} color="blue" />
                <StatusCard label="Задач всего" value={status.total_jobs} color="slate" />
              </div>
            )}

            {/* AI provider badges */}
            {status && (
              <div className="rounded-lg border border-slate-200/70 bg-white p-3 dark:border-slate-700/60 dark:bg-slate-900">
                <p className="mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">AI провайдеры</p>
                <div className="flex flex-col gap-1">
                  <ProviderBadge label="Groq" ok={status.groq_configured} active={status.ai_provider === 'groq'} />
                  <ProviderBadge label="Gemini" ok={status.gemini_configured} active={status.ai_provider === 'gemini'} />
                  <ProviderBadge label="Ollama" ok={status.ollama_configured} active={status.ai_provider === 'ollama'} />
                  <ProviderBadge label="GitHub" ok={status.github_configured} />
                  <ProviderBadge label="Telegram" ok={status.telegram_configured} />
                </div>
              </div>
            )}

            {/* Launch form */}
            <div className="rounded-lg border border-slate-200/70 bg-white p-4 dark:border-slate-700/60 dark:bg-slate-900">
              <p className="mb-3 text-sm font-semibold text-slate-800 dark:text-slate-200">Запустить парсер</p>

              {/* Source selector */}
              <div className="mb-3">
                <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">Источник</label>
                {Object.entries(sourcesByEntity).map(([entity, srcs]) => (
                  <div key={entity} className="mb-2">
                    <p className="mb-1 text-xs text-slate-400 uppercase tracking-wide">{entity}</p>
                    {srcs.map((s) => (
                      <label key={s.id} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800">
                        <input
                          type="radio"
                          name="source"
                          value={s.id}
                          checked={selectedSource === s.id}
                          onChange={() => setSelectedSource(s.id)}
                          className="accent-brand"
                        />
                        <span className="text-sm text-slate-700 dark:text-slate-300">{s.label}</span>
                      </label>
                    ))}
                  </div>
                ))}
              </div>

              {/* Country selector */}
              <div className="mb-3">
                <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">Страны</label>
                <div className="flex flex-wrap gap-1">
                  {Object.entries(COUNTRY_LABELS).map(([code, label]) => (
                    <button
                      key={code}
                      onClick={() => toggleCountry(code)}
                      className={`rounded px-2 py-0.5 text-xs font-medium transition ${
                        selectedCountries.includes(code)
                          ? 'bg-brand text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dry run */}
              <label className="mb-4 flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={dryRun}
                  onChange={(e) => setDryRun(e.target.checked)}
                  className="accent-brand"
                />
                <span className="text-xs text-slate-600 dark:text-slate-400">Dry-run (без записи)</span>
              </label>

              <button
                onClick={handleRun}
                disabled={launching || !serverOnline || selectedCountries.length === 0}
                className="w-full rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white disabled:opacity-40 hover:opacity-90 transition"
              >
                {launching ? 'Запускаю...' : '▶ Запустить'}
              </button>
            </div>

            {/* Quick links */}
            <div className="rounded-lg border border-slate-200/70 bg-white p-3 dark:border-slate-700/60 dark:bg-slate-900">
              <p className="mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">Быстрые ссылки</p>
              <div className="flex flex-col gap-1">
                <a href="/admin/staging" className="text-sm text-brand hover:underline">Staging area →</a>
                <a href="http://localhost:8082/docs" target="_blank" className="text-sm text-brand hover:underline">API Docs (Swagger) →</a>
              </div>
            </div>
          </div>

          {/* Right panel: jobs + logs */}
          <div className="flex flex-1 flex-col overflow-hidden">
            {/* Jobs list */}
            <div className="border-b border-slate-200/70 bg-white dark:border-slate-700/60 dark:bg-slate-900">
              <div className="flex items-center gap-2 px-4 py-3">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Задачи</p>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500 dark:bg-slate-800">{jobs.length}</span>
                <button onClick={loadJobs} className="ml-auto text-xs text-brand hover:underline">Обновить</button>
              </div>
              <div className="max-h-48 overflow-y-auto">
                {jobs.length === 0 ? (
                  <p className="px-4 pb-3 text-sm text-slate-400">Нет задач</p>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-800 text-xs text-slate-400">
                        <th className="px-4 py-2 text-left font-medium">Источник</th>
                        <th className="px-4 py-2 text-left font-medium">Страны</th>
                        <th className="px-4 py-2 text-left font-medium">Статус</th>
                        <th className="px-4 py-2 text-right font-medium">Записей</th>
                        <th className="px-4 py-2 text-right font-medium"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {jobs.map((job) => (
                        <tr
                          key={job.id}
                          onClick={() => connectLogs(job.id)}
                          className={`cursor-pointer border-b border-slate-50 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800 ${
                            activeJobId === job.id ? 'bg-brand/5' : ''
                          }`}
                        >
                          <td className="px-4 py-2 font-medium text-slate-700 dark:text-slate-300">{job.source}</td>
                          <td className="px-4 py-2 text-slate-500">{job.countries}</td>
                          <td className="px-4 py-2">
                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[job.status] || ''}`}>
                              {STATUS_LABELS[job.status] || job.status}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-right text-slate-500">{job.records_found || '—'}</td>
                          <td className="px-4 py-2 text-right">
                            {job.status === 'running' && (
                              <button
                                onClick={(e) => { e.stopPropagation(); handleCancel(job.id); }}
                                className="text-xs text-red-500 hover:underline"
                              >
                                Стоп
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* Log viewer */}
            <div className="flex flex-1 flex-col overflow-hidden bg-slate-950">
              <div className="flex items-center gap-2 border-b border-slate-800 px-4 py-2">
                <p className="text-xs font-semibold text-slate-400">
                  {activeJobId ? `Логи задачи: ${activeJobId.slice(0, 8)}...` : 'Выберите задачу для просмотра логов'}
                </p>
                {logs.length > 0 && (
                  <button
                    onClick={() => setLogs([])}
                    className="ml-auto text-xs text-slate-500 hover:text-slate-300"
                  >
                    Очистить
                  </button>
                )}
              </div>
              <div className="flex-1 overflow-y-auto p-4 font-mono text-xs leading-relaxed">
                {logs.length === 0 ? (
                  <p className="text-slate-600">
                    {activeJobId ? 'Ожидание логов...' : 'Нажмите на задачу чтобы увидеть логи'}
                  </p>
                ) : (
                  logs.map((log, i) => (
                    <div key={i} className={`flex gap-3 ${
                      log.line.includes('✓') || log.line.includes('▶') ? 'text-green-400' :
                      log.line.includes('✗') || log.line.includes('Error') || log.line.includes('Ошибка') ? 'text-red-400' :
                      log.line.includes('WARNING') || log.line.includes('⚠') ? 'text-yellow-400' :
                      log.line.includes('■') ? 'text-slate-400' :
                      'text-slate-300'
                    }`}>
                      {log.ts && (
                        <span className="flex-shrink-0 text-slate-600">
                          {log.ts.slice(11, 19)}
                        </span>
                      )}
                      <span className="break-all">{log.line}</span>
                    </div>
                  ))
                )}
                <div ref={logsEndRef} />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function StatusCard({ label, value, color }: { label: string; value: number; color: string }) {
  const colors: Record<string, string> = {
    blue:  'bg-blue-50 text-blue-700 dark:bg-blue-900/20',
    slate: 'bg-slate-50 text-slate-700 dark:bg-slate-800',
  };
  return (
    <div className={`rounded-lg p-3 ${colors[color]}`}>
      <p className="text-lg font-bold">{value}</p>
      <p className="text-xs opacity-70">{label}</p>
    </div>
  );
}

function ProviderBadge({ label, ok, active }: { label: string; ok: boolean; active?: boolean }) {
  return (
    <div className="flex items-center justify-between rounded px-2 py-1">
      <span className="text-xs text-slate-600 dark:text-slate-400">{label}</span>
      <div className="flex items-center gap-1">
        {active && <span className="text-xs text-brand">активен</span>}
        <span className={`h-2 w-2 rounded-full ${ok ? 'bg-green-400' : 'bg-slate-300 dark:bg-slate-600'}`} />
      </div>
    </div>
  );
}
