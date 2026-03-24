'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '../../components/header';
import { api } from '../../lib/api';
import { getToken, getUser, saveAuth } from '../../lib/auth';
import { useLang } from '../../lib/lang-context';

interface UserProfile {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  telegram?: string;
  bio?: string;
}

const labels = {
  ru: {
    title: 'Мой профиль',
    firstName: 'Имя', lastName: 'Фамилия', email: 'Email',
    phone: 'Телефон', telegram: 'Telegram', bio: 'О себе',
    save: 'Сохранить', saving: 'Сохраняем...', saved: 'Сохранено!',
    loading: 'Загружаем профиль...', error: 'Ошибка загрузки',
    memberSince: 'Участник с',
  },
  en: {
    title: 'My Profile',
    firstName: 'First name', lastName: 'Last name', email: 'Email',
    phone: 'Phone', telegram: 'Telegram', bio: 'About me',
    save: 'Save', saving: 'Saving...', saved: 'Saved!',
    loading: 'Loading profile...', error: 'Load error',
    memberSince: 'Member since',
  },
  kk: {
    title: 'Менің профилім',
    firstName: 'Аты', lastName: 'Тегі', email: 'Email',
    phone: 'Телефон', telegram: 'Telegram', bio: 'Өзім туралы',
    save: 'Сақтау', saving: 'Сақталуда...', saved: 'Сақталды!',
    loading: 'Профиль жүктелуде...', error: 'Жүктеу қатесі',
    memberSince: 'Мүше болған',
  },
};

export default function ProfilePage() {
  const router = useRouter();
  const { locale } = useLang();
  const l = labels[locale];

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [form, setForm] = useState({ first_name: '', last_name: '', phone: '', telegram: '', bio: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = getToken();
    if (!token) { router.push('/'); return; }

    api.get<UserProfile>('/users/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(({ data }) => {
        setProfile(data);
        setForm({
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          phone: data.phone || '',
          telegram: data.telegram || '',
          bio: data.bio || '',
        });
      })
      .catch(() => setError(l.error))
      .finally(() => setLoading(false));
  }, [router, l.error]);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const token = getToken();
      const { data } = await api.put<{ user: UserProfile }>('/users/me', form, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProfile(data.user);
      // update cached user name
      const cached = getUser();
      if (cached) {
        saveAuth(token!, { ...cached, first_name: form.first_name, last_name: form.last_name });
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError(locale === 'ru' ? 'Ошибка сохранения' : 'Save error');
    } finally {
      setSaving(false);
    }
  };

  const field = (key: keyof typeof form, label: string, type = 'text') => (
    <div key={key}>
      <label className="mb-1 block text-xs font-medium text-slate-500">{label}</label>
      <input
        type={type}
        value={form[key]}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-brand focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
      />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-100/60 dark:bg-slate-950">
      <Header />
      <main className="mx-auto max-w-xl px-4 py-10 space-y-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{l.title}</h1>

        {loading ? (
          <div className="card p-6 animate-pulse space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-10 rounded-xl bg-slate-200 dark:bg-slate-800" />
            ))}
          </div>
        ) : error ? (
          <div className="card p-6 text-center text-slate-500">{error}</div>
        ) : (
          <div className="card p-6 space-y-4">
            {/* Email (read-only) */}
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">{l.email}</label>
              <p className="rounded-xl border border-slate-200/70 bg-slate-50 px-3 py-2 text-sm text-slate-500 dark:border-slate-700/60 dark:bg-slate-800/50">
                {profile?.email}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {field('first_name', l.firstName)}
              {field('last_name', l.lastName)}
            </div>
            {field('phone', l.phone, 'tel')}
            {field('telegram', l.telegram)}

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">{l.bio}</label>
              <textarea
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                rows={3}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-brand focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <button
              onClick={handleSave}
              disabled={saving}
              className={`w-full rounded-xl py-2.5 text-sm font-semibold text-white transition-colors disabled:opacity-50 ${saved ? 'bg-green-600' : 'bg-brand hover:bg-brand-dark'}`}
            >
              {saved ? l.saved : saving ? l.saving : l.save}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
