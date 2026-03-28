'use client';

import { useEffect, useState } from 'react';
import { Header } from '../../components/header';
import { Footer } from '../../components/footer';
import { api, Hackathon } from '../../lib/api';
import { useLang } from '../../lib/lang-context';

function formatDate(dateStr?: string) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
}

function daysLeft(dateStr?: string) {
  if (!dateStr) return null;
  const diff = Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
  if (diff < 0) return null;
  if (diff === 0) return 'сегодня!';
  return `${diff} дн.`;
}

export default function HackathonsPage() {
  const { t } = useLang();
  const [hackathons, setHackathons] = useState<Hackathon[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/hackathons')
      .then(r => setHackathons(r.data.hackathons ?? []))
      .finally(() => setLoading(false));
  }, []);

  const active = hackathons.filter(h => h.isActive);
  const ended = hackathons.filter(h => !h.isActive);

  return (
    <div className="min-h-screen flex flex-col bg-slate-100/60 dark:bg-slate-950">
      <Header />
      <main className="flex-1 mx-auto max-w-5xl px-4 py-8">
        {/* Hero */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{t.hackathons.title}</h1>
          <p className="mt-2 text-slate-500 dark:text-slate-400">{t.hackathons.subtitle}</p>
        </div>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-56 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
            ))}
          </div>
        ) : hackathons.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-4xl">🛠️</p>
            <p className="mt-3 text-slate-500">{t.hackathons.empty}</p>
          </div>
        ) : (
          <>
            {active.length > 0 && (
              <section className="mb-10">
                <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white">
                  <span className="flex h-2 w-2 rounded-full bg-green-500" />
                  {t.hackathons.active}
                </h2>
                <div className="grid gap-5 sm:grid-cols-2">
                  {active.map(h => <HackathonCard key={h.id} hack={h} t={t} />)}
                </div>
              </section>
            )}
            {ended.length > 0 && (
              <section>
                <h2 className="mb-4 text-lg font-semibold text-slate-500">{t.hackathons.ended}</h2>
                <div className="grid gap-5 sm:grid-cols-2 opacity-60">
                  {ended.map(h => <HackathonCard key={h.id} hack={h} t={t} />)}
                </div>
              </section>
            )}
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}

function HackathonCard({ hack, t }: { hack: Hackathon; t: ReturnType<typeof useLang>['t'] }) {
  const regLeft = daysLeft(hack.registrationDeadline);
  const stacks = hack.techStack ? hack.techStack.split(',').map(s => s.trim()).filter(Boolean) : [];

  return (
    <article className="flex flex-col gap-4 rounded-2xl border border-slate-200/70 bg-white p-6 transition hover:shadow-md dark:border-slate-700/60 dark:bg-slate-900">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">{hack.title}</h3>
          {hack.organizer && (
            <p className="text-sm text-slate-500">{hack.organizer}</p>
          )}
        </div>
        {hack.isOnline && (
          <span className="shrink-0 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
            {t.hackathons.online}
          </span>
        )}
      </div>

      {/* Description */}
      {hack.description && (
        <p className="text-sm leading-relaxed text-slate-600 line-clamp-3 dark:text-slate-400">{hack.description}</p>
      )}

      {/* Tech stack */}
      {stacks.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {stacks.map(s => (
            <span key={s} className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              #{s}
            </span>
          ))}
        </div>
      )}

      {/* Meta */}
      <div className="space-y-1.5 border-t border-slate-100 pt-3 dark:border-slate-800">
        {hack.location && (
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <span>📍</span> {hack.location}
          </div>
        )}
        {hack.prizePool && (
          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-slate-300">
            <span>🏆</span> {t.hackathons.prize}: {hack.prizePool}
          </div>
        )}
        {hack.registrationDeadline && (
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <span>⏰</span>
            <span>{t.hackathons.deadline}: {formatDate(hack.registrationDeadline)}</span>
            {regLeft && (
              <span className="ml-1 rounded-full bg-red-50 px-2 py-0.5 font-medium text-red-500 dark:bg-red-900/20">
                {regLeft}
              </span>
            )}
          </div>
        )}
        {hack.startDate && (
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <span>🗓️</span> {t.hackathons.starts}: {formatDate(hack.startDate)}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        {hack.registerURL && (
          <a
            href={hack.registerURL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 rounded-xl bg-brand py-2.5 text-center text-sm font-semibold text-white transition hover:bg-brand-dark"
          >
            {t.hackathons.register}
          </a>
        )}
        {hack.websiteURL && hack.websiteURL !== hack.registerURL && (
          <a
            href={hack.websiteURL}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-600 hover:border-brand hover:text-brand dark:border-slate-700 dark:text-slate-300"
          >
            {t.hackathons.website}
          </a>
        )}
      </div>
    </article>
  );
}
