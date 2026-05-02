'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  fetchAdminCompany, updateAdminCompany, fetchAdminStacks,
  setCompanyStacks,
  createShowcase, deleteShowcase,
  createPhoto, deletePhoto,
  createOffice, deleteOffice,
  createHRContact, deleteHRContact,
  createBadge, deleteBadge,
  upsertTheme,
  PREDEFINED_BADGES,
  type AdminCompanyFull, type EntityBadge, type EntityTheme,
  type AdminShowcaseItem, type AdminPhoto, type AdminOffice, type AdminHRContact,
  type AdminStack,
  createAdminOpportunity, deleteAdminOpportunity,
  type AdminOpportunity,
} from '../../../../lib/admin-api';

// ─── Tab IDs ──────────────────────────────────────────────────────────────────

type Tab = 'main' | 'opportunities' | 'showcase' | 'photos' | 'offices' | 'hr' | 'badges' | 'theme';

const TABS: { id: Tab; label: string }[] = [
  { id: 'main',          label: '📝 Основное' },
  { id: 'opportunities', label: '💼 Вакансии/Стажировки' },
  { id: 'showcase',      label: '🎯 Витрина' },
  { id: 'photos',        label: '🖼 Галерея' },
  { id: 'offices',       label: '🏢 Офисы' },
  { id: 'hr',            label: '👥 HR-контакты' },
  { id: 'badges',        label: '🏅 Значки' },
  { id: 'theme',         label: '🎨 Тема' },
];

// ─── Shared UI ────────────────────────────────────────────────────────────────

function Input({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{label}</label>
      <input
        {...props}
        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
}

function Textarea({ label, ...props }: { label: string } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{label}</label>
      <textarea
        {...props}
        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
      />
    </div>
  );
}

function Select({ label, children, ...props }: { label: string } & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{label}</label>
      <select
        {...props}
        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {children}
      </select>
    </div>
  );
}

function Btn({ variant = 'primary', ...props }: { variant?: 'primary' | 'danger' | 'ghost' } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const cls = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    danger:  'bg-red-600 hover:bg-red-700 text-white',
    ghost:   'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200',
  }[variant];
  return (
    <button
      {...props}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${cls} ${props.className ?? ''}`}
    />
  );
}

// ─── Tab: Main ────────────────────────────────────────────────────────────────

function TabMain({ company, allStacks, onSaved }: {
  company: AdminCompanyFull;
  allStacks: AdminStack[];
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    name: company.name ?? '',
    description: company.description ?? '',
    about: (company as any).about ?? '',
    cover_url: company.coverURL ?? '',
    logo_url: (company as any).logoURL ?? '',
    founded_year: (company as any).foundedYear ?? 0,
    employee_count: (company as any).employeeCount ?? '',
    industry: (company as any).industry ?? '',
    website: company.contacts?.website ?? '',
    telegram: company.contacts?.telegram ?? '',
    email: company.contacts?.email ?? '',
    training_enabled: company.widgets?.trainingEnabled ?? false,
    internship_enabled: company.widgets?.internshipEnabled ?? false,
    vacancy_enabled: company.widgets?.vacancyEnabled ?? false,
    is_verified: company.isVerified ?? false,
  });
  const [selectedStacks, setSelectedStacks] = useState<number[]>(
    (company.stack ?? []).map((s) => s.id)
  );
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const save = async () => {
    setSaving(true);
    setMsg('');
    try {
      await updateAdminCompany(company.id, { ...form, founded_year: Number(form.founded_year) });
      await setCompanyStacks(company.id, selectedStacks);
      setMsg('Сохранено ✓');
      onSaved();
    } catch {
      setMsg('Ошибка при сохранении');
    } finally {
      setSaving(false);
    }
  };

  const toggleStack = (id: number) =>
    setSelectedStacks(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const f = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }));
  const fBool = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(p => ({ ...p, [k]: e.target.checked }));

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input label="Название" value={form.name} onChange={f('name')} />
        <Input label="Отрасль" value={form.industry} onChange={f('industry')} />
        <Input label="Год основания" type="number" value={form.founded_year} onChange={f('founded_year')} />
        <Input label="Кол-во сотрудников" value={form.employee_count} onChange={f('employee_count')} />
      </div>

      <Textarea label="Краткое описание" value={form.description} onChange={f('description')} rows={3} />
      <Textarea label="Подробно (about, поддерживает Markdown)" value={form.about} onChange={f('about')} rows={6} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Input label="Logo URL" value={form.logo_url} onChange={f('logo_url')} />
          {form.logo_url?.startsWith('http') && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={form.logo_url} alt="logo" className="mt-2 h-12 object-contain rounded border border-gray-200 dark:border-gray-700 p-1 bg-white" />
          )}
        </div>
        <div>
          <Input label="Cover URL" value={form.cover_url} onChange={f('cover_url')} />
          {form.cover_url?.startsWith('http') && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={form.cover_url} alt="cover" className="mt-2 h-12 object-cover rounded border border-gray-200 dark:border-gray-700 w-full" />
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Input label="Website" value={form.website} onChange={f('website')} />
        <Input label="Telegram" value={form.telegram} onChange={f('telegram')} />
        <Input label="Email" value={form.email} onChange={f('email')} />
      </div>

      <div className="flex flex-wrap gap-4 text-sm">
        {(['training_enabled','internship_enabled','vacancy_enabled','is_verified'] as const).map(k => (
          <label key={k} className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form[k] as boolean} onChange={fBool(k)} className="rounded" />
            <span>{{
              training_enabled: 'Тренинги',
              internship_enabled: 'Стажировки',
              vacancy_enabled: 'Вакансии',
              is_verified: 'Верифицировано',
            }[k]}</span>
          </label>
        ))}
      </div>

      {/* Стеки технологий */}
      <div>
        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
          Стек технологий компании
        </label>
        <div className="flex flex-wrap gap-2">
          {allStacks.map((s) => {
            const active = selectedStacks.includes(s.id);
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => toggleStack(s.id)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                  active
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-blue-400'
                }`}
              >
                {s.name}
              </button>
            );
          })}
        </div>
        {selectedStacks.length > 0 && (
          <p className="mt-1.5 text-xs text-gray-400">Выбрано: {selectedStacks.length}</p>
        )}
      </div>

      <div className="flex items-center gap-3">
        <Btn onClick={save} disabled={saving}>{saving ? 'Сохраняем...' : 'Сохранить'}</Btn>
        {msg && <span className="text-sm text-green-600 dark:text-green-400">{msg}</span>}
      </div>
    </div>
  );
}

// ─── Tab: Opportunities ───────────────────────────────────────────────────────

const emptyOpp = (): Omit<AdminOpportunity, 'id'> => ({
  type: 'internship', title: '', description: '', requirements: '',
  apply_url: '', level: 'junior', salary_min: 0, salary_max: 0,
  salary_currency: 'KZT', work_format: 'office', city: '',
  deadline: null, is_year_round: false, is_verified: false, source: 'admin',
});

function TabOpportunities({ company, onSaved }: { company: AdminCompanyFull; onSaved: () => void }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyOpp());
  const [saving, setSaving] = useState(false);

  const f = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }));

  const add = async () => {
    setSaving(true);
    try {
      await createAdminOpportunity(company.id, form);
      setShowForm(false);
      setForm(emptyOpp());
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  const del = async (id: number) => {
    if (!confirm('Удалить?')) return;
    await deleteAdminOpportunity(id);
    onSaved();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold">Вакансии / Стажировки ({company.opportunities?.length ?? 0})</h3>
        <Btn variant="ghost" onClick={() => setShowForm(p => !p)}>+ Добавить</Btn>
      </div>

      {showForm && (
        <div className="border border-blue-200 dark:border-blue-800 rounded-xl p-4 space-y-3 bg-blue-50 dark:bg-blue-950/30">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Select label="Тип" value={form.type} onChange={f('type')}>
              <option value="internship">Стажировка</option>
              <option value="vacancy">Вакансия</option>
            </Select>
            <Input label="Название" value={form.title} onChange={f('title')} />
            <Select label="Уровень" value={form.level} onChange={f('level')}>
              {['intern','junior','middle','senior','lead','any'].map(l => <option key={l}>{l}</option>)}
            </Select>
            <Select label="Формат" value={form.work_format} onChange={f('work_format')}>
              {['office','remote','hybrid'].map(l => <option key={l}>{l}</option>)}
            </Select>
            <Input label="Город" value={form.city} onChange={f('city')} />
            <Input label="Apply URL" value={form.apply_url} onChange={f('apply_url')} />
            <Input label="Зарплата от" type="number" value={form.salary_min} onChange={f('salary_min')} />
            <Input label="Зарплата до" type="number" value={form.salary_max} onChange={f('salary_max')} />
            <Input label="Валюта" value={form.salary_currency} onChange={f('salary_currency')} />
            <Input label="Дедлайн" type="date" value={form.deadline ?? ''} onChange={f('deadline')} />
          </div>
          <Textarea label="Описание" value={form.description} onChange={f('description')} rows={3} />
          <Textarea label="Требования" value={form.requirements} onChange={f('requirements')} rows={3} />
          <div className="flex gap-2">
            <Btn onClick={add} disabled={saving}>{saving ? '...' : 'Создать'}</Btn>
            <Btn variant="ghost" onClick={() => setShowForm(false)}>Отмена</Btn>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {(company.opportunities ?? []).map((opp: AdminOpportunity) => (
          <div key={opp.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700">
            <div>
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 mr-2">
                {opp.type}
              </span>
              <span className="font-medium text-sm">{opp.title}</span>
              <span className="ml-2 text-xs text-gray-400">{opp.level} · {opp.work_format} · {opp.city}</span>
            </div>
            <Btn variant="danger" onClick={() => del(opp.id)}>✕</Btn>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Tab: Showcase ────────────────────────────────────────────────────────────

const emptyShowcase = (): Omit<AdminShowcaseItem, 'id'> => ({
  type: 'event', title: '', description: '', imageURL: '', linkURL: '', sortOrder: 0,
});

function TabShowcase({ company, onSaved }: { company: AdminCompanyFull; onSaved: () => void }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyShowcase());
  const [saving, setSaving] = useState(false);

  const f = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }));

  const add = async () => {
    setSaving(true);
    try {
      await createShowcase(company.id, form);
      setShowForm(false);
      setForm(emptyShowcase());
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  const del = async (id: number) => {
    if (!confirm('Удалить?')) return;
    await deleteShowcase(id);
    onSaved();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold">Витрина ({company.showcase?.length ?? 0})</h3>
        <Btn variant="ghost" onClick={() => setShowForm(p => !p)}>+ Добавить</Btn>
      </div>

      {showForm && (
        <div className="border border-blue-200 dark:border-blue-800 rounded-xl p-4 space-y-3 bg-blue-50 dark:bg-blue-950/30">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Select label="Тип" value={form.type} onChange={f('type')}>
              {['internship','event','vacancy','news'].map(t => <option key={t}>{t}</option>)}
            </Select>
            <Input label="Заголовок" value={form.title} onChange={f('title')} />
            <Input label="Image URL" value={form.imageURL ?? ''} onChange={f('imageURL')} />
            <Input label="Link URL" value={form.linkURL ?? ''} onChange={f('linkURL')} />
            <Input label="Порядок" type="number" value={form.sortOrder} onChange={f('sortOrder')} />
          </div>
          <Textarea label="Описание" value={form.description ?? ''} onChange={f('description')} rows={2} />
          <div className="flex gap-2">
            <Btn onClick={add} disabled={saving}>{saving ? '...' : 'Создать'}</Btn>
            <Btn variant="ghost" onClick={() => setShowForm(false)}>Отмена</Btn>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {(company.showcase ?? []).map((item: AdminShowcaseItem) => (
          <div key={item.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700">
            <div>
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 mr-2">
                {item.type}
              </span>
              <span className="font-medium text-sm">{item.title}</span>
            </div>
            <Btn variant="danger" onClick={() => del(item.id)}>✕</Btn>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Tab: Photos ──────────────────────────────────────────────────────────────

function TabPhotos({ company, onSaved }: { company: AdminCompanyFull; onSaved: () => void }) {
  const [url, setUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [saving, setSaving] = useState(false);

  const add = async () => {
    if (!url) return;
    setSaving(true);
    try {
      await createPhoto(company.id, { url, caption, sortOrder: (company.photos?.length ?? 0) });
      setUrl(''); setCaption('');
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  const del = async (id: number) => {
    if (!confirm('Удалить?')) return;
    await deletePhoto(id);
    onSaved();
  };

  return (
    <div className="space-y-4">
      <h3 className="font-semibold">Галерея ({company.photos?.length ?? 0})</h3>

      <div className="flex gap-2 items-end">
        <div className="flex-1"><Input label="URL фото" value={url} onChange={e => setUrl(e.target.value)} /></div>
        <div className="flex-1"><Input label="Подпись" value={caption} onChange={e => setCaption(e.target.value)} /></div>
        <Btn onClick={add} disabled={saving || !url}>{saving ? '...' : 'Добавить'}</Btn>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {(company.photos ?? []).map((photo: AdminPhoto) => (
          <div key={photo.id} className="relative group rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {photo.url?.startsWith('http') && <img src={photo.url} alt={photo.caption ?? ''} className="w-full h-24 object-cover" />}
            {photo.caption && <p className="text-xs p-1 text-center truncate">{photo.caption}</p>}
            <button
              onClick={() => del(photo.id)}
              className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 text-xs items-center justify-center hidden group-hover:flex"
            >✕</button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Tab: Offices ─────────────────────────────────────────────────────────────

const emptyOffice = (): Omit<AdminOffice, 'id'> => ({ city: '', country: 'KZ', address: '', isHQ: false });

function TabOffices({ company, onSaved }: { company: AdminCompanyFull; onSaved: () => void }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyOffice());
  const [saving, setSaving] = useState(false);

  const f = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(p => ({ ...p, [k]: k === 'isHQ' ? e.target.checked : e.target.value }));

  const add = async () => {
    setSaving(true);
    try {
      await createOffice(company.id, form);
      setShowForm(false);
      setForm(emptyOffice());
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  const del = async (id: number) => {
    if (!confirm('Удалить?')) return;
    await deleteOffice(id);
    onSaved();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold">Офисы ({company.offices?.length ?? 0})</h3>
        <Btn variant="ghost" onClick={() => setShowForm(p => !p)}>+ Добавить</Btn>
      </div>

      {showForm && (
        <div className="border border-blue-200 dark:border-blue-800 rounded-xl p-4 space-y-3 bg-blue-50 dark:bg-blue-950/30">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input label="Город" value={form.city} onChange={f('city')} />
            <Input label="Страна" value={form.country} onChange={f('country')} />
            <Input label="Адрес" value={form.address ?? ''} onChange={f('address')} />
            <label className="flex items-center gap-2 mt-5 cursor-pointer text-sm">
              <input type="checkbox" checked={form.isHQ} onChange={f('isHQ')} className="rounded" />
              Главный офис (HQ)
            </label>
          </div>
          <div className="flex gap-2">
            <Btn onClick={add} disabled={saving}>{saving ? '...' : 'Создать'}</Btn>
            <Btn variant="ghost" onClick={() => setShowForm(false)}>Отмена</Btn>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {(company.offices ?? []).map((office: AdminOffice) => (
          <div key={office.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="text-sm">
              {office.isHQ && <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 mr-2">HQ</span>}
              <span className="font-medium">{office.city}, {office.country}</span>
              {office.address && <span className="ml-2 text-gray-400">{office.address}</span>}
            </div>
            <Btn variant="danger" onClick={() => del(office.id)}>✕</Btn>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Tab: HR Contacts ─────────────────────────────────────────────────────────

const emptyHR = (): Omit<AdminHRContact, 'id'> => ({ name: '', position: '', telegram: '', linkedin: '', note: '' });

function TabHR({ company, onSaved }: { company: AdminCompanyFull; onSaved: () => void }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyHR());
  const [saving, setSaving] = useState(false);

  const f = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }));

  const add = async () => {
    if (!form.name) return;
    setSaving(true);
    try {
      await createHRContact(company.id, form);
      setShowForm(false);
      setForm(emptyHR());
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  const del = async (id: number) => {
    if (!confirm('Удалить?')) return;
    await deleteHRContact(id);
    onSaved();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold">HR-контакты ({company.hrContacts?.length ?? 0})</h3>
        <Btn variant="ghost" onClick={() => setShowForm(p => !p)}>+ Добавить</Btn>
      </div>

      {showForm && (
        <div className="border border-blue-200 dark:border-blue-800 rounded-xl p-4 space-y-3 bg-blue-50 dark:bg-blue-950/30">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input label="Имя" value={form.name} onChange={f('name')} />
            <Input label="Должность" value={form.position ?? ''} onChange={f('position')} />
            <Input label="Telegram (@username)" value={form.telegram ?? ''} onChange={f('telegram')} />
            <Input label="LinkedIn URL" value={form.linkedin ?? ''} onChange={f('linkedin')} />
            <Input label="Заметка" value={form.note ?? ''} onChange={f('note')} />
          </div>
          <div className="flex gap-2">
            <Btn onClick={add} disabled={saving || !form.name}>{saving ? '...' : 'Создать'}</Btn>
            <Btn variant="ghost" onClick={() => setShowForm(false)}>Отмена</Btn>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {(company.hrContacts ?? []).map((hr: AdminHRContact) => (
          <div key={hr.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="text-sm">
              <span className="font-medium">{hr.name}</span>
              {hr.position && <span className="ml-2 text-gray-400">{hr.position}</span>}
              {hr.telegram && <span className="ml-2 text-blue-500">@{hr.telegram}</span>}
            </div>
            <Btn variant="danger" onClick={() => del(hr.id)}>✕</Btn>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Tab: Badges ──────────────────────────────────────────────────────────────

function TabBadges({ company, badges, onSaved }: { company: AdminCompanyFull; badges: EntityBadge[]; onSaved: () => void }) {
  const [customIcon, setCustomIcon] = useState('');
  const [customLabel, setCustomLabel] = useState('');
  const [customLight, setCustomLight] = useState('#2563eb');
  const [customDark, setCustomDark] = useState('#3b82f6');
  const [saving, setSaving] = useState(false);

  const addPredefined = async (preset: typeof PREDEFINED_BADGES[number]) => {
    setSaving(true);
    try {
      await createBadge({
        entityType: 'company', entityId: company.id,
        icon: preset.icon, label: preset.label,
        colorLight: preset.colorLight, colorDark: preset.colorDark,
        sortOrder: badges.length,
      });
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  const addCustom = async () => {
    if (!customIcon || !customLabel) return;
    setSaving(true);
    try {
      await createBadge({
        entityType: 'company', entityId: company.id,
        icon: customIcon, label: customLabel,
        colorLight: customLight, colorDark: customDark,
        sortOrder: badges.length,
      });
      setCustomIcon(''); setCustomLabel('');
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  const del = async (id: number) => {
    await deleteBadge(id);
    onSaved();
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold mb-3">Активные значки ({badges.length})</h3>
        <div className="flex flex-wrap gap-2">
          {badges.map(b => (
            <div key={b.id} className="flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium border" style={{ color: customLight, borderColor: customLight + '40' }}>
              <span style={{ color: b.colorLight }}>{b.icon}</span>
              <span style={{ color: b.colorLight }}>{b.label}</span>
              <button onClick={() => del(b.id)} className="ml-1 text-gray-400 hover:text-red-500 text-xs">✕</button>
            </div>
          ))}
          {badges.length === 0 && <p className="text-sm text-gray-400">Нет значков</p>}
        </div>
      </div>

      <div>
        <h3 className="font-semibold mb-3">Добавить предустановленный</h3>
        <div className="flex flex-wrap gap-2">
          {PREDEFINED_BADGES.map((preset: typeof PREDEFINED_BADGES[number]) => (
            <button
              key={preset.icon}
              onClick={() => addPredefined(preset)}
              disabled={saving}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border border-gray-200 dark:border-gray-700 hover:border-blue-400 transition-colors"
              style={{ color: preset.colorLight }}
            >
              <span>{preset.icon === 'verified' ? '✓' : preset.icon}</span>
              <span>{preset.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-semibold mb-3">Кастомный значок</h3>
        <div className="flex flex-wrap gap-3 items-end">
          <div className="w-24"><Input label="Иконка/эмодзи" value={customIcon} onChange={e => setCustomIcon(e.target.value)} /></div>
          <div className="flex-1 min-w-40"><Input label="Текст" value={customLabel} onChange={e => setCustomLabel(e.target.value)} /></div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Цвет (светлый)</label>
            <input type="color" value={customLight} onChange={e => setCustomLight(e.target.value)} className="h-9 w-16 rounded cursor-pointer" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Цвет (тёмный)</label>
            <input type="color" value={customDark} onChange={e => setCustomDark(e.target.value)} className="h-9 w-16 rounded cursor-pointer" />
          </div>
          <Btn onClick={addCustom} disabled={saving || !customIcon || !customLabel}>Добавить</Btn>
        </div>
      </div>
    </div>
  );
}

// ─── Tab: Theme ───────────────────────────────────────────────────────────────

function TabTheme({ company, theme, onSaved }: { company: AdminCompanyFull; theme: EntityTheme; onSaved: () => void }) {
  const [form, setForm] = useState<EntityTheme>({
    entityType: 'company',
    entityId: company.id,
    accentLight: theme?.accentLight ?? '#2563eb',
    accentDark: theme?.accentDark ?? '#3b82f6',
    coverGradient: theme?.coverGradient ?? 'none',
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const save = async () => {
    setSaving(true);
    try {
      await upsertTheme(form);
      setMsg('Тема сохранена ✓');
      onSaved();
    } catch {
      setMsg('Ошибка');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5 max-w-md">
      <h3 className="font-semibold">Фирменная тема профиля</h3>

      <div className="flex gap-6 items-end">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Акцент (светлая тема)</label>
          <input type="color" value={form.accentLight} onChange={e => setForm((p: EntityTheme) => ({ ...p, accentLight: e.target.value }))} className="h-10 w-20 rounded cursor-pointer" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Акцент (тёмная тема)</label>
          <input type="color" value={form.accentDark} onChange={e => setForm((p: EntityTheme) => ({ ...p, accentDark: e.target.value }))} className="h-10 w-20 rounded cursor-pointer" />
        </div>
      </div>

      <Select label="Обложка: эффект" value={form.coverGradient} onChange={e => setForm((p: EntityTheme) => ({ ...p, coverGradient: e.target.value as EntityTheme['coverGradient'] }))}>
        <option value="none">Без эффекта</option>
        <option value="top">Градиент сверху</option>
        <option value="overlay">Полупрозрачный оверлей</option>
        <option value="blur">Блюр</option>
      </Select>

      <div className="p-4 rounded-xl" style={{ background: `linear-gradient(135deg, ${form.accentLight}22, ${form.accentDark}44)`, borderLeft: `4px solid ${form.accentLight}` }}>
        <p className="text-sm font-medium" style={{ color: form.accentLight }}>Предпросмотр акцентного цвета</p>
        <p className="text-xs text-gray-500 mt-1">Так будет выглядеть акцент на публичном профиле</p>
      </div>

      <div className="flex items-center gap-3">
        <Btn onClick={save} disabled={saving}>{saving ? 'Сохраняем...' : 'Сохранить тему'}</Btn>
        {msg && <span className="text-sm text-green-600 dark:text-green-400">{msg}</span>}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminCompanyEditorPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);

  const [company, setCompany] = useState<AdminCompanyFull | null>(null);
  const [badges, setBadges] = useState<EntityBadge[]>([]);
  const [theme, setTheme] = useState<EntityTheme>({ entityType: 'company', entityId: id, accentLight: '#2563eb', accentDark: '#3b82f6', coverGradient: 'none' });
  const [allStacks, setAllStacks] = useState<AdminStack[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>('main');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const [res, stacks] = await Promise.all([
        fetchAdminCompany(id),
        fetchAdminStacks(),
      ]);
      setCompany(res.company);
      setBadges(res.badges ?? []);
      setTheme(res.theme ?? { entityType: 'company', entityId: id, accentLight: '#2563eb', accentDark: '#3b82f6', coverGradient: 'none' });
      setAllStacks(stacks);
    } catch {
      setError('Не удалось загрузить компанию');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
    </div>
  );

  if (error || !company) return (
    <div className="p-8 text-center text-red-500">{error || 'Компания не найдена'}</div>
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-600 text-sm">← Назад</button>
        <div className="flex-1">
          <h1 className="text-xl font-bold">{company.name}</h1>
          <p className="text-sm text-gray-400">ID: {company.id} · Редактор компании</p>
        </div>
        {company.isVerified && (
          <span className="px-3 py-1 rounded-full bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 text-xs font-medium">✓ Верифицировано</span>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 flex-wrap border-b border-gray-200 dark:border-gray-700 pb-0">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors -mb-px border-b-2 ${
              activeTab === tab.id
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-gray-900'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        {activeTab === 'main'          && <TabMain company={company} allStacks={allStacks} onSaved={load} />}
        {activeTab === 'opportunities' && <TabOpportunities company={company} onSaved={load} />}
        {activeTab === 'showcase'      && <TabShowcase company={company} onSaved={load} />}
        {activeTab === 'photos'        && <TabPhotos company={company} onSaved={load} />}
        {activeTab === 'offices'       && <TabOffices company={company} onSaved={load} />}
        {activeTab === 'hr'            && <TabHR company={company} onSaved={load} />}
        {activeTab === 'badges'        && <TabBadges company={company} badges={badges} onSaved={load} />}
        {activeTab === 'theme'         && <TabTheme company={company} theme={theme} onSaved={load} />}
      </div>
    </div>
  );
}
