'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AdminNav } from '../../../components/admin-nav';
import {
  getAdminToken,
  fetchAdminResources,
  createAdminResource,
  updateAdminResource,
  deleteAdminResource,
  AdminResource,
  ResourceForm,
  RESOURCE_CATEGORIES,
} from '../../../lib/admin-api';

const emptyForm: ResourceForm = {
  title: '', url: '', description: '', category: 'courses', subcategory: '',
  is_free: true, language: 'ru', difficulty: '', country_focus: '', is_active: true, sort_order: 0,
};

export default function AdminResourcesPage() {
  const router = useRouter();
  const [resources, setResources] = useState<AdminResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<AdminResource | null>(null);
  const [form, setForm] = useState<ResourceForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [filterCat, setFilterCat] = useState('');

  const reload = useCallback(() => {
    fetchAdminResources().then(setResources).catch(() => router.push('/admin'));
  }, [router]);

  useEffect(() => {
    if (!getAdminToken()) { router.push('/admin'); return; }
    reload();
    setLoading(false);
  }, [router, reload]);

  const openCreate = () => { setEditing(null); setForm(emptyForm); setShowForm(true); };
  const openEdit = (r: AdminResource) => {
    setEditing(r);
    setForm({
      title: r.title, url: r.url, description: r.description ?? '',
      category: r.category, subcategory: r.subcategory ?? '',
      is_free: r.isFree, language: r.language, difficulty: r.difficulty ?? '',
      country_focus: r.countryFocus ?? '', is_active: r.isActive, sort_order: r.sortOrder,
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editing) await updateAdminResource(editing.id, form);
      else await createAdminResource(form);
      setShowForm(false);
      reload();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить ресурс?')) return;
    await deleteAdminResource(id);
    reload();
  };

  const catLabel = (v: string) => RESOURCE_CATEGORIES.find(c => c.value === v)?.label ?? v;

  const displayed = filterCat ? resources.filter(r => r.category === filterCat) : resources;

  // Group by category for display
  const grouped = displayed.reduce<Record<string, AdminResource[]>>((acc, r) => {
    (acc[r.category] = acc[r.category] ?? []).push(r);
    return acc;
  }, {});

  return (
    <div className="flex min-h-screen">
      <AdminNav />
      <main className="flex-1 overflow-auto p-8">
        <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Ресурсы</h1>
          <div className="flex items-center gap-3">
            <select
              value={filterCat}
              onChange={e => setFilterCat(e.target.value)}
              className="rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
              <option value="">Все категории</option>
              {RESOURCE_CATEGORIES.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
            <button onClick={openCreate} className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark">
              + Добавить
            </button>
          </div>
        </div>

        {loading ? <p className="text-slate-500">Загружаем...</p> : (
          <div className="space-y-8">
            {Object.entries(grouped).map(([cat, items]) => (
              <div key={cat}>
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-400">{catLabel(cat)} ({items.length})</h2>
                <div className="space-y-2">
                  {items.map(r => (
                    <div key={r.id} className="flex items-start gap-3 rounded-xl border border-slate-200/70 bg-white px-4 py-3 dark:border-slate-700/60 dark:bg-slate-900">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <a href={r.url} target="_blank" rel="noreferrer" className="font-medium text-brand hover:underline">{r.title}</a>
                          {r.subcategory && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500 dark:bg-slate-800">{r.subcategory}</span>}
                          {r.isFree && <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs text-green-600 dark:bg-green-900/30 dark:text-green-400">Бесплатно</span>}
                          {!r.isActive && <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs text-red-500">Неактивно</span>}
                          <span className="text-xs text-slate-400">{r.language.toUpperCase()}</span>
                          {r.difficulty && <span className="text-xs text-slate-400">{r.difficulty}</span>}
                        </div>
                        {r.description && <p className="mt-0.5 text-xs text-slate-400 line-clamp-1">{r.description}</p>}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button onClick={() => openEdit(r)} className="text-xs text-brand hover:underline">Ред.</button>
                        <button onClick={() => handleDelete(r.id)} className="text-xs text-red-400 hover:text-red-600">✕</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {displayed.length === 0 && <p className="text-slate-500">Нет ресурсов. Добавь первый!</p>}
          </div>
        )}

        {/* Form modal */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900 max-h-[90vh] overflow-y-auto">
              <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">
                {editing ? 'Редактировать ресурс' : 'Добавить ресурс'}
              </h2>
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-500">Название *</label>
                  <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-brand focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-500">URL *</label>
                  <input type="url" value={form.url} onChange={e => setForm({ ...form, url: e.target.value })}
                    placeholder="https://..."
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-brand focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-500">Описание</label>
                  <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                    rows={2}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-brand focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-500">Категория *</label>
                    <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-brand focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white">
                      {RESOURCE_CATEGORIES.map(c => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-500">Подкатегория / тег</label>
                    <input type="text" value={form.subcategory} onChange={e => setForm({ ...form, subcategory: e.target.value })}
                      placeholder="Python, IELTS, SOC..."
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-brand focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-500">Язык</label>
                    <select value={form.language} onChange={e => setForm({ ...form, language: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-brand focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white">
                      <option value="ru">RU</option>
                      <option value="en">EN</option>
                      <option value="kk">KK</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-500">Уровень</label>
                    <select value={form.difficulty} onChange={e => setForm({ ...form, difficulty: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-brand focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white">
                      <option value="">Любой</option>
                      <option value="beginner">Начинающий</option>
                      <option value="intermediate">Средний</option>
                      <option value="advanced">Продвинутый</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-500">Страна</label>
                    <input type="text" value={form.country_focus} onChange={e => setForm({ ...form, country_focus: e.target.value })}
                      placeholder="KZ / global"
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-brand focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-500">Порядок сортировки</label>
                  <input type="number" value={form.sort_order} onChange={e => setForm({ ...form, sort_order: Number(e.target.value) })}
                    className="w-32 rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-brand focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
                </div>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                    <input type="checkbox" checked={form.is_free} onChange={e => setForm({ ...form, is_free: e.target.checked })} className="rounded" />
                    Бесплатно
                  </label>
                  <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                    <input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} className="rounded" />
                    Активно
                  </label>
                </div>
              </div>
              <div className="mt-4 flex gap-3">
                <button onClick={handleSave} disabled={saving}
                  className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60">
                  {saving ? 'Сохраняем...' : editing ? 'Сохранить' : 'Добавить'}
                </button>
                <button onClick={() => setShowForm(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm dark:border-slate-700">
                  Отмена
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
