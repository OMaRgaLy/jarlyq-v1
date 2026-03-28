'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AdminNav } from '../../../components/admin-nav';
import {
  getAdminToken,
  fetchAdminSchools,
  createAdminSchool,
  updateAdminSchool,
  deleteAdminSchool,
  createAdminCourse,
  deleteAdminCourse,
  AdminSchool,
} from '../../../lib/admin-api';

const emptySchool = {
  name: '', type: 'bootcamp' as string, country: '', description: '', cover_url: '',
  is_state_funded: false, website: '', telegram: '', email: '',
};

const emptyCourse = {
  title: '', description: '', external_url: '',
  price: 0, price_currency: '₸', duration_weeks: 0, format: '', has_employment: false,
};

export default function AdminSchoolsPage() {
  const router = useRouter();
  const [schools, setSchools] = useState<AdminSchool[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<AdminSchool | null>(null);
  const [form, setForm] = useState(emptySchool);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedSchoolId, setSelectedSchoolId] = useState<number | null>(null);
  const [courseForm, setCourseForm] = useState(emptyCourse);
  const [showCourseForm, setShowCourseForm] = useState(false);

  const reload = useCallback(() => {
    fetchAdminSchools().then(setSchools).catch(() => router.push('/admin'));
  }, [router]);

  useEffect(() => {
    if (!getAdminToken()) { router.push('/admin'); return; }
    reload();
    setLoading(false);
  }, [router, reload]);

  const openCreate = () => { setEditing(null); setForm(emptySchool); setShowForm(true); };
  const openEdit = (s: AdminSchool) => {
    setEditing(s);
    setForm({
      name: s.name, type: (s as any).type || 'bootcamp', country: (s as any).country || '',
      description: s.description || '', cover_url: s.cover_url || '',
      is_state_funded: (s as any).isStateFunded ?? (s as any).is_state_funded ?? false,
      website: s.website || '', telegram: s.telegram || '', email: s.email || '',
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editing) await updateAdminSchool(editing.id, form);
      else await createAdminSchool(form);
      setShowForm(false);
      reload();
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить школу?')) return;
    await deleteAdminSchool(id);
    reload();
  };

  const handleAddCourse = async () => {
    if (!selectedSchoolId) return;
    setSaving(true);
    try {
      await createAdminCourse(selectedSchoolId, courseForm);
      setShowCourseForm(false);
      setCourseForm(emptyCourse);
      reload();
    } finally { setSaving(false); }
  };

  const handleDeleteCourse = async (id: number) => {
    if (!confirm('Удалить курс?')) return;
    await deleteAdminCourse(id);
    reload();
  };

  return (
    <div className="flex min-h-screen">
      <AdminNav />
      <main className="flex-1 overflow-auto p-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Школы</h1>
          <button onClick={openCreate} className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark">
            + Добавить
          </button>
        </div>

        {loading ? <p className="text-slate-500">Загружаем...</p> : (
          <div className="space-y-4">
            {schools.map((s) => (
              <div key={s.id} className="rounded-2xl border border-slate-200/70 bg-white p-5 dark:border-slate-700/60 dark:bg-slate-900">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900 dark:text-white">
                      {s.name}
                      {(s as any).type && <span className="ml-2 inline-block rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500 dark:bg-slate-800 dark:text-slate-400">{(s as any).type}</span>}
                      {((s as any).isStateFunded || (s as any).is_state_funded) && <span className="ml-1 inline-block rounded-full bg-green-50 px-2 py-0.5 text-xs text-green-600 dark:bg-green-900/30 dark:text-green-400">Гос.</span>}
                    </h3>
                    {s.description && <p className="mt-1 text-sm text-slate-500 line-clamp-2">{s.description}</p>}
                    {s.courses && s.courses.length > 0 && (
                      <div className="mt-3 space-y-1">
                        {s.courses.map((c) => (
                          <div key={c.id} className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-1.5 dark:bg-slate-800">
                            <span className="text-xs text-slate-600 dark:text-slate-300">{c.title}</span>
                            {c.external_url && <a href={c.external_url} target="_blank" rel="noreferrer" className="text-xs text-brand hover:underline">Ссылка</a>}
                            <button onClick={() => handleDeleteCourse(c.id)} className="ml-auto text-xs text-red-400 hover:text-red-600">✕</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => { setSelectedSchoolId(s.id); setShowCourseForm(true); }}
                      className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs hover:border-brand hover:text-brand dark:border-slate-700 dark:text-slate-300"
                    >
                      + Курс
                    </button>
                    <button onClick={() => openEdit(s)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs hover:border-brand hover:text-brand dark:border-slate-700 dark:text-slate-300">
                      Изменить
                    </button>
                    <button onClick={() => handleDelete(s.id)} className="rounded-lg border border-red-200 px-3 py-1.5 text-xs text-red-500 hover:bg-red-50 dark:border-red-800">
                      Удалить
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {schools.length === 0 && <p className="text-slate-500">Нет школ. Добавь первую!</p>}
          </div>
        )}

        {/* School form */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900 max-h-[90vh] overflow-y-auto">
              <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">
                {editing ? 'Изменить школу' : 'Добавить школу'}
              </h2>
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-500">Название *</label>
                  <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-brand focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-500">Тип</label>
                    <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-brand focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white">
                      <option value="bootcamp">Буткемп</option>
                      <option value="university">Университет</option>
                      <option value="state_program">Гос. программа</option>
                      <option value="university_abroad">Зарубежный ВУЗ</option>
                      <option value="prep_service">Подготовка к ВУЗу</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-500">Страна</label>
                    <input type="text" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })}
                      placeholder="Казахстан"
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-brand focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-500">Описание</label>
                  <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-brand focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
                </div>
                {(['cover_url', 'website', 'telegram', 'email'] as const).map((field) => (
                  <div key={field}>
                    <label className="mb-1 block text-xs font-medium text-slate-500">
                      {field === 'cover_url' ? 'URL обложки' : field === 'website' ? 'Сайт' : field === 'telegram' ? 'Telegram' : 'Email'}
                    </label>
                    <input type="text" value={form[field]} onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-brand focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
                  </div>
                ))}
                <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                  <input type="checkbox" checked={form.is_state_funded} onChange={(e) => setForm({ ...form, is_state_funded: e.target.checked })} className="rounded" />
                  Государственное финансирование
                </label>
              </div>
              <div className="mt-4 flex gap-3">
                <button onClick={handleSave} disabled={saving} className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60">
                  {saving ? 'Сохраняем...' : 'Сохранить'}
                </button>
                <button onClick={() => setShowForm(false)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm dark:border-slate-700">
                  Отмена
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Course form */}
        {showCourseForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900 max-h-[90vh] overflow-y-auto">
              <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">Добавить курс</h2>
              <div className="space-y-3">
                {(['title', 'external_url'] as const).map((field) => (
                  <div key={field}>
                    <label className="mb-1 block text-xs font-medium text-slate-500">
                      {field === 'title' ? 'Название *' : 'Ссылка на курс'}
                    </label>
                    <input
                      type="text"
                      value={courseForm[field]}
                      onChange={(e) => setCourseForm({ ...courseForm, [field]: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-brand focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                ))}
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-500">Описание</label>
                  <textarea
                    value={courseForm.description}
                    onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
                    rows={2}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-brand focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                {/* Price */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-500">Цена (0 = бесплатно)</label>
                    <input
                      type="number"
                      value={courseForm.price || ''}
                      onChange={(e) => setCourseForm({ ...courseForm, price: Number(e.target.value) })}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-brand focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-500">Валюта</label>
                    <select
                      value={courseForm.price_currency}
                      onChange={(e) => setCourseForm({ ...courseForm, price_currency: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-brand focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    >
                      <option value="₸">₸ KZT</option>
                      <option value="$">$ USD</option>
                      <option value="сом">сом KGS</option>
                    </select>
                  </div>
                </div>
                {/* Duration + format */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-500">Длительность (нед.)</label>
                    <input
                      type="number"
                      value={courseForm.duration_weeks || ''}
                      onChange={(e) => setCourseForm({ ...courseForm, duration_weeks: Number(e.target.value) })}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-brand focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-500">Формат</label>
                    <select
                      value={courseForm.format}
                      onChange={(e) => setCourseForm({ ...courseForm, format: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-brand focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    >
                      <option value="">Не указано</option>
                      <option value="online">Онлайн</option>
                      <option value="offline">Офлайн</option>
                      <option value="hybrid">Гибрид</option>
                    </select>
                  </div>
                </div>
                <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={courseForm.has_employment}
                    onChange={(e) => setCourseForm({ ...courseForm, has_employment: e.target.checked })}
                    className="rounded"
                  />
                  Помогаем с трудоустройством
                </label>
              </div>
              <div className="mt-4 flex gap-3">
                <button onClick={handleAddCourse} disabled={saving} className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60">
                  {saving ? 'Добавляем...' : 'Добавить'}
                </button>
                <button onClick={() => setShowCourseForm(false)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm dark:border-slate-700">
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
