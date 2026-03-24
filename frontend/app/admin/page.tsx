'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { adminLogin, saveAdminToken, fetchAdminCompanies } from '../../lib/admin-api';
import { api } from '../../lib/api';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await adminLogin(email, password);
      // Temporarily set the token so the adminApi interceptor picks it up
      localStorage.setItem('jarlyq_admin_token', data.access_token);
      try {
        await fetchAdminCompanies();
      } catch {
        localStorage.removeItem('jarlyq_admin_token');
        setError('Нет прав администратора');
        return;
      }
      saveAdminToken(data.access_token);
      router.push('/admin/dashboard');
    } catch {
      setError('Неверный email или пароль, либо нет прав администратора');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    if (!credentialResponse.credential) return;
    try {
      const { data } = await api.post('/auth/google', { token: credentialResponse.credential });
      // Temporarily set the token so the adminApi interceptor picks it up
      localStorage.setItem('jarlyq_admin_token', data.access_token);
      try {
        await fetchAdminCompanies();
      } catch {
        localStorage.removeItem('jarlyq_admin_token');
        setError('Нет прав администратора. Убедись что ADMIN_EMAIL совпадает с твоим Google аккаунтом.');
        return;
      }
      saveAdminToken(data.access_token);
      router.push('/admin/dashboard');
    } catch {
      setError('Google авторизация не прошла. Убедись что ADMIN_EMAIL совпадает с твоим Google аккаунтом.');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200/70 bg-white p-8 shadow-sm dark:border-slate-700/60 dark:bg-slate-900">
        <h1 className="mb-1 text-2xl font-bold text-slate-900 dark:text-white">Admin Panel</h1>
        <p className="mb-6 text-sm text-slate-500">Jarlyq — управление контентом</p>

        {/* Google login */}
        <div className="flex justify-center">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => setError('Ошибка Google авторизации')}
            text="signin_with"
            shape="rectangular"
            theme="outline"
            size="large"
          />
        </div>

        <div className="my-4 flex items-center gap-3">
          <div className="flex-1 border-t border-slate-200 dark:border-slate-700" />
          <span className="text-xs text-slate-400">или</span>
          <div className="flex-1 border-t border-slate-200 dark:border-slate-700" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-brand focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              placeholder="admin@gmail.com"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Пароль</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-brand focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600 dark:bg-red-900/20 dark:text-red-400">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-brand py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60"
          >
            {loading ? 'Входим...' : 'Войти'}
          </button>
        </form>
      </div>
    </div>
  );
}
