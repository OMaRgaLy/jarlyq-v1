'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '../../components/header';
import { api } from '../../lib/api';
import { getToken, getRefreshToken, getUser, saveAuth } from '../../lib/auth';
import { useLang } from '../../lib/lang-context';
import type { Stack, UserExperience, UserSkill, UserExtProfile } from '../../lib/api';

interface FullProfile {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  telegram?: string;
  bio?: string;
  theme?: string;
  created_at: string;
  privacy: {
    profile_public: boolean;
    phone_private: boolean;
    telegram_private: boolean;
    email_private: boolean;
  };
  ext_profile?: UserExtProfile;
  experiences: UserExperience[];
  skills: UserSkill[];
  preferred_stacks: Stack[];
  role: string;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-sm font-semibold uppercase tracking-wide text-brand">{children}</h2>;
}

export default function ProfilePage() {
  const router = useRouter();
  const { t } = useLang();

  const [profile, setProfile] = useState<FullProfile | null>(null);
  const [stacks, setStacks] = useState<Stack[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  // Basic info form
  const [form, setForm] = useState({ first_name: '', last_name: '', phone: '', telegram: '', bio: '' });
  // Ext profile form
  const [extForm, setExtForm] = useState({ city: '', github_url: '', linkedin_url: '', instagram_url: '' });
  // New experience form
  const [showExpForm, setShowExpForm] = useState(false);
  const [expForm, setExpForm] = useState({ company_name: '', position: '', start_date: '', end_date: '', is_current: false, description: '' });
  // New skill form
  const [showSkillForm, setShowSkillForm] = useState(false);
  const [skillForm, setSkillForm] = useState({ stack_id: 0, level: 'beginner' });
  // Preferred stacks
  const [preferredStackIds, setPreferredStackIds] = useState<number[]>([]);
  const [savingStacks, setSavingStacks] = useState(false);

  const loadProfile = useCallback(async () => {
    const token = getToken();
    if (!token) { router.push('/'); return; }
    try {
      const { data } = await api.get<{ user: FullProfile }>('/users/me');
      setProfile(data.user);
      setForm({
        first_name: data.user.first_name || '',
        last_name: data.user.last_name || '',
        phone: data.user.phone || '',
        telegram: data.user.telegram || '',
        bio: data.user.bio || '',
      });
      setPreferredStackIds((data.user.preferred_stacks ?? []).map(s => s.id));
      const ep = data.user.ext_profile;
      setExtForm({
        city: ep?.city || '',
        github_url: ep?.githubURL || '',
        linkedin_url: ep?.linkedinURL || '',
        instagram_url: ep?.instagramURL || '',
      });
    } catch {
      setError(t.common.loading);
    } finally {
      setLoading(false);
    }
  }, [router, t.common.loading]);

  useEffect(() => {
    loadProfile();
    api.get<{ stacks: Stack[] }>('/stacks').then(({ data }) => setStacks(data.stacks)).catch(() => {});
  }, [loadProfile]);

  const handleSave = async () => {
    setSaving(true); setSaved(false);
    try {
      const { data } = await api.put<{ user: { first_name: string; last_name: string } }>('/users/me', form);
      const cached = getUser();
      if (cached) saveAuth(getToken()!, getRefreshToken() ?? '', { ...cached, first_name: data.user.first_name, last_name: data.user.last_name });
      await api.put('/users/me/ext-profile', extForm);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      loadProfile();
    } catch {
      setError(t.common.loading);
    } finally {
      setSaving(false);
    }
  };

  const togglePublic = async () => {
    if (!profile) return;
    const next = !profile.privacy.profile_public;
    await api.put('/users/me/privacy', { profile_public: next });
    setProfile(p => p ? { ...p, privacy: { ...p.privacy, profile_public: next } } : p);
  };

  const handleAddExperience = async () => {
    try {
      await api.post('/users/me/experiences', {
        ...expForm,
        start_date: expForm.start_date ? new Date(expForm.start_date).toISOString() : undefined,
        end_date: expForm.end_date ? new Date(expForm.end_date).toISOString() : undefined,
      });
      setShowExpForm(false);
      setExpForm({ company_name: '', position: '', start_date: '', end_date: '', is_current: false, description: '' });
      loadProfile();
    } catch { /* ignore */ }
  };

  const handleDeleteExperience = async (eid: number) => {
    await api.delete(`/users/me/experiences/${eid}`);
    loadProfile();
  };

  const handleAddSkill = async () => {
    if (!skillForm.stack_id) return;
    try {
      await api.post('/users/me/skills', skillForm);
      setShowSkillForm(false);
      setSkillForm({ stack_id: 0, level: 'beginner' });
      loadProfile();
    } catch { /* ignore */ }
  };

  const handleDeleteSkill = async (sid: number) => {
    await api.delete(`/users/me/skills/${sid}`);
    loadProfile();
  };

  const togglePreferredStack = (id: number) => {
    setPreferredStackIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : prev.length < 10 ? [...prev, id] : prev,
    );
  };

  const [stacksSaved, setStacksSaved] = useState(false);
  const handleSaveStacks = async () => {
    setSavingStacks(true);
    try {
      await api.put('/users/me/preferred-stacks', { stack_ids: preferredStackIds });
      setStacksSaved(true);
      setTimeout(() => setStacksSaved(false), 3000);
    } catch { /* ignore */ }
    finally { setSavingStacks(false); }
  };

  const levelLabel = (l: string) =>
    l === 'beginner' ? t.profile.skillLevels.beginner
    : l === 'intermediate' ? t.profile.skillLevels.intermediate
    : t.profile.skillLevels.expert;

  const levelColors: Record<string, string> = {
    beginner: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    intermediate: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    expert: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-100/60 dark:bg-slate-950">
      <Header />
      <main className="mx-auto max-w-2xl px-4 py-10">
        <div className="space-y-4 animate-pulse">
          <div className="h-8 w-48 rounded-xl bg-slate-200 dark:bg-slate-800" />
          <div className="h-64 rounded-2xl bg-slate-200 dark:bg-slate-800" />
          <div className="h-40 rounded-2xl bg-slate-200 dark:bg-slate-800" />
        </div>
      </main>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-100/60 dark:bg-slate-950">
      <Header />
      <main className="mx-auto max-w-2xl px-4 py-10 space-y-6">

        {/* Header + privacy toggle */}
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t.profile.title}</h1>
          {profile && (
            <button
              onClick={togglePublic}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                profile.privacy.profile_public
                  ? 'bg-brand/10 text-brand hover:bg-brand/20'
                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400'
              }`}
            >
              {profile.privacy.profile_public ? '🌐 ' + t.profile.publicProfile : '🔒 ' + t.profile.privateProfile}
            </button>
          )}
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        {/* Basic info */}
        <section className="card p-6 space-y-4">
          <SectionTitle>{t.profile.editProfile}</SectionTitle>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Email</label>
            <p className="rounded-xl border border-slate-200/70 bg-slate-50 px-3 py-2 text-sm text-slate-500 dark:border-slate-700/60 dark:bg-slate-800/50">
              {profile?.email}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">{t.profile.firstName}</label>
              <input
                value={form.first_name}
                onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-brand focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">{t.profile.lastName}</label>
              <input
                value={form.last_name}
                onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-brand focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Телефон</label>
            <input
              type="tel"
              value={form.phone}
              onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              placeholder="+7 700 000 0000"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-brand focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
            <p className="mt-1 text-xs text-slate-400">{t.reviews.phoneRequired}</p>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Telegram</label>
            <input
              value={form.telegram}
              onChange={e => setForm(f => ({ ...f, telegram: e.target.value }))}
              placeholder="@username"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-brand focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">{t.profile.bio}</label>
            <textarea
              value={form.bio}
              onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
              rows={3}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-brand focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          {/* Extended profile */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">{t.profile.city}</label>
              <input
                value={extForm.city}
                onChange={e => setExtForm(f => ({ ...f, city: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-brand focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">{t.profile.github}</label>
              <input
                value={extForm.github_url}
                onChange={e => setExtForm(f => ({ ...f, github_url: e.target.value }))}
                placeholder="https://github.com/..."
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-brand focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">{t.profile.linkedin}</label>
              <input
                value={extForm.linkedin_url}
                onChange={e => setExtForm(f => ({ ...f, linkedin_url: e.target.value }))}
                placeholder="https://linkedin.com/in/..."
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-brand focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">{t.profile.instagram}</label>
              <input
                value={extForm.instagram_url}
                onChange={e => setExtForm(f => ({ ...f, instagram_url: e.target.value }))}
                placeholder="@username"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-brand focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className={`w-full rounded-xl py-2.5 text-sm font-semibold text-white transition-colors disabled:opacity-50 ${saved ? 'bg-green-600' : 'bg-brand hover:bg-brand-dark'}`}
          >
            {saved ? t.profile.saved : saving ? t.profile.saving : t.profile.saveChanges}
          </button>
        </section>

        {/* Experience */}
        <section className="card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <SectionTitle>{t.profile.experience}</SectionTitle>
            <button
              onClick={() => setShowExpForm(v => !v)}
              className="text-sm text-brand hover:underline"
            >
              {t.profile.addExperience}
            </button>
          </div>

          {showExpForm && (
            <div className="rounded-2xl border border-slate-200/70 bg-slate-50 p-4 space-y-3 dark:border-slate-700/60 dark:bg-slate-800/50">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs text-slate-500">{t.profile.city === 'Город' ? 'Компания' : 'Company'}</label>
                  <input value={expForm.company_name} onChange={e => setExpForm(f => ({ ...f, company_name: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900" />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-500">{t.reviews.position}</label>
                  <input value={expForm.position} onChange={e => setExpForm(f => ({ ...f, position: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900" />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-500">Начало</label>
                  <input type="month" value={expForm.start_date} onChange={e => setExpForm(f => ({ ...f, start_date: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900" />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-500">Конец</label>
                  <input type="month" value={expForm.end_date} disabled={expForm.is_current}
                    onChange={e => setExpForm(f => ({ ...f, end_date: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900" />
                </div>
              </div>
              <label className="flex items-center gap-2 text-xs text-slate-500 cursor-pointer">
                <input type="checkbox" checked={expForm.is_current} onChange={e => setExpForm(f => ({ ...f, is_current: e.target.checked }))} />
                {t.profile.current}
              </label>
              <textarea value={expForm.description} onChange={e => setExpForm(f => ({ ...f, description: e.target.value }))}
                placeholder={t.profile.bio} rows={2}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900" />
              <div className="flex gap-2">
                <button onClick={handleAddExperience} className="rounded-xl bg-brand px-4 py-1.5 text-sm font-semibold text-white hover:bg-brand-dark">
                  {t.profile.saveChanges}
                </button>
                <button onClick={() => setShowExpForm(false)} className="rounded-xl border border-slate-200 px-4 py-1.5 text-sm text-slate-500 dark:border-slate-700">
                  {t.profile.cancel}
                </button>
              </div>
            </div>
          )}

          {(profile?.experiences ?? []).length === 0 && !showExpForm ? (
            <p className="text-sm text-slate-400">{t.profile.addExperience}</p>
          ) : (
            <div className="space-y-3">
              {(profile?.experiences ?? []).map(exp => (
                <div key={exp.id} className="flex items-start justify-between gap-3 rounded-xl border border-slate-200/70 bg-white p-3 dark:border-slate-700/60 dark:bg-slate-900/70">
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">{exp.position} · {exp.companyName}</p>
                    <p className="text-xs text-slate-400">
                      {new Date(exp.startDate).toLocaleDateString('ru', { year: 'numeric', month: 'short' })}
                      {' — '}
                      {exp.isCurrent ? t.profile.current : exp.endDate ? new Date(exp.endDate).toLocaleDateString('ru', { year: 'numeric', month: 'short' }) : ''}
                    </p>
                    {exp.description && <p className="mt-1 text-xs text-slate-500">{exp.description}</p>}
                  </div>
                  <button onClick={() => handleDeleteExperience(exp.id)} className="text-slate-300 hover:text-red-400 dark:text-slate-600">✕</button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Skills */}
        <section className="card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <SectionTitle>{t.profile.skills}</SectionTitle>
            <button onClick={() => setShowSkillForm(v => !v)} className="text-sm text-brand hover:underline">
              {t.profile.addSkill}
            </button>
          </div>

          {showSkillForm && (
            <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200/70 bg-slate-50 p-4 dark:border-slate-700/60 dark:bg-slate-800/50">
              <div>
                <label className="mb-1 block text-xs text-slate-500">{t.company.techStack}</label>
                <select
                  value={skillForm.stack_id}
                  onChange={e => setSkillForm(f => ({ ...f, stack_id: Number(e.target.value) }))}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                >
                  <option value={0}>—</option>
                  {stacks.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-500">{t.profile.skillLevels.beginner}</label>
                <select
                  value={skillForm.level}
                  onChange={e => setSkillForm(f => ({ ...f, level: e.target.value }))}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                >
                  <option value="beginner">{t.profile.skillLevels.beginner}</option>
                  <option value="intermediate">{t.profile.skillLevels.intermediate}</option>
                  <option value="expert">{t.profile.skillLevels.expert}</option>
                </select>
              </div>
              <button onClick={handleAddSkill} className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark">
                +
              </button>
              <button onClick={() => setShowSkillForm(false)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-500 dark:border-slate-700">
                {t.profile.cancel}
              </button>
            </div>
          )}

          {(profile?.skills ?? []).length === 0 && !showSkillForm ? (
            <p className="text-sm text-slate-400">{t.profile.addSkill}</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {(profile?.skills ?? []).map(skill => (
                <div key={skill.id} className="flex items-center gap-1.5 rounded-full border border-slate-200/70 bg-white py-1 pl-3 pr-2 dark:border-slate-700/60 dark:bg-slate-900/70">
                  <span className="text-sm font-medium text-slate-800 dark:text-slate-100">{skill.stack?.name}</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${levelColors[skill.level] ?? ''}`}>
                    {levelLabel(skill.level)}
                  </span>
                  <button onClick={() => handleDeleteSkill(skill.id)} className="text-slate-300 hover:text-red-400 dark:text-slate-600 text-xs">✕</button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Preferred Stacks */}
        <section className="card p-6 space-y-4">
          <SectionTitle>{t.profile.preferredStacks}</SectionTitle>
          <p className="text-xs text-slate-400">{t.profile.preferredStacksHint}</p>
          <div className="flex flex-wrap gap-2">
            {stacks.map(s => {
              const selected = preferredStackIds.includes(s.id);
              return (
                <button
                  key={s.id}
                  onClick={() => togglePreferredStack(s.id)}
                  className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                    selected
                      ? 'bg-brand text-white'
                      : 'border border-slate-200 bg-white text-slate-600 hover:border-brand hover:text-brand dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  {s.name}
                </button>
              );
            })}
          </div>
          <button
            onClick={handleSaveStacks}
            disabled={savingStacks}
            className={`rounded-xl px-5 py-2 text-sm font-semibold text-white transition-colors disabled:opacity-50 ${stacksSaved ? 'bg-green-600' : 'bg-brand hover:bg-brand-dark'}`}
          >
            {stacksSaved ? t.profile.stacksSaved : savingStacks ? t.profile.saving : t.profile.saveStacks}
          </button>
        </section>

        {/* Member since */}
        {profile && (
          <p className="text-center text-xs text-slate-400">
            {t.profile.memberSince} {new Date(profile.created_at).toLocaleDateString()}
          </p>
        )}

      </main>
    </div>
  );
}
