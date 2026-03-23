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
  name: '', description: '', cover_url: '', website: '', telegram: '', email: '',
};

const emptyCourse = { title: '', description: '', external_url: '' };

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
    setForm({ name: s.name, description: s.description || '', cover_url: s.cover_url || '', website: s.website || '', telegram: s.telegram || '', email: s.email || '' });
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
                    <h3 className="font-semibold text-slate-900 dark:text-white">{s.name}</h3>
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
                {(['name', 'description', 'cover_url', 'website', 'telegram', 'email'] as const).map((field) => (
                  <div key={field}>
                    <label className="mb-1 block text-xs font-medium text-slate-500">
                      {field === 'name' ? 'Название *' : field === 'description' ? 'Описание' : field === 'cover_url' ? 'URL обложки' : field === 'website' ? 'Сайт' : field === 'telegram' ? 'Telegram' : 'Email'}
                    </label>
                    {field === 'description' ? (
                      <textarea
                        value={form[field]}
                        onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                        rows={3}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-brand focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                    ) : (
                      <input
                        type="text"
                        value={form[field]}
                        onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-brand focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                    )}
                  </div>
                ))}
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
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900">
              <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">Добавить курс</h2>
              <div className="space-y-3">
                {(['title', 'description', 'external_url'] as const).map((field) => (
                  <div key={field}>
                    <label className="mb-1 block text-xs font-medium text-slate-500">
                      {field === 'title' ? 'Название *' : field === 'description' ? 'Описание' : 'Ссылка на курс'}
                    </label>
                    <input
                      type="text"
                      value={courseForm[field]}
                      onChange={(e) => setCourseForm({ ...courseForm, [field]: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-brand focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                ))}
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
