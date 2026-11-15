'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Header } from '../../components/header';
import { Footer } from '../../components/footer';
import { api } from '../../lib/api';
import { getUser } from '../../lib/auth';

interface Me {
  email: string;
  is_premium: boolean;
  premium_until?: string;
}

const FREE = [
  'Все стажировки и вакансии — сразу после первых суток',
  'Трекер откликов со статусами и заметками',
  'Напоминания в Telegram за 7, 3 и 1 день до дедлайна',
  'Рынок стеков: что учить в Казахстане, СНГ и мире',
  'Каталог компаний, карьерные пути и ресурсы',
];

const PREMIUM = [
  { text: 'Новые стажировки и вакансии на день раньше всех', ready: true },
  { text: 'Telegram-уведомление в момент публикации', ready: true },
  { text: 'База тестовых заданий от компаний', ready: false },
  { text: 'Вопросы с собеседований и идеи пет-проектов', ready: false },
];

export default function PremiumPage() {
  const [me, setMe] = useState<Me | null>(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const telegram = process.env.NEXT_PUBLIC_CONTACT_TELEGRAM;
  const email = process.env.NEXT_PUBLIC_CONTACT_EMAIL;

  useEffect(() => {
    if (!getUser()) return;
    setLoggedIn(true);
    api.get<{ user: Me }>('/users/me').then((r) => setMe(r.data.user)).catch(() => {});
  }, []);

  const want = async () => {
    setBusy(true);
    setError('');
    try {
      await api.post('/users/me/premium-interest');
      setSent(true);
    } catch {
      setError('Не удалось отправить заявку. Попробуйте ещё раз.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-950">
      <Header />
      <section className="bg-gradient-to-br from-ink-deep via-ink to-brand">
        <div className="mx-auto max-w-4xl px-4 py-14 text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-amber-300">Jarlyq Premium</p>
          <h1 className="mt-2 text-4xl font-extrabold text-white sm:text-5xl">Узнавайте о стажировках первыми</h1>
          <p className="mx-auto mt-3 max-w-2xl text-lg text-white/80">
            Лучшие места разбирают быстро. Premium даёт фору в один день — и письмо в Telegram в ту же минуту, как появилась вакансия.
          </p>
        </div>
      </section>

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10">
        <div className="grid gap-5 md:grid-cols-2">
          <section className="rounded-3xl border border-slate-200/80 bg-white p-6 dark:border-slate-700/60 dark:bg-slate-900">
            <h2 className="text-xl font-bold text-ink dark:text-white">Бесплатно</h2>
            <ul className="mt-4 space-y-2.5 text-sm text-slate-600 dark:text-slate-300">
              {FREE.map((f) => <li key={f} className="flex gap-2"><span className="text-emerald-600">✓</span>{f}</li>)}
            </ul>
          </section>

          <section className="relative rounded-3xl border-2 border-brand bg-white p-6 shadow-lg dark:bg-slate-900">
            <span className="absolute -top-3 left-6 rounded-full bg-amber-400 px-3 py-0.5 text-xs font-bold text-amber-950">⭐ Premium</span>
            <h2 className="text-xl font-bold text-ink dark:text-white">Всё из бесплатного, и ещё</h2>
            <ul className="mt-4 space-y-2.5 text-sm text-slate-700 dark:text-slate-200">
              {PREMIUM.map((f) => (
                <li key={f.text} className="flex gap-2">
                  <span className={f.ready ? 'text-emerald-600' : 'text-slate-400'}>{f.ready ? '✓' : '◷'}</span>
                  <span>{f.text}{!f.ready && <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500 dark:bg-slate-800">скоро</span>}</span>
                </li>
              ))}
            </ul>

            <div className="mt-6">
              {me?.is_premium ? (
                <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900">
                  ✓ Premium активен{me.premium_until ? ` до ${new Date(me.premium_until).toLocaleDateString('ru')}` : ''}
                </p>
              ) : !loggedIn ? (
                <Link href="/auth?next=/premium" className="block rounded-xl bg-brand px-5 py-3 text-center text-sm font-semibold text-white hover:bg-brand-dark">Войти и оставить заявку</Link>
              ) : sent ? (
                <p role="status" className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                  Заявка принята ✓ Мы свяжемся с вами по почте{me?.email ? ` (${me.email})` : ''} и расскажем условия.
                </p>
              ) : (
                <button type="button" onClick={want} disabled={busy} className="w-full rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-50">
                  {busy ? 'Отправляем…' : 'Хочу Premium'}
                </button>
              )}
              {error && <p role="alert" className="mt-2 text-sm text-rose-600">{error}</p>}
              <p className="mt-3 text-xs text-slate-500">Онлайн-оплаты пока нет: оформляем вручную после заявки.</p>
              {(telegram || email) && (
                <p className="mt-2 flex flex-wrap gap-3 text-sm">
                  {telegram && <a className="font-semibold text-brand hover:underline" href={`https://t.me/${telegram.replace(/^@/, '')}`} target="_blank" rel="noopener noreferrer">Написать в Telegram</a>}
                  {email && <a className="font-semibold text-brand hover:underline" href={`mailto:${email}`}>Написать на почту</a>}
                </p>
              )}
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
