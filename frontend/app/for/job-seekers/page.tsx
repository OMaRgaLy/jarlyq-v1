'use client';

import Link from 'next/link';
import { Header } from '../../../components/header';
import { Footer } from '../../../components/footer';
import { getToken } from '../../../lib/auth';

export default function ForJobSeekersPage() {
  const isLoggedIn = !!getToken();

  const sections = [
    {
      icon: '🔍', href: '/internships',
      title: 'Стажировки',
      desc: 'Пока другие скролят ленту — ты уже отправил заявку. Актуальные стажировки в IT-компаниях региона с дедлайнами, зарплатами и форматом работы.',
      gradient: 'from-indigo-500 to-blue-600',
      bg: 'bg-indigo-50/80 dark:bg-indigo-950/20',
      tags: ['20+ компаний', 'Дедлайны', 'Фильтры по городу'],
    },
    {
      icon: '💼', href: '/jobs',
      title: 'Вакансии',
      desc: 'Junior и Middle позиции для тех, кто готов работать. Фильтруй по стеку, городу и формату — найди именно своё.',
      gradient: 'from-emerald-500 to-teal-600',
      bg: 'bg-emerald-50/80 dark:bg-emerald-950/20',
      tags: ['По стеку', 'Зарплаты', 'Удалёнка'],
    },
    {
      icon: '🏢', href: '/companies',
      title: 'Компании',
      desc: 'Изучи компании изнутри: стек технологий, отзывы сотрудников, открытые позиции, контакты HR. Всё на одной странице.',
      gradient: 'from-sky-500 to-cyan-600',
      bg: 'bg-sky-50/80 dark:bg-sky-950/20',
      tags: ['Стек', 'Отзывы', 'HR контакты'],
    },
    {
      icon: '🗺️', href: '/career-paths',
      title: 'Карьерные треки',
      desc: 'Не знаешь что учить и в каком порядке? Пошаговые треки от выбора направления до Senior-позиции. С материалами и курсами.',
      gradient: 'from-purple-500 to-violet-600',
      bg: 'bg-purple-50/80 dark:bg-purple-950/20',
      tags: ['Пошаговые', 'Материалы', 'От нуля до Senior'],
    },
    {
      icon: '🎯', href: '/interview',
      title: 'Подготовка к собеседованиям',
      desc: 'Вопросы и задачи с реальных собеседований в IT-компаниях. По уровням сложности и с ответами — тренируйся перед интервью.',
      gradient: 'from-amber-500 to-orange-600',
      bg: 'bg-amber-50/80 dark:bg-amber-950/20',
      tags: ['Реальные вопросы', 'По уровням', 'С ответами'],
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-slate-950">
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden px-4 py-16 sm:py-24">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -left-40 top-0 h-[400px] w-[400px] rounded-full bg-indigo-100/60 blur-3xl dark:bg-indigo-900/10" />
            <div className="absolute -right-40 bottom-0 h-[300px] w-[300px] rounded-full bg-purple-100/60 blur-3xl dark:bg-purple-900/10" />
          </div>
          <div className="relative mx-auto max-w-3xl text-center">
            <div className="mb-5 inline-flex rounded-full bg-indigo-100 px-4 py-1.5 text-sm font-semibold text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
              💼 Для тех, кто ищет работу
            </div>
            <h1 className="text-3xl font-extrabold leading-tight text-slate-900 dark:text-white sm:text-5xl">
              Первый оффер ближе, чем кажется
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-slate-500 dark:text-slate-400 sm:text-lg">
              Компании региона прямо сейчас ищут стажёров и джунов. Мы собрали все позиции, компании и инструменты подготовки — чтобы тебе осталось только откликнуться.
            </p>
          </div>
        </section>

        {/* Sections */}
        <section className="mx-auto max-w-5xl px-4 pb-16">
          <div className="space-y-5">
            {sections.map(({ icon, href, title, desc, gradient, bg, tags }, i) => (
              <Link
                key={href}
                href={href}
                className={`group flex flex-col gap-5 rounded-3xl ${bg} p-6 transition hover:shadow-xl sm:flex-row sm:items-center sm:p-8 ${i % 2 === 1 ? 'sm:flex-row-reverse' : ''}`}
              >
                <div className={`flex h-20 w-20 shrink-0 items-center justify-center self-center rounded-2xl bg-gradient-to-br ${gradient} text-4xl shadow-lg transition group-hover:scale-110 sm:h-28 sm:w-28 sm:rounded-3xl sm:text-5xl`}>
                  {icon}
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white sm:text-xl">
                    {title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                    {desc}
                  </p>
                  <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
                    {tags.map(f => (
                      <span key={f} className="rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-slate-600 shadow-sm dark:bg-slate-800 dark:text-slate-300">
                        {f}
                      </span>
                    ))}
                  </div>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand transition group-hover:gap-2">
                    Перейти
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* CTA */}
        {!isLoggedIn && (
          <section className="px-4 pb-16">
            <div className="mx-auto max-w-4xl">
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 p-8 text-center sm:p-14">
                <div className="pointer-events-none absolute inset-0">
                  <div className="absolute -right-20 -top-20 h-60 w-60 rounded-full bg-white/10 blur-3xl" />
                </div>
                <div className="relative">
                  <h2 className="text-xl font-bold text-white sm:text-3xl">
                    Создай аккаунт — получай подборки по своему стеку
                  </h2>
                  <p className="mx-auto mt-3 max-w-lg text-sm text-indigo-100/80">
                    Персональные рекомендации, избранное, уведомления о новых позициях. Быстрая регистрация, без спама.
                  </p>
                  <Link
                    href="/auth"
                    className="mt-6 inline-flex rounded-xl bg-white px-8 py-3.5 text-sm font-bold text-indigo-700 shadow-lg transition hover:bg-indigo-50"
                  >
                    Зарегистрироваться бесплатно
                  </Link>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}
