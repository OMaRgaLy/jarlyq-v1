'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AdminNav } from '../../../components/admin-nav';
import {
  getAdminToken,
  fetchAdminHackathons,
  createAdminHackathon,
  updateAdminHackathon,
  deleteAdminHackathon,
  AdminHackathon,
} from '../../../lib/admin-api';

type HackForm = Omit<AdminHackathon, 'id'>;

const emptyForm: HackForm = {
  title: '', description: '', organizer: '', location: '',
  is_online: false, prize_pool: '', register_url: '', website_url: '',
  tech_stack: '', registration_deadline: '', start_date: '', end_date: '',
  is_active: true,
};

function toInputDate(s: string) {
  if (!s) return '';
  return s.slice(0, 10); // YYYY-MM-DD
}

function toISO(s: string) {
  if (!s) return '';
  return s + 'T00:00:00Z';
}

export default function AdminHackathonsPage() {
  const router = useRouter();
  const [items, setItems] = useState<AdminHackathon[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<AdminHackathon | null>(null);
  const [form, setForm] = useState<HackForm>(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const reload = useCallback(() => {
    fetchAdminHackathons().then(setItems).catch(() => router.push('/admin'));
  }, [router]);

  useEffect(() => {
    if (!getAdminToken()) { router.push('/admin'); return; }
    reload();
    setLoading(false);
  }, [router, reload]);

  const openCreate = () => { setEditing(null); setForm(emptyForm); setShowForm(true); };
  const openEdit = (h: AdminHackathon) => {
    setEditing(h);
    setForm({
      title: h.title,
      description: h.description,
      organizer: h.organizer,
      location: h.location,
      is_online: h.is_online,
      prize_pool: h.prize_pool,
      register_url: h.register_url,
      website_url: h.website_url,
      tech_stack: h.tech_stack,
      registration_deadline: toInputDate(h.registration_deadline),
      start_date: toInputDate(h.start_date),
      end_date: toInputDate(h.end_date),
      is_active: h.is_active,
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const body = {
        ...form,
        registration_deadline: toISO(form.registration_deadline),
        start_date: toISO(form.start_date),
        end_date: toISO(form.end_date),
      };
      if (editing) await updateAdminHackathon(editing.id, body);
      else await createAdminHackathon(body);
      setShowForm(false);
      reload();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить хакатон?')) return;
    await deleteAdminHackathon(id);
    reload();
  };

  const field = (key: keyof HackForm, label: string, type: 'text' | 'date' | 'textarea' = 'text') => (
    <div key={key}>
      <label className="mb-1 block text-xs font-medium text-slate-500">{label}</label>
      {type === 'textarea' ? (
        <textarea
          value={form[key] as string}
          onChange={(e) => setForm({ ...form, [key]: e.target.value })}
          rows={3}
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-brand focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
        />
      ) : (
        <input
          type={type}
          value={form[key] as string}
          onChange={(e) => setForm({ ...form, [key]: e.target.value })}
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-brand focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
        />
      )}
    </div>
  );

  return (
    <div className="flex min-h-screen">
      <AdminNav />
      <main className="flex-1 overflow-auto p-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Хакатоны</h1>
          <button onClick={openCreate} className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark">
            + Добавить
          </button>
        </div>

        {loading ? <p className="text-slate-500">Загружаем...</p> : (
          <div className="space-y-3">
            {items.map((h) => (
              <div key={h.id} className="rounded-2xl border border-slate-200/70 bg-white p-5 dark:border-slate-700/60 dark:bg-slate-900">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-slate-900 dark:text-white">{h.title}</h3>
                      <span className={`rounded-full px-2 py-0.5 text-xs ${h.is_active ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-800'}`}>
                        {h.is_active ? 'Активен' : 'Неактивен'}
                      </span>
                      {h.is_online && <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">Онлайн</span>}
                    </div>
                    {h.organizer && <p className="text-xs text-slate-400">Организатор: {h.organizer}</p>}
                    {h.registration_deadline && (
                      <p className="text-xs text-slate-400">
                        Дедлайн: {new Date(h.registration_deadline).toLocaleDateString('ru')}
                      </p>
                    )}
                    {h.prize_pool && <p className="text-xs text-slate-400">Призовой фонд: {h.prize_pool}</p>}
                    {h.tech_stack && <p className="text-xs text-slate-400">Стек: {h.tech_stack}</p>}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <button onClick={() => openEdit(h)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs hover:border-brand hover:text-brand dark:border-slate-700 dark:text-slate-300">
                      Изменить
                    </button>
                    <button onClick={() => handleDelete(h.id)} className="rounded-lg border border-red-200 px-3 py-1.5 text-xs text-red-500 hover:bg-red-50 dark:border-red-800">
                      Удалить
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {items.length === 0 && <p className="text-slate-500">Нет хакатонов. Добавь первый!</p>}
          </div>
        )}

        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900 max-h-[90vh] overflow-y-auto">
              <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">
                {editing ? 'Изменить хакатон' : 'Добавить хакатон'}
              </h2>
              <div className="space-y-3">
                {field('title', 'Название *')}
                {field('description', 'Описание', 'textarea')}
                {field('organizer', 'Организатор')}
                {field('location', 'Место проведения')}
                {field('prize_pool', 'Призовой фонд (например: $10,000)')}
                {field('tech_stack', 'Технологии (через запятую)')}
                {field('register_url', 'Ссылка для регистрации')}
                {field('website_url', 'Сайт')}
                {field('registration_deadline', 'Дедлайн регистрации', 'date')}
                {field('start_date', 'Дата начала', 'date')}
                {field('end_date', 'Дата окончания', 'date')}
                <div className="flex gap-6">
                  {(['is_online', 'is_active'] as const).map((key) => (
                    <label key={key} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                      <input
                        type="checkbox"
                        checked={form[key]}
                        onChange={(e) => setForm({ ...form, [key]: e.target.checked })}
                        className="rounded"
                      />
                      {key === 'is_online' ? 'Онлайн' : 'Активен'}
                    </label>
                  ))}
                </div>
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
      </main>
    </div>
  );
}
