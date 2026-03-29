'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Header } from '../../components/header';
import { Footer } from '../../components/footer';
import { emailLogin, emailRegister, getToken } from '../../lib/auth';
import { useEffect } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { googleLogin } from '../../lib/auth';
import { useLang } from '../../lib/lang-context';

export default function AuthPage() {
  const router = useRouter();
  const params = useSearchParams();
  const { t } = useLang();
  const returnTo = params.get('next') || '/profile';

  const [mode, setMode] = useState<'login' | 'register'>('register');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (getToken()) router.push(returnTo);
  }, [router, returnTo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'register') {
        if (!termsAccepted) { setError('Примите пользовательское соглашение'); setLoading(false); return; }
        await emailRegister(email, password, firstName, lastName, termsAccepted);
      } else {
        await emailLogin(email, password);
      }
      router.push(returnTo);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Произошла ошибка');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async (token: string) => {
    try {
      await googleLogin(token);
      router.push(returnTo);
    } catch {
      setError('Ошибка входа через Google');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
      <Header />
      <main className="flex flex-1 items-center justify-center px-4 py-16">
        <div className="w-full max-w-md">
          <div className="rounded-3xl border border-slate-200/70 bg-white p-8 shadow-xl dark:border-slate-700/60 dark:bg-slate-900">
            <div className="mb-6 text-center">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                {mode === 'register' ? 'Создай аккаунт' : 'Войди в аккаунт'}
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                {mode === 'register'
                  ? 'Персональные подборки, избранное и уведомления — всё это после регистрации'
                  : 'Рады видеть тебя снова'}
              </p>
            </div>

            {/* Google */}
            <div className="mb-5 flex justify-center">
              <GoogleLogin
                onSuccess={(r) => r.credential && handleGoogle(r.credential)}
                onError={() => setError('Google login failed')}
                text={mode === 'register' ? 'signup_with' : 'signin_with'}
                shape="pill"
                width="350"
              />
            </div>

            <div className="mb-5 flex items-center gap-3">
              <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
              <span className="text-xs text-slate-400">или по email</span>
              <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'register' && (
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text" required placeholder="Имя" value={firstName}
                    onChange={e => setFirstName(e.target.value)}
                    className="rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-brand focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                  <input
                    type="text" required placeholder="Фамилия" value={lastName}
                    onChange={e => setLastName(e.target.value)}
                    className="rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-brand focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              )}
              <input
                type="email" required placeholder="Email" value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-brand focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
              <input
                type="password" required placeholder="Пароль" value={password}
                onChange={e => setPassword(e.target.value)} minLength={6}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-brand focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
              {mode === 'register' && (
                <label className="flex items-start gap-2 text-xs text-slate-500">
                  <input type="checkbox" checked={termsAccepted} onChange={e => setTermsAccepted(e.target.checked)} className="mt-0.5 rounded" />
                  <span>Принимаю <Link href="/legal" className="text-brand hover:underline">пользовательское соглашение</Link></span>
                </label>
              )}
              {error && <p className="text-sm text-red-500">{error}</p>}
              <button
                type="submit" disabled={loading}
                className="w-full rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
              >
                {loading ? '...' : mode === 'register' ? 'Создать аккаунт' : 'Войти'}
              </button>
            </form>

            <p className="mt-5 text-center text-sm text-slate-500">
              {mode === 'register' ? (
                <>Уже есть аккаунт? <button onClick={() => setMode('login')} className="font-medium text-brand hover:underline">Войти</button></>
              ) : (
                <>Нет аккаунта? <button onClick={() => setMode('register')} className="font-medium text-brand hover:underline">Создать</button></>
              )}
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
