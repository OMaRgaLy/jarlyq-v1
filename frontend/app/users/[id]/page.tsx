'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Header } from '../../../components/header';
import { api } from '../../../lib/api';
import { useLang } from '../../../lib/lang-context';
import type { UserExperience, UserSkill, UserExtProfile } from '../../../lib/api';

interface PublicProfile {
  id: number;
  first_name: string;
  last_name: string;
  bio?: string;
  created_at: string;
  ext_profile?: UserExtProfile;
  experiences: UserExperience[];
  skills: UserSkill[];
}

function Avatar({ name, size = 'lg' }: { name: string; size?: 'sm' | 'lg' }) {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const cls = size === 'lg'
    ? 'h-20 w-20 text-2xl'
    : 'h-10 w-10 text-sm';
  return (
    <div className={`${cls} flex items-center justify-center rounded-2xl bg-brand/10 font-bold text-brand dark:bg-brand/20`}>
      {initials}
    </div>
  );
}

const levelColors: Record<string, string> = {
  beginner: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  intermediate: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  expert: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
};

export default function PublicProfilePage({ params }: { params: { id: string } }) {
  const { t } = useLang();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [status, setStatus] = useState<'loading' | 'private' | 'notfound' | 'ok'>('loading');

  useEffect(() => {
    api.get<{ user: PublicProfile }>(`/users/${params.id}`)
      .then(({ data }) => { setProfile(data.user); setStatus('ok'); })
      .catch((err) => {
        if (err?.response?.status === 403) setStatus('private');
        else setStatus('notfound');
      });
  }, [params.id]);

  const levelLabel = (l: string) =>
    l === 'beginner' ? t.profile.skillLevels.beginner
    : l === 'intermediate' ? t.profile.skillLevels.intermediate
    : t.profile.skillLevels.expert;

  if (status === 'loading') return (
    <div className="min-h-screen bg-slate-100/60 dark:bg-slate-950">
      <Header />
      <main className="mx-auto max-w-2xl px-4 py-10">
        <div className="animate-pulse space-y-4">
          <div className="flex items-center gap-4">
            <div className="h-20 w-20 rounded-2xl bg-slate-200 dark:bg-slate-800" />
            <div className="space-y-2">
              <div className="h-6 w-40 rounded-lg bg-slate-200 dark:bg-slate-800" />
              <div className="h-4 w-24 rounded-lg bg-slate-200 dark:bg-slate-800" />
            </div>
          </div>
          <div className="h-32 rounded-2xl bg-slate-200 dark:bg-slate-800" />
          <div className="h-48 rounded-2xl bg-slate-200 dark:bg-slate-800" />
        </div>
      </main>
    </div>
  );

  if (status === 'private') return (
    <div className="min-h-screen bg-slate-100/60 dark:bg-slate-950">
      <Header />
      <main className="mx-auto max-w-2xl px-4 py-20 text-center">
        <p className="text-5xl mb-4">🔒</p>
        <h1 className="text-xl font-bold text-slate-800 dark:text-white">{t.profile.privateProfile}</h1>
        <p className="mt-2 text-sm text-slate-500">{t.common.notFound}</p>
        <Link href="/" className="mt-6 inline-block text-sm text-brand hover:underline">← {t.common.back}</Link>
      </main>
    </div>
  );

  if (status === 'notfound' || !profile) return (
    <div className="min-h-screen bg-slate-100/60 dark:bg-slate-950">
      <Header />
      <main className="mx-auto max-w-2xl px-4 py-20 text-center">
        <p className="text-5xl mb-4">👤</p>
        <p className="text-slate-500">{t.common.notFound}</p>
        <Link href="/" className="mt-4 inline-block text-sm text-brand hover:underline">← {t.common.back}</Link>
      </main>
    </div>
  );

  const ep = profile.ext_profile;
  const fullName = `${profile.first_name} ${profile.last_name}`.trim();

  return (
    <div className="min-h-screen bg-slate-100/60 dark:bg-slate-950">
      <Header />
      <main className="mx-auto max-w-2xl px-4 py-10 space-y-6">

        {/* Hero card */}
        <div className="card p-6">
          <div className="flex items-start gap-5">
            <Avatar name={fullName} />
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{fullName}</h1>

              {ep?.city && (
                <p className="mt-0.5 text-sm text-slate-500">📍 {ep.city}</p>
              )}

              {profile.bio && (
                <p className="mt-3 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{profile.bio}</p>
              )}

              {/* Social links */}
              {(ep?.githubURL || ep?.linkedinURL || ep?.instagramURL) && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {ep.githubURL && (
                    <a href={ep.githubURL} target="_blank" rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:border-brand hover:text-brand dark:border-slate-700 dark:text-slate-300">
                      GitHub →
                    </a>
                  )}
                  {ep.linkedinURL && (
                    <a href={ep.linkedinURL} target="_blank" rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-[#0077B5] hover:bg-[#0077B5]/5 dark:border-slate-700">
                      LinkedIn →
                    </a>
                  )}
                  {ep.instagramURL && (
                    <a href={`https://instagram.com/${ep.instagramURL.replace('@', '')}`} target="_blank" rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-pink-500 hover:bg-pink-50 dark:border-slate-700">
                      Instagram →
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>

          <p className="mt-4 text-xs text-slate-400">
            {t.profile.memberSince} {new Date(profile.created_at).toLocaleDateString()}
          </p>
        </div>

        {/* Skills */}
        {profile.skills.length > 0 && (
          <section className="card p-6 space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-brand">{t.profile.skills}</h2>
            <div className="flex flex-wrap gap-2">
              {profile.skills.map(skill => (
                <div key={skill.id}
                  className="flex items-center gap-1.5 rounded-full border border-slate-200/70 bg-white py-1 pl-3 pr-2 dark:border-slate-700/60 dark:bg-slate-900/70">
                  <span className="text-sm font-medium text-slate-800 dark:text-slate-100">{skill.stack?.name}</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${levelColors[skill.level] ?? ''}`}>
                    {levelLabel(skill.level)}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Experience */}
        {profile.experiences.length > 0 && (
          <section className="card p-6 space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-brand">{t.profile.experience}</h2>
            <div className="space-y-3">
              {profile.experiences.map(exp => (
                <div key={exp.id}
                  className="flex gap-4 rounded-xl border border-slate-200/70 bg-white p-4 dark:border-slate-700/60 dark:bg-slate-900/70">
                  <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-brand" />
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">
                      {exp.position}
                      <span className="font-normal text-slate-500"> · {exp.companyName}</span>
                    </p>
                    <p className="text-xs text-slate-400">
                      {new Date(exp.startDate).toLocaleDateString('ru', { year: 'numeric', month: 'short' })}
                      {' — '}
                      {exp.isCurrent ? t.profile.current
                        : exp.endDate ? new Date(exp.endDate).toLocaleDateString('ru', { year: 'numeric', month: 'short' })
                        : ''}
                    </p>
                    {exp.description && (
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{exp.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

      </main>
    </div>
  );
}
