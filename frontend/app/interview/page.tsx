'use client';

import { useState } from 'react';
import { Header } from '../../components/header';
import { useInterviewQuestions, useInterviewTopics } from '../../lib/hooks';
import { useLang } from '../../lib/lang-context';

const levelColors: Record<string, string> = {
  easy: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  hard: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

// Specialty groups: topic prefix → group name
const SPECIALTY_GROUPS: { label: string; topics: string[] }[] = [
  { label: 'Backend', topics: ['Backend', 'Go', 'Golang', 'Python', 'Java', 'Node.js', 'Database', 'SQL'] },
  { label: 'Frontend', topics: ['Frontend', 'JavaScript', 'TypeScript', 'React', 'Vue', 'CSS', 'HTML'] },
  { label: 'DevOps', topics: ['DevOps', 'Docker', 'Kubernetes', 'CI/CD', 'Linux', 'Cloud'] },
  { label: 'Data Science', topics: ['Data Science', 'ML', 'Machine Learning', 'Python', 'Data', 'Analytics'] },
  { label: 'Mobile', topics: ['Mobile', 'Flutter', 'iOS', 'Android', 'React Native'] },
  { label: 'Product', topics: ['Product', 'PM', 'Product Management', 'Agile', 'Scrum'] },
];

export default function InterviewPage() {
  const [level, setLevel] = useState('');
  const [topic, setTopic] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const { t } = useLang();

  const { data: questions = [], isLoading } = useInterviewQuestions({ level, topic });
  const { data: topics = [] } = useInterviewTopics();

  // Filter by specialty group client-side (topic comes from API filter already)
  const filteredQuestions = specialty
    ? questions.filter((q) => {
        const group = SPECIALTY_GROUPS.find((g) => g.label === specialty);
        return group?.topics.some((gt) =>
          q.topic.toLowerCase().includes(gt.toLowerCase())
        );
      })
    : questions;

  const handleSpecialty = (s: string) => {
    setSpecialty(s === specialty ? '' : s);
    setTopic(''); // clear topic filter when switching specialty
  };

  const levelLabels: Record<string, string> = {
    easy: t.interview.levelEasy,
    medium: t.interview.levelMedium,
    hard: t.interview.levelHard,
  };

  return (
    <div className="min-h-screen bg-slate-100/60 dark:bg-slate-950">
      <Header />
      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            {t.interview.title}
          </h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            {t.interview.subtitle}
          </p>
        </div>

        {/* Specialty group pills */}
        <div className="mb-4 flex flex-wrap gap-2">
          <button
            onClick={() => { setSpecialty(''); setTopic(''); }}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              !specialty
                ? 'bg-brand text-white'
                : 'border border-slate-200 text-slate-600 hover:border-brand hover:text-brand dark:border-slate-700 dark:text-slate-300'
            }`}
          >
            {t.interview.allSpecialties}
          </button>
          {SPECIALTY_GROUPS.map((g) => (
            <button
              key={g.label}
              onClick={() => handleSpecialty(g.label)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                specialty === g.label
                  ? 'bg-brand text-white'
                  : 'border border-slate-200 text-slate-600 hover:border-brand hover:text-brand dark:border-slate-700 dark:text-slate-300'
              }`}
            >
              {g.label}
            </button>
          ))}
        </div>

        {/* Level and topic filters */}
        <div className="mb-6 flex flex-wrap gap-3">
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          >
            <option value="">{t.interview.allLevels}</option>
            <option value="easy">{t.interview.levelEasy}</option>
            <option value="medium">{t.interview.levelMedium}</option>
            <option value="hard">{t.interview.levelHard}</option>
          </select>

          <select
            value={topic}
            onChange={(e) => { setTopic(e.target.value); setSpecialty(''); }}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          >
            <option value="">{t.interview.allTopics}</option>
            {topics.map((tp) => (
              <option key={tp} value={tp}>
                {tp}
              </option>
            ))}
          </select>
        </div>

        {isLoading ? (
          <p className="text-sm text-slate-500">{t.interview.loading}</p>
        ) : filteredQuestions.length === 0 ? (
          <p className="text-sm text-slate-500">{t.interview.empty}</p>
        ) : (
          <div className="space-y-4">
            <p className="text-xs text-slate-400">{filteredQuestions.length} вопросов</p>
            {filteredQuestions.map((q) => (
              <div
                key={q.id}
                className="rounded-xl border border-slate-200/70 bg-white dark:border-slate-700/60 dark:bg-slate-900/70"
              >
                <button
                  type="button"
                  onClick={() => setExpandedId(expandedId === q.id ? null : q.id)}
                  className="w-full p-5 text-left"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-medium text-slate-900 dark:text-white">
                      {q.question}
                    </h3>
                    <span className="shrink-0 text-slate-400">
                      {expandedId === q.id ? '−' : '+'}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${levelColors[q.level] || ''}`}>
                      {levelLabels[q.level] || q.level}
                    </span>
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                      {q.topic}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {t.interview.timesAsked} {q.timesAsked} {t.interview.times}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {t.interview.successRate}: {q.successRate}%
                    </span>
                  </div>
                </button>

                {expandedId === q.id && (
                  <div className="border-t border-slate-100 px-5 pb-5 pt-4 dark:border-slate-800">
                    <div className="mb-3">
                      <h4 className="mb-1 text-sm font-semibold text-brand">{t.interview.answer}</h4>
                      <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-line">
                        {q.answer}
                      </p>
                    </div>
                    {q.explanation && (
                      <div>
                        <h4 className="mb-1 text-sm font-semibold text-slate-500">{t.interview.explanation}</h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-line">
                          {q.explanation}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
