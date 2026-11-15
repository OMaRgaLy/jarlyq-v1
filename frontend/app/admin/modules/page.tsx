'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminNav } from '../../../components/admin-nav';
import {
  getAdminToken,
  fetchAdminModules,
  updateAdminModule,
  applyModulePreset,
  AdminModule,
  ModuleState,
  MODULE_PRESETS,
} from '../../../lib/admin-api';

const STATES: { value: ModuleState; label: string; active: string }[] = [
  { value: 'on', label: 'Включён', active: 'bg-emerald-600 text-white' },
  { value: 'soon', label: 'Скоро', active: 'bg-amber-500 text-white' },
  { value: 'off', label: 'Скрыт', active: 'bg-slate-600 text-white' },
];

export default function AdminModulesPage() {
  const router = useRouter();
  const [modules, setModules] = useState<AdminModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const reload = useCallback(async () => {
    try {
      setModules(await fetchAdminModules());
      setError('');
    } catch {
      setError('Не удалось загрузить модули. Проверь, что бэкенд запущен.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!getAdminToken()) { router.push('/admin'); return; }
    reload();
  }, [router, reload]);

  const errText = (e: unknown) => {
    const status = (e as { response?: { status?: number } })?.response?.status;
    if (status === 401 || status === 403) return 'Нет доступа (403). Войди в админку заново.';
    return 'Не удалось сохранить. Попробуй ещё раз.';
  };

  const replace = (m: AdminModule) =>
    setModules((list) => list.map((x) => (x.key === m.key ? m : x)));

  const setState = async (key: string, state: ModuleState) => {
    setBusyKey(key);
    setError('');
    try {
      replace(await updateAdminModule(key, { state }));
    } catch (e) {
      setError(errText(e));
    } finally {
      setBusyKey(null);
    }
  };

  const saveDescription = async (m: AdminModule) => {
    const value = drafts[m.key];
    if (value === undefined || value === m.description) return;
    setBusyKey(m.key);
    setError('');
    try {
      replace(await updateAdminModule(m.key, { description: value }));
      setDrafts((d) => { const { [m.key]: _, ...rest } = d; return rest; });
    } catch (e) {
      setError(errText(e));
    } finally {
      setBusyKey(null);
    }
  };

  const preset = async (value: 'mvp' | 'all', label: string) => {
    if (!confirm(`Применить «${label}»? Состояние всех разделов изменится.`)) return;
    setBusyKey('*');
    setError('');
    try {
      setModules(await applyModulePreset(value));
    } catch (e) {
      setError(errText(e));
    } finally {
      setBusyKey(null);
    }
  };

  const counts = {
    on: modules.filter((m) => m.state === 'on').length,
    soon: modules.filter((m) => m.state === 'soon').length,
    off: modules.filter((m) => m.state === 'off').length,
  };

  return (
    <div className="flex min-h-screen">
      <AdminNav />
      <main className="flex-1 overflow-auto p-8">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Модули сайта</h1>
          <div className="flex flex-wrap gap-2">
            {MODULE_PRESETS.map((p) => (
              <button
                key={p.value}
                title={p.hint}
                disabled={busyKey !== null}
                onClick={() => preset(p.value, p.label)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-brand hover:text-brand disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
        <p className="mb-6 max-w-3xl text-sm text-slate-500 dark:text-slate-400">
          <b>Включён</b> — раздел работает. <b>Скоро</b> — виден в меню с пометкой, внутри — заглушка с описанием,
          а на главной появляется блок «Скоро на Jarlyq». <b>Скрыт</b> — раздела нет ни в меню, ни по прямой ссылке.
          Изменения видны посетителям после обновления страницы. Модули управляют только интерфейсом: данные
          по-прежнему доступны через API.
        </p>

        {error && (
          <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-300">
            {error}
          </div>
        )}

        {loading ? (
          <p className="text-slate-500">Загружаем...</p>
        ) : (
          <>
            <p className="mb-3 text-xs text-slate-400">
              Включено: {counts.on} · Скоро: {counts.soon} · Скрыто: {counts.off}
            </p>
            <ul className="space-y-3">
              {modules.map((m) => {
                const draft = drafts[m.key] ?? m.description;
                const busy = busyKey === m.key || busyKey === '*';
                return (
                  <li key={m.key} className="rounded-xl border border-slate-200/70 bg-white p-4 dark:border-slate-700/60 dark:bg-slate-900">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">{m.label}</p>
                        <p className="text-xs text-slate-400">/{m.key === 'auth' ? 'вход и регистрация' : m.key}</p>
                      </div>
                      <div role="group" aria-label={`Состояние: ${m.label}`} className="inline-flex overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
                        {STATES.map((s) => (
                          <button
                            key={s.value}
                            type="button"
                            disabled={busy}
                            aria-pressed={m.state === s.value}
                            onClick={() => m.state !== s.value && setState(m.key, s.value)}
                            className={`px-3 py-1.5 text-sm font-medium transition disabled:opacity-60 ${
                              m.state === s.value
                                ? s.active
                                : 'bg-white text-slate-600 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
                            }`}
                          >
                            {s.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <label className="mt-3 block text-xs font-medium text-slate-500">
                      Описание (показывается на заглушке «Скоро» и в блоке на главной)
                      <textarea
                        value={draft}
                        rows={2}
                        disabled={busy}
                        onChange={(e) => setDrafts((d) => ({ ...d, [m.key]: e.target.value }))}
                        onBlur={() => saveDescription(m)}
                        className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                    </label>
                  </li>
                );
              })}
            </ul>
            <AuthHint modules={modules} />
          </>
        )}
      </main>
    </div>
  );
}

// Regular users can't log in unless the "auth" module is on — worth a visible warning.
function AuthHint({ modules }: { modules: AdminModule[] }) {
  const auth = modules.find((m) => m.key === 'auth');
  if (!auth || auth.state === 'on') return null;
  return (
    <p className="mt-4 text-sm text-amber-700 dark:text-amber-300">
      Модуль «{auth.label}» не включён: кнопка входа в шапке скрыта. Админка по адресу /admin работает всегда.
    </p>
  );
}
