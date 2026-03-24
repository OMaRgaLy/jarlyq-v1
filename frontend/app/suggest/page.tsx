'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Header } from '../../components/header';
import { api } from '../../lib/api';
import { useLang } from '../../lib/lang-context';

type SuggestType = 'company' | 'school';

const labels = {
  ru: {
    title: 'Предложить компанию или школу',
    subtitle: 'Знаешь IT-компанию или школу которой нет на Jarlyq? Расскажи нам — мы добавим после проверки.',
    typeLabel: 'Тип',
    typeCompany: 'Компания',
    typeSchool: 'Школа / Курсы',
    name: 'Название *',
    description: 'Описание',
    website: 'Сайт',
    telegram: 'Telegram',
    email: 'Email компании/школы',
    contactName: 'Ваше имя *',
    contactEmail: 'Ваш email *',
    submit: 'Отправить заявку',
    sending: 'Отправляем...',
    successTitle: 'Заявка отправлена!',
    successText: 'Мы рассмотрим и добавим в течение 1-3 дней. Спасибо!',
    backHome: '← На главную',
    another: 'Предложить ещё',
  },
  en: {
    title: 'Suggest a Company or School',
    subtitle: 'Know an IT company or school that\'s not on Jarlyq? Tell us — we\'ll add it after review.',
    typeLabel: 'Type',
    typeCompany: 'Company',
    typeSchool: 'School / Courses',
    name: 'Name *',
    description: 'Description',
    website: 'Website',
    telegram: 'Telegram',
    email: 'Company/school email',
    contactName: 'Your name *',
    contactEmail: 'Your email *',
    submit: 'Submit',
    sending: 'Sending...',
    successTitle: 'Request sent!',
    successText: 'We\'ll review and add it within 1-3 days. Thank you!',
    backHome: '← Back to home',
    another: 'Suggest another',
  },
  kk: {
    title: 'Компания немесе мектеп ұсыну',
    subtitle: 'Jarlyq-та жоқ IT-компания немесе мектепті білесің бе? Бізге айт — тексергеннен кейін қосамыз.',
    typeLabel: 'Түрі',
    typeCompany: 'Компания',
    typeSchool: 'Мектеп / Курстар',
    name: 'Атауы *',
    description: 'Сипаттама',
    website: 'Сайт',
    telegram: 'Telegram',
    email: 'Компания/мектеп email',
    contactName: 'Сіздің атыңыз *',
    contactEmail: 'Сіздің email *',
    submit: 'Өтінім жіберу',
    sending: 'Жіберілуде...',
    successTitle: 'Өтінім жіберілді!',
    successText: '1-3 күн ішінде қарастырып қосамыз. Рахмет!',
    backHome: '← Басты бетке',
    another: 'Тағы ұсыну',
  },
};

export default function SuggestPage() {
  const { locale } = useLang();
  const l = labels[locale];

  const [type, setType] = useState<SuggestType>('company');
  const [form, setForm] = useState({
    name: '', description: '', website: '', telegram: '',
    email: '', contactName: '', contactEmail: '',
  });
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setError('');
    try {
      await api.post('/suggestions', { ...form, type });
      setDone(true);
    } catch {
      setError(locale === 'ru' ? 'Ошибка отправки. Попробуй ещё раз.' : locale === 'en' ? 'Error sending. Please try again.' : 'Қате. Қайталап көр.');
    } finally {
      setSending(false);
    }
  };

  const field = (key: keyof typeof form, label: string, type = 'text') => (
    <div>
      <label className="mb-1 block text-xs font-medium text-slate-500">{label}</label>
      <input
        type={type}
        value={form[key]}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-brand focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
      />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-100/60 dark:bg-slate-950">
      <Header />
      <main className="mx-auto max-w-xl px-4 py-10">
        {done ? (
          <div className="card p-8 text-center space-y-4">
            <div className="text-5xl">🎉</div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{l.successTitle}</h1>
            <p className="text-slate-600 dark:text-slate-300">{l.successText}</p>
            <div className="flex justify-center gap-3 pt-2">
              <Link href="/" className="rounded-xl border border-slate-200 px-4 py-2 text-sm dark:border-slate-700">
                {l.backHome}
              </Link>
              <button
                onClick={() => { setDone(false); setForm({ name: '', description: '', website: '', telegram: '', email: '', contactName: '', contactEmail: '' }); }}
                className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
              >
                {l.another}
              </button>
            </div>
          </div>
        ) : (
          <div className="card p-6 space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{l.title}</h1>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{l.subtitle}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Type toggle */}
              <div>
                <p className="mb-2 text-xs font-medium text-slate-500">{l.typeLabel}</p>
                <div className="flex gap-2">
                  {(['company', 'school'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setType(t)}
                      className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                        type === t
                          ? 'bg-brand text-white'
                          : 'border border-slate-200 text-slate-600 hover:border-brand dark:border-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {t === 'company' ? l.typeCompany : l.typeSchool}
                    </button>
                  ))}
                </div>
              </div>

              {field('name', l.name)}
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">{l.description}</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-brand focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
              {field('website', l.website)}
              {field('telegram', l.telegram)}
              {field('email', l.email, 'email')}

              <hr className="border-slate-200 dark:border-slate-700" />
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                {locale === 'ru' ? 'Ваши контакты' : locale === 'en' ? 'Your contacts' : 'Сіздің байланысыңыз'}
              </p>
              {field('contactName', l.contactName)}
              {field('contactEmail', l.contactEmail, 'email')}

              {error && <p className="text-sm text-red-500">{error}</p>}

              <button
                type="submit"
                disabled={sending || !form.name || !form.contactEmail}
                className="w-full rounded-xl bg-brand py-2.5 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
              >
                {sending ? l.sending : l.submit}
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
