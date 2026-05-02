'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  fetchAdminSchool, updateAdminSchoolFull,
  createAdminCourse, updateAdminCourse, deleteAdminCourse,
  createBadge, deleteBadge,
  upsertTheme,
  SCHOOL_TYPES, SCHOOL_PREDEFINED_BADGES,
  type AdminSchoolFull, type EntityBadge, type EntityTheme, type AdminCourse,
} from '../../../../lib/admin-api';

type Tab = 'main' | 'courses' | 'badges' | 'theme';

const TABS: { id: Tab; label: string }[] = [
  { id: 'main',    label: '📝 Основное' },
  { id: 'courses', label: '📚 Программы / Курсы' },
  { id: 'badges',  label: '🏅 Значки' },
  { id: 'theme',   label: '🎨 Тема' },
];

// ─── Shared UI ────────────────────────────────────────────────────────────────

function Input({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{label}</label>
      <input {...props} className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
    </div>
  );
}

function Textarea({ label, ...props }: { label: string } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{label}</label>
      <textarea {...props} className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y" />
    </div>
  );
}

function Select({ label, children, ...props }: { label: string } & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{label}</label>
      <select {...props} className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
        {children}
      </select>
    </div>
  );
}

function Btn({ variant = 'primary', ...props }: { variant?: 'primary' | 'danger' | 'ghost' } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const cls = { primary: 'bg-blue-600 hover:bg-blue-700 text-white', danger: 'bg-red-600 hover:bg-red-700 text-white', ghost: 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200' }[variant];
  return <button {...props} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${cls} ${props.className ?? ''}`} />;
}

// ─── Tab: Main ────────────────────────────────────────────────────────────────

function TabMain({ school, onSaved }: { school: AdminSchoolFull; onSaved: () => void }) {
  const [form, setForm] = useState({
    name: school.name ?? '',
    type: school.type ?? 'bootcamp',
    country: school.country ?? '',
    city: (school as AdminSchoolFull).city ?? '',
    description: school.description ?? '',
    about: school.about ?? '',
    age_range: school.ageRange ?? '',
    audience: school.audience ?? '',
    logo_url: school.logoURL ?? '',
    cover_url: school.cover_url ?? '',
    is_state_funded: school.is_state_funded ?? false,
    is_verified: school.isVerified ?? false,
    website: school.website ?? '',
    telegram: school.telegram ?? '',
    email: school.email ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const f = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }));
  const fBool = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(p => ({ ...p, [k]: e.target.checked }));

  const save = async () => {
    setSaving(true); setMsg('');
    try {
      await updateAdminSchoolFull(school.id, form);
      setMsg('Сохранено ✓');
      onSaved();
    } catch { setMsg('Ошибка при сохранении'); }
    finally { setSaving(false); }
  };

  const typeLabel = SCHOOL_TYPES.find(t => t.value === form.type)?.label ?? form.type;

  return (
    <div className="space-y-5">
      {/* Тип — самое важное для школ */}
      <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
        <p className="text-xs font-medium text-amber-700 dark:text-amber-400 mb-2">Тип организации (влияет на отображение и фильтры)</p>
        <Select label="" value={form.type} onChange={f('type')}>
          {SCHOOL_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </Select>
        <p className="text-xs text-amber-600 dark:text-amber-500 mt-2">
          Текущий: <strong>{typeLabel}</strong>
          {form.type === 'state_program' && ' — появится плашка "Гос. программа"'}
          {form.type === 'peer_learning' && ' — без преподавателей, peer-to-peer'}
          {form.type === 'center' && ' — образовательный центр (не буткемп)'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input label="Название" value={form.name} onChange={f('name')} />
        <Input label="Страна" value={form.country} onChange={f('country')} />
        <Input label="Город (для оффлайн)" value={form.city} onChange={f('city')} />
        <Input label="Возрастной диапазон" placeholder="12–17, 18+, Любой" value={form.age_range} onChange={f('age_range')} />
        <Input label="Аудитория" placeholder="Школьники, Студенты, Все желающие" value={form.audience} onChange={f('audience')} />
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
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={form.is_state_funded} onChange={fBool('is_state_funded')} className="rounded" />
          Государственное финансирование
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={form.is_verified} onChange={fBool('is_verified')} className="rounded" />
          Верифицировано
        </label>
      </div>

      <div className="flex items-center gap-3">
        <Btn onClick={save} disabled={saving}>{saving ? 'Сохраняем...' : 'Сохранить'}</Btn>
        {msg && <span className="text-sm text-green-600 dark:text-green-400">{msg}</span>}
      </div>
    </div>
  );
}

// ─── Tab: Courses ─────────────────────────────────────────────────────────────

const emptyCourse = (): Omit<AdminCourse, 'id'> => ({
  title: '', description: '', external_url: '',
  price: 0, price_currency: 'KZT', duration_weeks: 0,
  format: 'online', has_employment: false,
});

function TabCourses({ school, onSaved }: { school: AdminSchoolFull; onSaved: () => void }) {
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyCourse());
  const [saving, setSaving] = useState(false);

  const f = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }));
  const fBool = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(p => ({ ...p, [k]: e.target.checked }));

  const openCreate = () => { setEditId(null); setForm(emptyCourse()); setShowForm(true); };
  const openEdit = (c: AdminCourse) => {
    setEditId(c.id);
    setForm({ title: c.title, description: c.description, external_url: c.external_url, price: c.price, price_currency: c.price_currency, duration_weeks: c.duration_weeks, format: c.format, has_employment: c.has_employment });
    setShowForm(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      if (editId) await updateAdminCourse(editId, form);
      else await createAdminCourse(school.id, form);
      setShowForm(false); setEditId(null); setForm(emptyCourse());
      onSaved();
    } finally { setSaving(false); }
  };

  const del = async (id: number) => {
    if (!confirm('Удалить программу/курс?')) return;
    await deleteAdminCourse(id);
    onSaved();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-semibold">Программы / Курсы ({school.courses?.length ?? 0})</h3>
          <p className="text-xs text-gray-400 mt-0.5">Для гос. программ — каждая программа/трек это отдельный курс</p>
        </div>
        <Btn variant="ghost" onClick={openCreate}>+ Добавить</Btn>
      </div>

      {showForm && (
        <div className="border border-blue-200 dark:border-blue-800 rounded-xl p-4 space-y-3 bg-blue-50 dark:bg-blue-950/30">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input label="Название" value={form.title} onChange={f('title')} />
            <Select label="Формат" value={form.format} onChange={f('format')}>
              <option value="online">Онлайн</option>
              <option value="offline">Оффлайн</option>
              <option value="hybrid">Гибрид</option>
            </Select>
            <Input label="Длительность (недель, 0 = не указана)" type="number" value={form.duration_weeks} onChange={f('duration_weeks')} />
            <Input label="Цена (0 = бесплатно)" type="number" value={form.price} onChange={f('price')} />
            <Input label="Валюта" value={form.price_currency} onChange={f('price_currency')} />
            <Input label="Ссылка (external URL)" value={form.external_url} onChange={f('external_url')} />
          </div>
          <Textarea label="Описание" value={form.description} onChange={f('description')} rows={3} />
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={form.has_employment} onChange={fBool('has_employment')} className="rounded" />
            Гарантия трудоустройства
          </label>
          <div className="flex gap-2">
            <Btn onClick={save} disabled={saving || !form.title}>{saving ? '...' : editId ? 'Сохранить' : 'Создать'}</Btn>
            <Btn variant="ghost" onClick={() => { setShowForm(false); setEditId(null); }}>Отмена</Btn>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {(school.courses ?? []).map((course: AdminCourse) => (
          <div key={course.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="text-sm flex-1 min-w-0">
              <span className="font-medium">{course.title}</span>
              <span className="ml-2 text-gray-400">{course.format}</span>
              {course.duration_weeks > 0 && <span className="ml-2 text-gray-400">{course.duration_weeks} нед.</span>}
              {course.price === 0 ? (
                <span className="ml-2 text-xs px-1.5 py-0.5 rounded bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300">Бесплатно</span>
              ) : (
                <span className="ml-2 text-xs text-gray-400">{course.price} {course.price_currency}</span>
              )}
              {course.has_employment && (
                <span className="ml-2 text-xs px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">🎓 Трудоустройство</span>
              )}
            </div>
            <div className="flex gap-2 ml-2">
              <Btn variant="ghost" onClick={() => openEdit(course)} className="py-1 px-2 text-xs">Ред.</Btn>
              <Btn variant="danger" onClick={() => del(course.id)} className="py-1 px-2 text-xs">✕</Btn>
            </div>
          </div>
        ))}
        {(school.courses?.length ?? 0) === 0 && (
          <p className="text-sm text-gray-400">Нет программ. Добавь первую.</p>
        )}
      </div>
    </div>
  );
}

// ─── Tab: Badges ──────────────────────────────────────────────────────────────

function TabBadges({ school, badges, onSaved }: { school: AdminSchoolFull; badges: EntityBadge[]; onSaved: () => void }) {
  const [customIcon, setCustomIcon] = useState('');
  const [customLabel, setCustomLabel] = useState('');
  const [customLight, setCustomLight] = useState('#2563eb');
  const [customDark, setCustomDark] = useState('#3b82f6');
  const [saving, setSaving] = useState(false);

  const addPreset = async (preset: typeof SCHOOL_PREDEFINED_BADGES[number]) => {
    setSaving(true);
    try {
      await createBadge({ entityType: 'school', entityId: school.id, icon: preset.icon, label: preset.label, colorLight: preset.colorLight, colorDark: preset.colorDark, sortOrder: badges.length });
      onSaved();
    } finally { setSaving(false); }
  };

  const addCustom = async () => {
    if (!customIcon || !customLabel) return;
    setSaving(true);
    try {
      await createBadge({ entityType: 'school', entityId: school.id, icon: customIcon, label: customLabel, colorLight: customLight, colorDark: customDark, sortOrder: badges.length });
      setCustomIcon(''); setCustomLabel('');
      onSaved();
    } finally { setSaving(false); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold mb-3">Активные значки ({badges.length})</h3>
        <div className="flex flex-wrap gap-2">
          {badges.map(b => (
            <div key={b.id} className="flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium border" style={{ color: b.colorLight, borderColor: b.colorLight + '40' }}>
              <span>{b.icon === 'verified' ? '✓' : b.icon}</span>
              <span>{b.label}</span>
              <button onClick={async () => { const { deleteBadge: del } = await import('../../../../lib/admin-api'); await del(b.id); onSaved(); }} className="ml-1 text-gray-400 hover:text-red-500 text-xs">✕</button>
            </div>
          ))}
          {badges.length === 0 && <p className="text-sm text-gray-400">Нет значков</p>}
        </div>
      </div>

      <div>
        <h3 className="font-semibold mb-3">Предустановленные значки для школ</h3>
        <div className="flex flex-wrap gap-2">
          {SCHOOL_PREDEFINED_BADGES.map((preset: typeof SCHOOL_PREDEFINED_BADGES[number]) => (
            <button key={preset.label} onClick={() => addPreset(preset)} disabled={saving}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border border-gray-200 dark:border-gray-700 hover:border-blue-400 transition-colors"
              style={{ color: preset.colorLight }}>
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

function TabTheme({ school, theme, onSaved }: { school: AdminSchoolFull; theme: EntityTheme; onSaved: () => void }) {
  const [form, setForm] = useState<EntityTheme>({
    entityType: 'school', entityId: school.id,
    accentLight: theme?.accentLight ?? '#2563eb',
    accentDark: theme?.accentDark ?? '#3b82f6',
    coverGradient: theme?.coverGradient ?? 'none',
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const save = async () => {
    setSaving(true);
    try { await upsertTheme(form); setMsg('Тема сохранена ✓'); onSaved(); }
    catch { setMsg('Ошибка'); }
    finally { setSaving(false); }
  };

  return (
    <div className="space-y-5 max-w-md">
      <h3 className="font-semibold">Фирменная тема профиля школы</h3>
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
      </div>
      <div className="flex items-center gap-3">
        <Btn onClick={save} disabled={saving}>{saving ? 'Сохраняем...' : 'Сохранить тему'}</Btn>
        {msg && <span className="text-sm text-green-600 dark:text-green-400">{msg}</span>}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminSchoolEditorPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);

  const [school, setSchool] = useState<AdminSchoolFull | null>(null);
  const [badges, setBadges] = useState<EntityBadge[]>([]);
  const [theme, setTheme] = useState<EntityTheme>({ entityType: 'school', entityId: id, accentLight: '#2563eb', accentDark: '#3b82f6', coverGradient: 'none' });
  const [activeTab, setActiveTab] = useState<Tab>('main');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await fetchAdminSchool(id);
      setSchool(res.school);
      setBadges(res.badges ?? []);
      setTheme(res.theme ?? { entityType: 'school', entityId: id, accentLight: '#2563eb', accentDark: '#3b82f6', coverGradient: 'none' });
    } catch { setError('Не удалось загрузить школу'); }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>;
  if (error || !school) return <div className="p-8 text-center text-red-500">{error || 'Школа не найдена'}</div>;

  const typeLabel = SCHOOL_TYPES.find(t => t.value === school.type)?.label ?? school.type;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-600 text-sm">← Назад</button>
        <div className="flex-1">
          <h1 className="text-xl font-bold">{school.name}</h1>
          <p className="text-sm text-gray-400">ID: {school.id} · <span className="font-medium text-blue-500">{typeLabel}</span></p>
        </div>
        <div className="flex gap-2">
          {school.isVerified && <span className="px-3 py-1 rounded-full bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 text-xs font-medium">✓ Верифицировано</span>}
          {school.is_state_funded && <span className="px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs font-medium">🏛 Гос.</span>}
        </div>
      </div>

      <div className="flex gap-1 flex-wrap border-b border-gray-200 dark:border-gray-700">
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors -mb-px border-b-2 ${activeTab === tab.id ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        {activeTab === 'main'    && <TabMain school={school} onSaved={load} />}
        {activeTab === 'courses' && <TabCourses school={school} onSaved={load} />}
        {activeTab === 'badges'  && <TabBadges school={school} badges={badges} onSaved={load} />}
        {activeTab === 'theme'   && <TabTheme school={school} theme={theme} onSaved={load} />}
      </div>
    </div>
  );
}
