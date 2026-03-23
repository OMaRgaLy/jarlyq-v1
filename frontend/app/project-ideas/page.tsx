'use client';

import { useState } from 'react';
import { Header } from '../../components/header';
import { useProjectIdeas, useProjectDirections } from '../../lib/hooks';

const difficultyLabels: Record<string, string> = {
  beginner: 'Начинающий',
  intermediate: 'Средний',
  advanced: 'Продвинутый',
};

const difficultyColors: Record<string, string> = {
  beginner: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  intermediate: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  advanced: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

const directionLabels: Record<string, string> = {
  backend: 'Backend',
  frontend: 'Frontend',
  'data-science': 'Data Science',
  'data-engineering': 'Data Engineering',
  'ml-ai': 'ML / AI',
  mobile: 'Mobile',
  devops: 'DevOps / SRE',
  qa: 'QA',
  security: 'Security',
  fullstack: 'Fullstack',
  gamedev: 'GameDev',
  blockchain: 'Blockchain',
  embedded: 'Embedded / IoT',
  product: 'Product / UX',
};

export default function ProjectIdeasPage() {
  const [direction, setDirection] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const { data: directions = [] } = useProjectDirections();
  const { data: ideas = [], isLoading } = useProjectIdeas({
    direction: direction || undefined,
    difficulty: difficulty || undefined,
  });

  return (
    <div className="min-h-screen bg-slate-100/60 dark:bg-slate-950">
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Идеи для портфолио
          </h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            Пет-проекты для вашего портфолио по всем IT направлениям
          </p>
        </div>

        <div className="mb-6 flex flex-wrap gap-3">
          <select
            value={direction}
            onChange={(e) => setDirection(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          >
            <option value="">Все направления</option>
            {directions.map((d) => (
              <option key={d} value={d}>
                {directionLabels[d] || d}
              </option>
            ))}
          </select>

          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          >
            <option value="">Все уровни</option>
            <option value="beginner">Начинающий</option>
            <option value="intermediate">Средний</option>
            <option value="advanced">Продвинутый</option>
          </select>
        </div>

        {isLoading ? (
          <p className="text-sm text-slate-500">Загружаем идеи...</p>
        ) : ideas.length === 0 ? (
          <p className="text-sm text-slate-500">Нет идей для выбранных фильтров</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {ideas.map((idea) => (
              <div
                key={idea.id}
                className="rounded-xl border border-slate-200/70 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-slate-700/60 dark:bg-slate-900/70"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-slate-900 dark:text-white">
                      {idea.title}
                    </h3>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      {directionLabels[idea.direction] || idea.direction} &middot; {idea.duration}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${difficultyColors[idea.difficulty] || 'bg-slate-100 text-slate-600'}`}
                  >
                    {difficultyLabels[idea.difficulty] || idea.difficulty}
                  </span>
                </div>

                <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
                  {idea.description}
                </p>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {idea.techStack.split(',').map((tech) => (
                    <span
                      key={tech.trim()}
                      className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                    >
                      {tech.trim()}
                    </span>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setExpandedId(expandedId === idea.id ? null : idea.id)}
                  className="mt-3 text-sm font-medium text-brand hover:underline"
                >
                  {expandedId === idea.id ? 'Свернуть' : 'Подробнее'}
                </button>

                {expandedId === idea.id && (
                  <div className="mt-4 space-y-3 border-t border-slate-100 pt-4 dark:border-slate-800">
                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Навыки
                      </h4>
                      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                        {idea.skills}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Ключевые фичи
                      </h4>
                      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                        {idea.features}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Почему это хороший проект
                      </h4>
                      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                        {idea.whyGood}
                      </p>
                    </div>
                    {idea.exampleURL && (
                      <a
                        href={idea.exampleURL}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center text-sm font-medium text-brand hover:underline"
                      >
                        Пример проекта &rarr;
                      </a>
                    )}
                  </div>
                )}

                <div className="mt-4 flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                  <span>{idea.likes} нравится</span>
                  {idea.completedBy > 0 && <span>{idea.completedBy} сделали</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
