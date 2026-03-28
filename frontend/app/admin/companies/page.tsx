'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AdminNav } from '../../../components/admin-nav';
import {
  getAdminToken,
  fetchAdminCompanies,
  createAdminCompany,
  updateAdminCompany,
  deleteAdminCompany,
  createAdminOpportunity,
  updateAdminOpportunity,
  deleteAdminOpportunity,
  AdminCompany,
  AdminOpportunity,
} from '../../../lib/admin-api';

const emptyCompany = {
  name: '', description: '', cover_url: '', logo_url: '', about: '',
  founded_year: 0, employee_count: '', industry: '',
  website: '', telegram: '', email: '',
  training_enabled: false, internship_enabled: true, vacancy_enabled: true,
  is_verified: false,
};

interface OppForm {
  type: 'internship' | 'vacancy';
  title: string;
  description: string;
  requirements: string;
  apply_url: string;
  level: string;
  salary_min: number;
  salary_max: number;
  salary_currency: string;
  work_format: string;
  city: string;
  deadline: string | null;
  is_year_round: boolean;
  is_verified: boolean;
  source: string;
}

const emptyOpp: OppForm = {
  type: 'internship', title: '', description: '', requirements: '', apply_url: '', level: 'intern',
  salary_min: 0, salary_max: 0, salary_currency: '₸', work_format: '', city: '',
  deadline: null, is_year_round: false, is_verified: false, source: 'admin',
};

export default function AdminCompaniesPage() {
  const router = useRouter();
  const [companies, setCompanies] = useState<AdminCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<AdminCompany | null>(null);
  const [form, setForm] = useState(emptyCompany);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null);
  const [oppForm, setOppForm] = useState<OppForm>(emptyOpp);
  const [showOppForm, setShowOppForm] = useState(false);
  const [editingOppId, setEditingOppId] = useState<number | null>(null);

  const reload = useCallback(() => {
    fetchAdminCompanies().then(setCompanies).catch(() => router.push('/admin'));
  }, [router]);

  useEffect(() => {
    if (!getAdminToken()) { router.push('/admin'); return; }
    reload();
    setLoading(false);
  }, [router, reload]);

  const openCreate = () => { setEditing(null); setForm(emptyCompany); setShowForm(true); };
  const openEdit = (c: AdminCompany) => {
    setEditing(c);
    setForm({
      name: c.name,
      description: c.description || '',
      cover_url: c.coverURL || '',
      logo_url: '',
      about: '',
      founded_year: 0,
      employee_count: '',
      industry: '',
      website: c.contacts?.website || '',
      telegram: c.contacts?.telegram || '',
      email: c.contacts?.email || '',
      training_enabled: c.widgets?.trainingEnabled ?? false,
      internship_enabled: c.widgets?.internshipEnabled ?? true,
      vacancy_enabled: c.widgets?.vacancyEnabled ?? true,
      is_verified: c.isVerified ?? false,
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editing) await updateAdminCompany(editing.id, form);
      else await createAdminCompany(form);
      setShowForm(false);
      reload();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить компанию?')) return;
    await deleteAdminCompany(id);
    reload();
  };

  const handleSaveOpp = async () => {
    setSaving(true);
    try {
      if (editingOppId) {
        await updateAdminOpportunity(editingOppId, oppForm);
      } else if (selectedCompanyId) {
        await createAdminOpportunity(selectedCompanyId, oppForm);
      }
      setShowOppForm(false);
      setOppForm(emptyOpp);
      setEditingOppId(null);
      reload();
    } finally {
      setSaving(false);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const openEditOpp = (o: any) => {
    setEditingOppId(o.id);
    setOppForm({
      type: o.type,
      title: o.title,
      description: o.description || '',
      requirements: o.requirements || '',
      apply_url: o.applyURL || o.apply_url || '',
      level: o.level || 'intern',
      salary_min: o.salaryMin ?? o.salary_min ?? 0,
      salary_max: o.salaryMax ?? o.salary_max ?? 0,
      salary_currency: o.salaryCurrency || o.salary_currency || '₸',
      work_format: o.workFormat || o.work_format || '',
      city: o.city || '',
      deadline: o.deadline ? (typeof o.deadline === 'string' ? o.deadline.slice(0, 10) : null) : null,
      is_year_round: o.isYearRound ?? o.is_year_round ?? false,
      is_verified: o.isVerified ?? o.is_verified ?? false,
      source: o.source || 'admin',
    });
    setShowOppForm(true);
  };

  const handleDeleteOpp = async (id: number) => {
    if (!confirm('Удалить вакансию/стажировку?')) return;
    await deleteAdminOpportunity(id);
    reload();
  };

  return (
    <div className="flex min-h-screen">
      <AdminNav />
      <main className="flex-1 overflow-auto p-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Компании</h1>
          <button onClick={openCreate} className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark">
            + Добавить
          </button>
        </div>

        {loading ? <p className="text-slate-500">Загружаем...</p> : (
          <div className="space-y-4">
            {companies.map((c) => (
              <div key={c.id} className="rounded-2xl border border-slate-200/70 bg-white p-5 dark:border-slate-700/60 dark:bg-slate-900">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900 dark:text-white">
                      {c.name}
                      {c.isVerified && <span className="ml-2 inline-block rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-600 dark:bg-green-900/30 dark:text-green-400">✓ Верифицировано</span>}
                    </h3>
                    {c.description && <p className="mt-1 text-sm text-slate-500 line-clamp-2">{c.description}</p>}
                    <div className="mt-2 flex flex-wrap gap-2">
                      {c.contacts?.website && <a href={c.contacts.website} target="_blank" rel="noreferrer" className="text-xs text-brand hover:underline">{c.contacts.website}</a>}
                    </div>
                    {/* Opportunities */}
                    {c.opportunities && c.opportunities.length > 0 && (
                      <div className="mt-3 space-y-1">
                        {c.opportunities.map((o) => (
                          <div key={o.id} className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-1.5 dark:bg-slate-800">
                            <span className="text-xs font-medium text-brand">{o.type === 'internship' ? 'Стажировка' : 'Вакансия'}</span>
                            <span className="text-xs text-slate-600 dark:text-slate-300">{o.title}</span>
                            <span className="text-xs text-slate-400">{o.level}</span>
                            {(o as any).isVerified && <span className="text-xs text-green-500">✓</span>}
                            <button onClick={() => openEditOpp(o)} className="ml-auto text-xs text-brand hover:underline">Ред.</button>
                            <button onClick={() => handleDeleteOpp(o.id)} className="text-xs text-red-400 hover:text-red-600">✕</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => { setSelectedCompanyId(c.id); setEditingOppId(null); setOppForm(emptyOpp); setShowOppForm(true); }}
                      className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:border-brand hover:text-brand dark:border-slate-700 dark:text-slate-300"
                    >
                      + Вакансия
                    </button>
                    <button onClick={() => openEdit(c)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs hover:border-brand hover:text-brand dark:border-slate-700 dark:text-slate-300">
                      Изменить
                    </button>
                    <button onClick={() => handleDelete(c.id)} className="rounded-lg border border-red-200 px-3 py-1.5 text-xs text-red-500 hover:bg-red-50 dark:border-red-800">
                      Удалить
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {companies.length === 0 && <p className="text-slate-500">Нет компаний. Добавь первую!</p>}
          </div>
        )}

        {/* Company form modal */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900 max-h-[90vh] overflow-y-auto">
              <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">
                {editing ? 'Изменить компанию' : 'Добавить компанию'}
              </h2>
              <div className="space-y-3">
                {([
                  ['name', 'Название *'],
                  ['description', 'Краткое описание'],
                  ['cover_url', 'URL обложки'],
                  ['logo_url', 'URL логотипа'],
                  ['about', 'О компании (подробно)'],
                  ['industry', 'Отрасль (например: FinTech)'],
                  ['employee_count', 'Сотрудников (например: 100-500)'],
                  ['founded_year', 'Год основания'],
                  ['website', 'Сайт'],
                  ['telegram', 'Telegram'],
                  ['email', 'Email'],
                ] as [keyof typeof form, string][]).map(([field, label]) => (
                  <div key={field}>
                    <label className="mb-1 block text-xs font-medium text-slate-500">{label}</label>
                    {(field === 'description' || field === 'about') ? (
                      <textarea
                        value={form[field] as string}
                        onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                        rows={field === 'about' ? 4 : 3}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-brand focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                    ) : field === 'founded_year' ? (
                      <input
                        type="number"
                        value={form[field] as number || ''}
                        onChange={(e) => setForm({ ...form, [field]: Number(e.target.value) })}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-brand focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                    ) : (
                      <input
                        type="text"
                        value={form[field] as string}
                        onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-brand focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                    )}
                  </div>
                ))}
                <div className="flex flex-wrap gap-4">
                  {(['training_enabled', 'internship_enabled', 'vacancy_enabled', 'is_verified'] as const).map((key) => (
                    <label key={key} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                      <input
                        type="checkbox"
                        checked={form[key]}
                        onChange={(e) => setForm({ ...form, [key]: e.target.checked })}
                        className="rounded"
                      />
                      {key === 'training_enabled' ? 'Обучение' : key === 'internship_enabled' ? 'Стажировки' : key === 'vacancy_enabled' ? 'Вакансии' : '✓ Верифицировано'}
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

        {/* Opportunity form modal */}
        {showOppForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900 max-h-[90vh] overflow-y-auto">
              <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">
                {editingOppId ? 'Редактировать' : 'Добавить'} вакансию/стажировку
              </h2>
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-500">Тип</label>
                  <select
                    value={oppForm.type}
                    onChange={(e) => setOppForm({ ...oppForm, type: e.target.value as 'internship' | 'vacancy' })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-brand focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    <option value="internship">Стажировка</option>
                    <option value="vacancy">Вакансия</option>
                  </select>
                </div>
                {(['title', 'apply_url', 'city'] as const).map((field) => (
                  <div key={field}>
                    <label className="mb-1 block text-xs font-medium text-slate-500">
                      {field === 'title' ? 'Название *' : field === 'apply_url' ? 'Ссылка для отклика' : 'Город'}
                    </label>
                    <input
                      type="text"
                      value={oppForm[field]}
                      onChange={(e) => setOppForm({ ...oppForm, [field]: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-brand focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                ))}
                {/* Salary */}
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-500">ЗП от *</label>
                    <input
                      type="number"
                      value={oppForm.salary_min || ''}
                      onChange={(e) => setOppForm({ ...oppForm, salary_min: Number(e.target.value) })}
                      placeholder="150000"
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-brand focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-500">ЗП до</label>
                    <input
                      type="number"
                      value={oppForm.salary_max || ''}
                      onChange={(e) => setOppForm({ ...oppForm, salary_max: Number(e.target.value) })}
                      placeholder="300000"
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-brand focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-500">Валюта</label>
                    <select
                      value={oppForm.salary_currency}
                      onChange={(e) => setOppForm({ ...oppForm, salary_currency: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-brand focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    >
                      <option value="₸">₸ KZT</option>
                      <option value="$">$ USD</option>
                      <option value="сом">сом KGS</option>
                      <option value="сум">сум UZS</option>
                    </select>
                  </div>
                </div>
                {/* Work format */}
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-500">Формат работы</label>
                  <select
                    value={oppForm.work_format}
                    onChange={(e) => setOppForm({ ...oppForm, work_format: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-brand focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    <option value="">Не указано</option>
                    <option value="office">Офис</option>
                    <option value="remote">Удалённо</option>
                    <option value="hybrid">Гибрид</option>
                  </select>
                </div>
                {(['description', 'requirements'] as const).map((field) => (
                  <div key={field}>
                    <label className="mb-1 block text-xs font-medium text-slate-500">
                      {field === 'description' ? 'Описание' : 'Требования'}
                    </label>
                    <textarea
                      value={oppForm[field]}
                      onChange={(e) => setOppForm({ ...oppForm, [field]: e.target.value })}
                      rows={2}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-brand focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                ))}
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-500">Уровень</label>
                  <select
                    value={oppForm.level}
                    onChange={(e) => setOppForm({ ...oppForm, level: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-brand focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    {['intern', 'junior', 'middle', 'senior'].map((l) => (
                      <option key={l} value={l}>{l}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-500">Дедлайн</label>
                  <input
                    type="date"
                    value={oppForm.deadline || ''}
                    onChange={(e) => setOppForm({ ...oppForm, deadline: e.target.value || null })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-brand focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-500">Источник</label>
                  <select
                    value={oppForm.source}
                    onChange={(e) => setOppForm({ ...oppForm, source: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-brand focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    <option value="admin">Admin</option>
                    <option value="oss-data">OSS Data</option>
                    <option value="partner">Partner</option>
                  </select>
                </div>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                    <input type="checkbox" checked={oppForm.is_year_round} onChange={(e) => setOppForm({ ...oppForm, is_year_round: e.target.checked })} className="rounded" />
                    Круглогодичная
                  </label>
                  <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                    <input type="checkbox" checked={oppForm.is_verified} onChange={(e) => setOppForm({ ...oppForm, is_verified: e.target.checked })} className="rounded" />
                    Верифицировано
                  </label>
                </div>
              </div>
              <div className="mt-4 flex gap-3">
                <button onClick={handleSaveOpp} disabled={saving} className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60">
                  {saving ? 'Сохраняем...' : editingOppId ? 'Сохранить' : 'Добавить'}
                </button>
                <button onClick={() => { setShowOppForm(false); setEditingOppId(null); }} className="rounded-xl border border-slate-200 px-4 py-2 text-sm dark:border-slate-700">
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
