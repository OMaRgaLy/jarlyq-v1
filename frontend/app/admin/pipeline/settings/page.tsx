'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AdminNav } from '../../../../components/admin-nav';
import { getAdminToken } from '../../../../lib/admin-api';
import {
  fetchProviders,
  fetchEnvConfig,
  updateEnvConfig,
  fetchChannels,
  updateChannels,
  testProvider,
  AIProvider,
} from '../../../../lib/pipeline-api';

const ENV_GROUPS: { label: string; keys: { key: string; label: string; hint: string; secret?: boolean }[] }[] = [
  {
    label: 'Jarlyq API',
    keys: [
      { key: 'JARLYQ_API_URL',      label: 'API URL',            hint: 'http://localhost:8080/api/v1' },
      { key: 'JARLYQ_ADMIN_TOKEN',  label: 'Admin JWT Token',    hint: 'Из браузера после логина в /admin', secret: true },
      { key: 'ADMIN_EMAIL',         label: 'Admin Email',        hint: 'Если нет токена — используем email+пароль' },
      { key: 'ADMIN_PASSWORD',      label: 'Admin Password',     hint: 'Пароль администратора', secret: true },
    ],
  },
  {
    label: 'AI провайдеры',
    keys: [
      { key: 'AI_PROVIDER',    label: 'Активный провайдер',  hint: 'groq | gemini | ollama' },
      { key: 'GROQ_API_KEY',   label: 'Groq API Key',        hint: 'console.groq.com → бесплатно', secret: true },
      { key: 'GEMINI_API_KEY', label: 'Gemini API Key',      hint: 'aistudio.google.com → бесплатно', secret: true },
      { key: 'OLLAMA_URL',     label: 'Ollama URL',          hint: 'http://localhost:11434' },
      { key: 'OLLAMA_MODEL',   label: 'Ollama модель',       hint: 'qwen3:8b | kimi | llama3.2' },
    ],
  },
  {
    label: 'GitHub',
    keys: [
      { key: 'GITHUB_TOKEN', label: 'GitHub Token', hint: 'github.com/settings/tokens (scope: public_repo)', secret: true },
    ],
  },
  {
    label: 'Telegram (парсер каналов)',
    keys: [
      { key: 'TG_API_ID',   label: 'API ID',    hint: 'my.telegram.org → API development tools' },
      { key: 'TG_API_HASH', label: 'API Hash',  hint: 'my.telegram.org → API development tools', secret: true },
      { key: 'TG_PHONE',    label: 'Телефон',   hint: '+77001234567' },
    ],
  },
];

type TgChannel = { username: string; country: string; lang: string; note: string };

const COUNTRIES = ['KZ', 'UZ', 'KG', 'RU', 'BY', 'AZ', 'AM', 'GE', 'TR'];

export default function PipelineSettingsPage() {
  const router = useRouter();
  const [providers, setProviders]           = useState<AIProvider[]>([]);
  const [envConfig, setEnvConfig]           = useState<Record<string, { set: boolean; preview: string }>>({});
  const [envEdits, setEnvEdits]             = useState<Record<string, string>>({});
  const [showSecret, setShowSecret]         = useState<Record<string, boolean>>({});
  const [savingEnv, setSavingEnv]           = useState(false);
  const [savedEnv, setSavedEnv]             = useState(false);
  const [testingProvider, setTestingProvider] = useState<string | null>(null);
  const [testResults, setTestResults]       = useState<Record<string, 'ok' | 'error' | null>>({});

  const [channels, setChannels]             = useState<TgChannel[]>([]);
  const [tgSettings, setTgSettings]         = useState<Record<string, unknown>>({});
  const [savingChannels, setSavingChannels] = useState(false);
  const [newChannel, setNewChannel]         = useState<TgChannel>({ username: '', country: 'KZ', lang: 'ru', note: '' });

  useEffect(() => { if (!getAdminToken()) router.push('/admin'); }, [router]);

  const load = useCallback(async () => {
    try {
      const [p, e, ch] = await Promise.all([fetchProviders(), fetchEnvConfig(), fetchChannels()]);
      setProviders(p);
      setEnvConfig(e);
      setChannels(ch.channels || []);
      setTgSettings(ch.settings || {});
    } catch {}
  }, []);

  useEffect(() => { load(); }, [load]);

  const setEnvEdit = (key: string, val: string) =>
    setEnvEdits((prev) => ({ ...prev, [key]: val }));

  const handleSaveEnv = async () => {
    const toSave = Object.fromEntries(
      Object.entries(envEdits).filter(([, v]) => v.trim() !== '')
    );
    if (Object.keys(toSave).length === 0) return;
    setSavingEnv(true);
    try {
      await updateEnvConfig(toSave);
      setSavedEnv(true);
      setEnvEdits({});
      await load();
      setTimeout(() => setSavedEnv(false), 2000);
    } catch (e: unknown) {
      alert(`Ошибка: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setSavingEnv(false);
    }
  };

  const handleTestProvider = async (id: string) => {
    setTestingProvider(id);
    setTestResults((prev) => ({ ...prev, [id]: null }));
    try {
      await testProvider(id);
      setTestResults((prev) => ({ ...prev, [id]: 'ok' }));
    } catch {
      setTestResults((prev) => ({ ...prev, [id]: 'error' }));
    } finally {
      setTestingProvider(null);
    }
  };

  const addChannel = () => {
    if (!newChannel.username.trim()) return;
    const username = newChannel.username.replace(/^@/, '').trim();
    setChannels((prev) => [...prev, { ...newChannel, username }]);
    setNewChannel({ username: '', country: 'KZ', lang: 'ru', note: '' });
  };

  const removeChannel = (i: number) =>
    setChannels((prev) => prev.filter((_, idx) => idx !== i));

  const handleSaveChannels = async () => {
    setSavingChannels(true);
    try {
      await updateChannels(channels, tgSettings);
    } catch (e: unknown) {
      alert(`Ошибка: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setSavingChannels(false);
    }
  };

  const pendingChanges = Object.values(envEdits).some((v) => v.trim() !== '');

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
      <AdminNav />
      <main className="flex flex-1 flex-col overflow-y-auto">
        <header className="flex items-center gap-3 border-b border-slate-200/70 bg-white px-6 py-4 dark:border-slate-700/60 dark:bg-slate-900">
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Настройки Pipeline</h1>
            <p className="text-xs text-slate-500">AI провайдеры, API ключи, Telegram каналы</p>
          </div>
          <a href="/admin/pipeline" className="text-sm text-brand hover:underline">← Парсеры</a>
        </header>

        <div className="mx-auto w-full max-w-3xl space-y-6 p-6">

          {/* AI Providers status */}
          <section>
            <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">AI провайдеры</h2>
            <div className="grid grid-cols-3 gap-3">
              {providers.map((p) => (
                <div key={p.id} className={`rounded-xl border p-4 ${
                  p.active ? 'border-brand/30 bg-brand/5' : 'border-slate-200/70 bg-white dark:border-slate-700/60 dark:bg-slate-900'
                }`}>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{p.name}</span>
                    <div className="flex items-center gap-1.5">
                      {p.active && <span className="rounded-full bg-brand/20 px-2 py-0.5 text-xs font-medium text-brand">активен</span>}
                      <span className={`h-2 w-2 rounded-full ${p.configured ? 'bg-green-400' : 'bg-slate-300 dark:bg-slate-600'}`} />
                    </div>
                  </div>
                  <p className="mb-3 text-xs text-slate-400">{p.note}</p>
                  {p.configured && (
                    <button
                      onClick={() => handleTestProvider(p.id)}
                      disabled={testingProvider === p.id}
                      className="w-full rounded-lg border border-slate-200 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
                    >
                      {testingProvider === p.id ? 'Проверяю...' :
                       testResults[p.id] === 'ok' ? '✓ Работает' :
                       testResults[p.id] === 'error' ? '✗ Ошибка' :
                       'Проверить связь'}
                    </button>
                  )}
                  {!p.configured && (
                    <p className="text-center text-xs text-slate-400">Не настроен</p>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* ENV editor */}
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">API ключи (.env)</h2>
              {pendingChanges && (
                <button
                  onClick={handleSaveEnv}
                  disabled={savingEnv}
                  className="rounded-lg bg-brand px-4 py-1.5 text-sm font-semibold text-white disabled:opacity-50 hover:opacity-90"
                >
                  {savingEnv ? 'Сохраняю...' : savedEnv ? '✓ Сохранено' : 'Сохранить изменения'}
                </button>
              )}
            </div>

            <div className="space-y-4">
              {ENV_GROUPS.map((group) => (
                <div key={group.label} className="rounded-xl border border-slate-200/70 bg-white dark:border-slate-700/60 dark:bg-slate-900">
                  <div className="border-b border-slate-100 px-4 py-2.5 dark:border-slate-800">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{group.label}</p>
                  </div>
                  <div className="divide-y divide-slate-50 dark:divide-slate-800">
                    {group.keys.map(({ key, label, hint, secret }) => {
                      const current = envConfig[key];
                      const editing = envEdits[key] ?? '';
                      const isSet   = current?.set;
                      const reveal  = showSecret[key];

                      return (
                        <div key={key} className="flex items-center gap-3 px-4 py-3">
                          <div className="w-40 flex-shrink-0">
                            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</p>
                            <p className="text-xs text-slate-400">{hint}</p>
                          </div>
                          <div className="flex flex-1 items-center gap-2">
                            {/* Current value indicator */}
                            {isSet && !editing && (
                              <div className="flex items-center gap-1.5 rounded-lg bg-green-50 px-2.5 py-1.5 dark:bg-green-900/20">
                                <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                                <span className="font-mono text-xs text-green-700 dark:text-green-400">
                                  {secret && !reveal ? '••••' : current.preview}
                                </span>
                                {secret && (
                                  <button
                                    onClick={() => setShowSecret((p) => ({ ...p, [key]: !p[key] }))}
                                    className="text-xs text-slate-400 hover:text-slate-600"
                                  >
                                    {reveal ? 'скрыть' : 'показать'}
                                  </button>
                                )}
                              </div>
                            )}
                            {!isSet && !editing && (
                              <span className="text-xs text-slate-400">не задан</span>
                            )}
                            {/* Edit input */}
                            <input
                              type={secret && !reveal ? 'password' : 'text'}
                              value={editing}
                              onChange={(e) => setEnvEdit(key, e.target.value)}
                              placeholder={isSet ? 'Изменить значение...' : 'Вставить ключ...'}
                              className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 font-mono text-xs placeholder-slate-300 focus:border-brand focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800"
                            />
                            {editing && (
                              <button
                                onClick={() => setEnvEdit(key, '')}
                                className="text-xs text-slate-400 hover:text-slate-600"
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {pendingChanges && (
              <div className="mt-3 flex justify-end">
                <button
                  onClick={handleSaveEnv}
                  disabled={savingEnv}
                  className="rounded-lg bg-brand px-6 py-2 text-sm font-semibold text-white disabled:opacity-50 hover:opacity-90"
                >
                  {savingEnv ? 'Сохраняю...' : savedEnv ? '✓ Сохранено' : 'Сохранить изменения'}
                </button>
              </div>
            )}

            <p className="mt-2 text-xs text-slate-400">
              Изменения записываются в корневой .env. Секретные поля (JWT, DB пароль) недоступны из UI.
            </p>
          </section>

          {/* Telegram channels */}
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Telegram каналы</h2>
              <button
                onClick={handleSaveChannels}
                disabled={savingChannels}
                className="rounded-lg bg-brand px-4 py-1.5 text-sm font-semibold text-white disabled:opacity-50 hover:opacity-90"
              >
                {savingChannels ? 'Сохраняю...' : 'Сохранить список'}
              </button>
            </div>

            <div className="rounded-xl border border-slate-200/70 bg-white dark:border-slate-700/60 dark:bg-slate-900">
              {/* Add new */}
              <div className="border-b border-slate-100 p-4 dark:border-slate-800">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Добавить канал</p>
                <div className="flex gap-2">
                  <input
                    value={newChannel.username}
                    onChange={(e) => setNewChannel((p) => ({ ...p, username: e.target.value }))}
                    placeholder="@username или t.me/..."
                    className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                    onKeyDown={(e) => e.key === 'Enter' && addChannel()}
                  />
                  <select
                    value={newChannel.country}
                    onChange={(e) => setNewChannel((p) => ({ ...p, country: e.target.value }))}
                    className="w-20 rounded-lg border border-slate-200 px-2 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                  >
                    {COUNTRIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                  <input
                    value={newChannel.note}
                    onChange={(e) => setNewChannel((p) => ({ ...p, note: e.target.value }))}
                    placeholder="Описание (необязательно)"
                    className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
                  />
                  <button
                    onClick={addChannel}
                    className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Channel list */}
              {channels.length === 0 ? (
                <p className="p-4 text-sm text-slate-400">Нет каналов</p>
              ) : (
                <div className="divide-y divide-slate-50 dark:divide-slate-800">
                  {channels.map((ch, i) => (
                    <div key={i} className="flex items-center gap-3 px-4 py-3">
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                        {ch.country}
                      </span>
                      <a
                        href={`https://t.me/${ch.username}`}
                        target="_blank"
                        className="flex-1 font-mono text-sm text-brand hover:underline"
                      >
                        @{ch.username}
                      </a>
                      <span className="text-xs text-slate-400">{ch.note}</span>
                      <button
                        onClick={() => removeChannel(i)}
                        className="text-xs text-red-400 hover:text-red-600"
                      >
                        Удалить
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Settings */}
              <div className="border-t border-slate-100 p-4 dark:border-slate-800">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Параметры парсинга</p>
                <div className="flex gap-4">
                  <label className="flex flex-col gap-1">
                    <span className="text-xs text-slate-500">Дней назад</span>
                    <input
                      type="number"
                      value={Number(tgSettings.days_back ?? 7)}
                      onChange={(e) => setTgSettings((p) => ({ ...p, days_back: Number(e.target.value) }))}
                      className="w-24 rounded-lg border border-slate-200 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-800"
                      min={1} max={30}
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-xs text-slate-500">Макс. сообщений</span>
                    <input
                      type="number"
                      value={Number(tgSettings.max_messages_per_channel ?? 200)}
                      onChange={(e) => setTgSettings((p) => ({ ...p, max_messages_per_channel: Number(e.target.value) }))}
                      className="w-28 rounded-lg border border-slate-200 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-800"
                      min={10} max={1000}
                    />
                  </label>
                </div>
              </div>
            </div>
          </section>

        </div>
      </main>
    </div>
  );
}
