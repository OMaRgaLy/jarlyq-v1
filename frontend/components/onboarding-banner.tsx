'use client';

import { useState, useEffect } from 'react';
import { useLang } from '../lib/lang-context';

const STORAGE_KEY = 'jarlyq_user_type';
type UserType = 'student' | 'jobseeker' | 'company';

export function OnboardingBanner() {
  const { t } = useLang();
  const [dismissed, setDismissed] = useState(true); // start true to avoid flash

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) setDismissed(false);
  }, []);

  const handleSelect = (type: UserType) => {
    localStorage.setItem(STORAGE_KEY, type);
    setDismissed(true);
  };

  if (dismissed) return null;

  const personas = [
    {
      type: 'student' as UserType,
      emoji: '🎓',
      label: t.onboarding.studentLabel,
      description: t.onboarding.studentDesc,
    },
    {
      type: 'jobseeker' as UserType,
      emoji: '💼',
      label: t.onboarding.jobseekerLabel,
      description: t.onboarding.jobseekerDesc,
    },
    {
      type: 'company' as UserType,
      emoji: '🏢',
      label: t.onboarding.companyLabel,
      description: t.onboarding.companyDesc,
    },
  ];

  return (
    <section className="card p-6">
      <h2 className="section-title mb-1">{t.onboarding.title}</h2>
      <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
        {t.onboarding.subtitle}
      </p>
      <div className="grid gap-3 sm:grid-cols-3">
        {personas.map((p) => (
          <button
            key={p.type}
            onClick={() => handleSelect(p.type)}
            className="flex flex-col items-start gap-2 rounded-2xl border-2 border-transparent bg-slate-50 p-4 text-left transition hover:border-brand hover:bg-white dark:bg-slate-900/50 dark:hover:bg-slate-900"
          >
            <span className="text-3xl">{p.emoji}</span>
            <p className="font-semibold text-slate-900 dark:text-white">{p.label}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{p.description}</p>
          </button>
        ))}
      </div>
    </section>
  );
}
