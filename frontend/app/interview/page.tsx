'use client';

import { useState } from 'react';
import { Header } from '../../components/header';
import { useInterviewQuestions, useInterviewTopics } from '../../lib/hooks';

const levelLabels: Record<string, string> = {
  easy: 'Легкий',
  medium: 'Средний',
  hard: 'Сложный',
};

const levelColors: Record<string, string> = {
  easy: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  hard: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

export default function InterviewPage() {
  const [level, setLevel] = useState('');
  const [topic, setTopic] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const { data: questions = [], isLoading } = useInterviewQuestions({ level, topic });
  const { data: topics = [] } = useInterviewTopics();

  return (
    <div className="min-h-screen bg-slate-100/60 dark:bg-slate-950">
      <Header />
      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Вопросы с собеседований
          </h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            Подготовься к интервью с реальными вопросами от компаний
          </p>
        </div>

        <div className="mb-6 flex flex-wrap gap-3">
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          >
            <option value="">Все уровни</option>
            <option value="easy">Легкий</option>
            <option value="medium">Средний</option>
            <option value="hard">Сложный</option>
          </select>

          <select
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          >
            <option value="">Все темы</option>
            {topics.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        {isLoading ? (
          <p className="text-sm text-slate-500">Загружаем вопросы...</p>
        ) : questions.length === 0 ? (
          <p className="text-sm text-slate-500">Нет вопросов для выбранных фильтров</p>
        ) : (
          <div className="space-y-4">
            {questions.map((q) => (
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
                      Спрашивали {q.timesAsked} раз
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      Успех: {q.successRate}%
                    </span>
                  </div>
                </button>

                {expandedId === q.id && (
                  <div className="border-t border-slate-100 px-5 pb-5 pt-4 dark:border-slate-800">
                    <div className="mb-3">
                      <h4 className="mb-1 text-sm font-semibold text-brand">Ответ</h4>
                      <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-line">
                        {q.answer}
                      </p>
                    </div>
                    {q.explanation && (
                      <div>
                        <h4 className="mb-1 text-sm font-semibold text-slate-500">Пояснение</h4>
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
