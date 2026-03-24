'use client';

import Link from 'next/link';
import { Header } from '../../components/header';
import { useLang } from '../../lib/lang-context';
import { guideContent } from './content';

export default function InternshipGuidePage() {
  const { locale } = useLang();
  const g = guideContent[locale];

  return (
    <div className="min-h-screen bg-slate-100/60 dark:bg-slate-950">
      <Header />
      <main className="mx-auto max-w-4xl px-4 py-10 space-y-16">

        {/* Hero */}
        <section className="text-center space-y-4">
          <span className="inline-block rounded-full bg-brand/10 px-4 py-1.5 text-sm font-medium text-brand">
            {g.hero.badge}
          </span>
          <h1 className="text-4xl font-bold leading-tight text-slate-900 dark:text-white whitespace-pre-line">
            {g.hero.title}
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-slate-600 dark:text-slate-300">
            {g.hero.subtitle}
          </p>
        </section>

        {/* Что такое стажировка */}
        <section className="space-y-6">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{g.whatIs.title}</h2>
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{g.whatIs.intro}</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {g.whatIs.types.map((type) => (
              <div key={type.title} className="card p-4 space-y-2">
                <div className="text-2xl">{type.icon}</div>
                <h3 className="font-semibold text-slate-900 dark:text-white">{type.title}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-300">{type.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Формула успеха */}
        <section className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{g.formula.title}</h2>
            <p className="mt-1 text-slate-500 dark:text-slate-400">{g.formula.subtitle}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {g.formula.items.map((item, i) => (
              <div key={item.title} className="card p-5 space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{item.icon}</span>
                  <span className="text-xs font-bold text-brand">0{i + 1}</span>
                </div>
                <h3 className="font-semibold text-slate-900 dark:text-white">{item.title}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-300">{item.desc}</p>
              </div>
            ))}
          </div>
          <div className="rounded-xl border border-brand/20 bg-brand/5 px-5 py-4 text-sm text-slate-700 dark:text-slate-200">
            {g.formula.note}
          </div>
        </section>

        {/* Специальности */}
        <section className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{g.specialties.title}</h2>
            <p className="mt-1 text-slate-500 dark:text-slate-400">{g.specialties.subtitle}</p>
          </div>
          <div className="space-y-4">
            {g.specialties.list.map((spec) => (
              <details key={spec.title} className="card group">
                <summary className="flex cursor-pointer items-center justify-between gap-4 p-5 list-none">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{spec.icon}</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{spec.title}</span>
                  </div>
                  <span className="text-slate-400 transition group-open:rotate-180">▾</span>
                </summary>
                <div className="border-t border-slate-100 px-5 pb-5 pt-4 dark:border-slate-800 space-y-4">
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-brand">Навыки</p>
                    <ul className="flex flex-wrap gap-2">
                      {spec.skills.map((s) => (
                        <li key={s} className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-brand">Пет-проект</p>
                    <p className="text-sm text-slate-600 dark:text-slate-300">{spec.petProject}</p>
                  </div>
                  <div className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
                    💡 {spec.tip}
                  </div>
                </div>
              </details>
            ))}
          </div>
        </section>

        {/* Пошаговый план */}
        <section className="space-y-6">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{g.steps.title}</h2>
          <ol className="space-y-4">
            {g.steps.list.map((step) => (
              <li key={step.num} className="flex gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-bold text-white">
                  {step.num}
                </span>
                <div className="pt-1.5">
                  <p className="font-semibold text-slate-900 dark:text-white">{step.title}</p>
                  <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-300">{step.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* Лайфхаки */}
        <section className="space-y-6">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{g.lifehacks.title}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {g.lifehacks.list.map((hack) => (
              <div key={hack.title} className="card flex gap-4 p-4">
                <span className="text-2xl">{hack.emoji}</span>
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">{hack.title}</p>
                  <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-300">{hack.text}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Нетворкинг */}
        <section className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{g.network.title}</h2>
            <p className="mt-1 text-slate-500 dark:text-slate-400">{g.network.subtitle}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {g.network.blocks.map((block) => (
              <div key={block.title} className="card p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{block.icon}</span>
                  <h3 className="font-semibold text-slate-900 dark:text-white">{block.title}</h3>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-300">{block.desc}</p>
                <ul className="space-y-1">
                  {block.examples.map((ex) => (
                    <li key={ex} className="flex items-start gap-2 text-sm text-slate-500 dark:text-slate-400">
                      <span className="mt-0.5 text-brand">›</span>
                      {ex}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Таймлайн */}
        <section className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{g.timeline.title}</h2>
            <p className="mt-1 text-slate-500 dark:text-slate-400">{g.timeline.subtitle}</p>
          </div>
          <div className="relative space-y-0">
            {g.timeline.items.map((item, i) => (
              <div key={item.month} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-xs font-bold text-white shrink-0">
                    {i + 1}
                  </div>
                  {i < g.timeline.items.length - 1 && (
                    <div className="w-0.5 flex-1 bg-brand/20 my-1" />
                  )}
                </div>
                <div className="pb-6">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-bold text-brand">{item.month}</span>
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      {item.label}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="card p-8 text-center space-y-4 bg-gradient-to-br from-brand/5 to-slate-50 dark:from-brand/10 dark:to-slate-900">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{g.cta.title}</h2>
          <p className="text-slate-600 dark:text-slate-300">{g.cta.subtitle}</p>
          <Link
            href="/#companies"
            className="inline-flex rounded-xl bg-brand px-6 py-3 font-semibold text-white hover:bg-brand-dark transition-colors"
          >
            {g.cta.button}
          </Link>
        </section>

      </main>
    </div>
  );
}
