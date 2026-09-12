'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AdminNav } from '../../../components/admin-nav';
import { getAdminToken } from '../../../lib/admin-api';
import {
  fetchStaging,
  enrichStagingRecord,
  approveRecords,
  deleteRecord,
  updateStagingRecord,
  StagingRecord,
} from '../../../lib/pipeline-api';

const ENTITY_LABELS: Record<string, string> = {
  companies: 'Компании',
  schools: 'Школы',
  vacancies: 'Вакансии',
};

const SOURCE_LABELS: Record<string, string> = {
  hh: 'HH.ru', habr: 'Habr', djinni: 'Djinni',
  github: 'GitHub', telegram: 'Telegram',
  astana_hub: 'AstanaHub', manual_url: 'URL парсер', astanahub: 'AstanaHub',
};

export default function StagingPage() {
  const router = useRouter();
  const [records, setRecords] = useState<StagingRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [activeRecord, setActiveRecord] = useState<StagingRecord | null>(null);
  const [editedData, setEditedData] = useState<Record<string, unknown>>({});
  const [enriching, setEnriching] = useState<string | null>(null);
  const [approving, setApproving] = useState(false);
  const [editMode, setEditMode] = useState(false);

  // Фильтры
  const [filterEntity, setFilterEntity] = useState('');
  const [filterSource, setFilterSource] = useState('');
  const [filterReview, setFilterReview] = useState('');
  const [offset, setOffset] = useState(0);
  const PAGE_SIZE = 30;

  useEffect(() => {
    if (!getAdminToken()) router.push('/admin');
  }, [router]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Parameters<typeof fetchStaging>[0] = { status: 'pending', limit: PAGE_SIZE, offset };
      if (filterEntity) params.entity = filterEntity;
      if (filterSource) params.source = filterSource;
      if (filterReview === 'yes') params.needs_review = true;
      if (filterReview === 'no')  params.needs_review = false;
      const res = await fetchStaging(params);
      setRecords(res.records);
      setTotal(res.total);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [filterEntity, filterSource, filterReview, offset]);

  useEffect(() => { load(); }, [load]);

  const openRecord = (r: StagingRecord) => {
    setActiveRecord(r);
    setEditedData({ ...r.data });
    setEditMode(false);
  };

  const toggleSelect = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const selectAll = () =>
    setSelected(selected.size === records.length ? new Set() : new Set(records.map((r) => r.id)));

  const handleEnrich = async (id: string) => {
    setEnriching(id);
    try {
      const res = await enrichStagingRecord(id);
      setRecords((prev) => prev.map((r) => r.id === id ? { ...r, ai_data: res.ai_data } : r));
      if (activeRecord?.id === id) setActiveRecord((prev) => prev ? { ...prev, ai_data: res.ai_data } : prev);
    } catch (e: unknown) {
      alert(`AI ошибка: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setEnriching(null);
    }
  };

  const handleSaveEdit = async () => {
    if (!activeRecord) return;
    await updateStagingRecord(activeRecord.id, editedData);
    setRecords((prev) => prev.map((r) => r.id === activeRecord.id ? { ...r, data: editedData } : r));
    setActiveRecord((prev) => prev ? { ...prev, data: editedData } : prev);
    setEditMode(false);
  };

  const handleApprove = async (ids: string[]) => {
    setApproving(true);
    try {
      const res = await approveRecords(ids);
      if (res.errors.length > 0) {
        alert(`Ошибки: ${res.errors.map((e) => `${e.id.slice(0, 6)}: ${e.error}`).join('\n')}`);
      }
      setSelected(new Set());
      if (activeRecord && ids.includes(activeRecord.id)) setActiveRecord(null);
      load();
    } catch (e: unknown) {
      alert(`Ошибка: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setApproving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить запись?')) return;
    await deleteRecord(id);
    if (activeRecord?.id === id) setActiveRecord(null);
    setSelected((prev) => { const next = new Set(prev); next.delete(id); return next; });
    load();
  };

  const applyAI = () => {
    if (!activeRecord?.ai_data) return;
    const ai = activeRecord.ai_data;
    setEditedData((prev) => {
      const next = { ...prev };
      for (const key of ['industry', 'work_formats', 'has_internship', 'stack', 'size_category'] as const) {
        if (ai[key] != null && !prev[key]) next[key] = ai[key];
      }
      if (ai.description_ru && !prev.description) next.description = ai.description_ru as string;
      return next;
    });
    setEditMode(true);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
      <AdminNav />
      <main className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex items-center gap-3 border-b border-slate-200/70 bg-white px-6 py-4 dark:border-slate-700/60 dark:bg-slate-900">
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Staging Area</h1>
            <p className="text-xs text-slate-500">Проверка и одобрение данных перед загрузкой в БД</p>
          </div>
          <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-700">
            {total} записей
          </span>
        </header>

        <div className="flex flex-1 overflow-hidden">
          {/* List panel */}
          <div className="flex w-96 flex-shrink-0 flex-col border-r border-slate-200/70 bg-white dark:border-slate-700/60 dark:bg-slate-900">
            {/* Filters */}
            <div className="flex flex-col gap-2 border-b border-slate-100 p-3 dark:border-slate-800">
              <div className="flex gap-2">
                <select
                  value={filterEntity}
                  onChange={(e) => { setFilterEntity(e.target.value); setOffset(0); }}
                  className="flex-1 rounded border border-slate-200 bg-white px-2 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-800"
                >
                  <option value="">Все сущности</option>
                  {Object.entries(ENTITY_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
                <select
                  value={filterSource}
                  onChange={(e) => { setFilterSource(e.target.value); setOffset(0); }}
                  className="flex-1 rounded border border-slate-200 bg-white px-2 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-800"
                >
                  <option value="">Все источники</option>
                  {Object.entries(SOURCE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
                <select
                  value={filterReview}
                  onChange={(e) => { setFilterReview(e.target.value); setOffset(0); }}
                  className="flex-1 rounded border border-slate-200 bg-white px-2 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-800"
                >
                  <option value="">Все</option>
                  <option value="yes">Нужна проверка</option>
                  <option value="no">Проверено</option>
                </select>
              </div>

              {/* Batch actions */}
              {selected.size > 0 && (
                <div className="flex items-center gap-2 rounded-lg bg-brand/10 px-3 py-2">
                  <span className="flex-1 text-xs font-medium text-brand">Выбрано: {selected.size}</span>
                  <button
                    onClick={() => handleApprove(Array.from(selected))}
                    disabled={approving}
                    className="rounded bg-brand px-3 py-1 text-xs font-semibold text-white disabled:opacity-50 hover:opacity-90"
                  >
                    {approving ? '...' : 'Одобрить'}
                  </button>
                </div>
              )}
            </div>

            {/* Records list */}
            <div className="flex-1 overflow-y-auto">
              {/* Select all row */}
              <div className="flex items-center gap-2 border-b border-slate-100 px-3 py-2 dark:border-slate-800">
                <input
                  type="checkbox"
                  checked={selected.size === records.length && records.length > 0}
                  onChange={selectAll}
                  className="accent-brand"
                />
                <span className="text-xs text-slate-400">Выбрать все</span>
              </div>

              {loading ? (
                <p className="p-4 text-sm text-slate-400">Загрузка...</p>
              ) : records.length === 0 ? (
                <p className="p-4 text-sm text-slate-400">Записей нет</p>
              ) : (
                records.map((r) => (
                  <div
                    key={r.id}
                    onClick={() => openRecord(r)}
                    className={`flex cursor-pointer items-start gap-2 border-b border-slate-50 px-3 py-2.5 transition hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800 ${
                      activeRecord?.id === r.id ? 'bg-brand/5 border-l-2 border-l-brand' : ''
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selected.has(r.id)}
                      onClick={(e) => e.stopPropagation()}
                      onChange={() => toggleSelect(r.id)}
                      className="mt-0.5 flex-shrink-0 accent-brand"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate text-sm font-medium text-slate-800 dark:text-slate-200">
                          {String(r.data.name || r.external_id || r.id.slice(0, 8))}
                        </span>
                        {!!r.data.needs_review && (
                          <span className="flex-shrink-0 rounded-full bg-yellow-100 px-1.5 py-0.5 text-xs text-yellow-700">!</span>
                        )}
                        {r.ai_data && (
                          <span className="flex-shrink-0 rounded-full bg-purple-100 px-1.5 py-0.5 text-xs text-purple-700">AI</span>
                        )}
                      </div>
                      <div className="mt-0.5 flex gap-1.5 text-xs text-slate-400">
                        <span>{SOURCE_LABELS[r.source] || r.source}</span>
                        <span>·</span>
                        <span>{ENTITY_LABELS[r.entity] || r.entity}</span>
                        {r.data.country != null && <><span>·</span><span>{String(r.data.country)}</span></>}
                      </div>
                      {Array.isArray(r.data.stack) && (r.data.stack as string[]).length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {(r.data.stack as string[]).slice(0, 4).map((s) => (
                            <span key={s} className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-500 dark:bg-slate-700">
                              {s}
                            </span>
                          ))}
                          {(r.data.stack as string[]).length > 4 && (
                            <span className="text-xs text-slate-400">+{(r.data.stack as string[]).length - 4}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Pagination */}
            {total > PAGE_SIZE && (
              <div className="flex items-center justify-between border-t border-slate-100 px-3 py-2 text-xs dark:border-slate-800">
                <button onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))} disabled={offset === 0} className="text-brand disabled:opacity-30">← Назад</button>
                <span className="text-slate-400">{offset + 1}–{Math.min(offset + PAGE_SIZE, total)} из {total}</span>
                <button onClick={() => setOffset(offset + PAGE_SIZE)} disabled={offset + PAGE_SIZE >= total} className="text-brand disabled:opacity-30">Далее →</button>
              </div>
            )}
          </div>

          {/* Detail panel */}
          <div className="flex flex-1 flex-col overflow-hidden">
            {!activeRecord ? (
              <div className="flex flex-1 items-center justify-center">
                <p className="text-slate-400">Выберите запись для просмотра</p>
              </div>
            ) : (
              <>
                {/* Detail header */}
                <div className="flex items-center gap-3 border-b border-slate-200/70 bg-white px-6 py-3 dark:border-slate-700/60 dark:bg-slate-900">
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-semibold text-slate-900 dark:text-slate-100">
                      {String(activeRecord.data.name || activeRecord.external_id || '—')}
                    </p>
                    <p className="text-xs text-slate-500">
                      {SOURCE_LABELS[activeRecord.source] || activeRecord.source}
                      {' · '}{ENTITY_LABELS[activeRecord.entity]}
                      {' · '}{activeRecord.created_at.slice(0, 10)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEnrich(activeRecord.id)}
                      disabled={enriching === activeRecord.id}
                      className="rounded-lg border border-purple-200 bg-purple-50 px-3 py-1.5 text-xs font-medium text-purple-700 hover:bg-purple-100 disabled:opacity-50"
                    >
                      {enriching === activeRecord.id ? 'AI думает...' : '✨ AI обогащение'}
                    </button>
                    {activeRecord.ai_data && !editMode && (
                      <button
                        onClick={applyAI}
                        className="rounded-lg border border-purple-200 bg-purple-50 px-3 py-1.5 text-xs font-medium text-purple-700 hover:bg-purple-100"
                      >
                        Применить AI
                      </button>
                    )}
                    {editMode ? (
                      <>
                        <button onClick={handleSaveEdit} className="rounded-lg bg-brand px-3 py-1.5 text-xs font-medium text-white hover:opacity-90">Сохранить</button>
                        <button onClick={() => { setEditMode(false); setEditedData({ ...activeRecord.data }); }} className="rounded-lg border px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50">Отмена</button>
                      </>
                    ) : (
                      <button onClick={() => setEditMode(true)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">Редактировать</button>
                    )}
                    <button
                      onClick={() => handleApprove([activeRecord.id])}
                      disabled={approving}
                      className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                    >
                      {approving ? '...' : 'Одобрить →'}
                    </button>
                    <button onClick={() => handleDelete(activeRecord.id)} className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50">Удалить</button>
                  </div>
                </div>

                {/* Content */}
                <div className="flex flex-1 overflow-hidden">
                  {/* Current data */}
                  <div className="flex flex-1 flex-col overflow-y-auto p-4">
                    <p className="mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      {editMode ? 'Редактирование' : 'Данные'}
                    </p>
                    {editMode ? (
                      <RecordEditor data={editedData} onChange={setEditedData} />
                    ) : (
                      <RecordView data={activeRecord.data} />
                    )}
                  </div>

                  {/* AI suggestions */}
                  {activeRecord.ai_data && (
                    <div className="w-72 flex-shrink-0 overflow-y-auto border-l border-slate-200/70 bg-purple-50/50 p-4 dark:border-slate-700/60 dark:bg-purple-900/10">
                      <p className="mb-2 text-xs font-semibold text-purple-700 uppercase tracking-wide">AI предлагает</p>
                      <RecordView data={activeRecord.ai_data} highlight />
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function RecordView({ data, highlight }: { data: Record<string, unknown>; highlight?: boolean }) {
  const fields = [
    ['name', 'Название'],
    ['description', 'Описание'],
    ['description_ru', 'Описание (RU)'],
    ['industry', 'Индустрия'],
    ['country', 'Страна'],
    ['city', 'Город'],
    ['website', 'Сайт'],
    ['employee_count', 'Сотрудников'],
    ['size_category', 'Размер'],
    ['has_internship', 'Стажировки'],
    ['work_formats', 'Формат работы'],
    ['stack', 'Стек'],
    ['open_vacancies', 'Вакансий'],
    ['needs_review', 'Нужна проверка'],
    ['source', 'Источник'],
    ['external_id', 'External ID'],
  ];

  return (
    <div className="flex flex-col gap-2">
      {fields.map(([key, label]) => {
        const val = data[key];
        if (val == null || val === '' || (Array.isArray(val) && val.length === 0)) return null;
        return (
          <div key={key} className={`rounded-lg p-2.5 ${highlight ? 'bg-purple-50 dark:bg-purple-900/20' : 'bg-white dark:bg-slate-900'} border border-slate-100 dark:border-slate-800`}>
            <p className="mb-0.5 text-xs font-medium text-slate-500">{label}</p>
            {Array.isArray(val) ? (
              <div className="flex flex-wrap gap-1">
                {(val as string[]).map((v) => (
                  <span key={v} className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600 dark:bg-slate-700 dark:text-slate-300">{v}</span>
                ))}
              </div>
            ) : typeof val === 'boolean' ? (
              <span className={`text-sm font-medium ${val ? 'text-green-600' : 'text-slate-400'}`}>{val ? 'Да' : 'Нет'}</span>
            ) : (
              <p className="text-sm text-slate-800 dark:text-slate-200 break-words">{String(val)}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}

function RecordEditor({
  data,
  onChange,
}: {
  data: Record<string, unknown>;
  onChange: (d: Record<string, unknown>) => void;
}) {
  const set = (key: string, val: unknown) => onChange({ ...data, [key]: val });

  const textFields: [string, string][] = [
    ['name', 'Название'],
    ['description', 'Описание'],
    ['website', 'Сайт'],
    ['country', 'Страна (KZ / UZ / ...)'],
    ['city', 'Город'],
    ['industry', 'Индустрия'],
    ['employee_count', 'Сотрудников'],
  ];

  return (
    <div className="flex flex-col gap-3">
      {textFields.map(([key, label]) => (
        <div key={key}>
          <label className="mb-1 block text-xs font-medium text-slate-500">{label}</label>
          {key === 'description' ? (
            <textarea
              value={String(data[key] || '')}
              onChange={(e) => set(key, e.target.value)}
              rows={4}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
            />
          ) : (
            <input
              type="text"
              value={String(data[key] || '')}
              onChange={(e) => set(key, e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
            />
          )}
        </div>
      ))}

      {/* Stack */}
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-500">Стек (через запятую)</label>
        <input
          type="text"
          value={Array.isArray(data.stack) ? (data.stack as string[]).join(', ') : ''}
          onChange={(e) => set('stack', e.target.value.split(',').map((s) => s.trim()).filter(Boolean))}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
          placeholder="Python, Go, React, PostgreSQL"
        />
      </div>

      {/* Booleans */}
      <div className="flex gap-4">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={!!data.has_internship} onChange={(e) => set('has_internship', e.target.checked)} className="accent-brand" />
          Стажировки
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={!!data.needs_review} onChange={(e) => set('needs_review', e.target.checked)} className="accent-brand" />
          Нужна проверка
        </label>
      </div>
    </div>
  );
}
