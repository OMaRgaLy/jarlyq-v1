'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080';

function VerifyEmailContent() {
  const params = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = params.get('token');
    if (!token) {
      setStatus('error');
      setMessage('Токен не найден в ссылке.');
      return;
    }
    fetch(`${API_BASE}/api/v1/auth/verify-email?token=${encodeURIComponent(token)}`)
      .then(async (r) => {
        const data = await r.json().catch(() => ({}));
        if (r.ok) {
          setStatus('ok');
        } else {
          setStatus('error');
          setMessage(data.error ?? 'Произошла ошибка.');
        }
      })
      .catch(() => {
        setStatus('error');
        setMessage('Не удалось подключиться к серверу.');
      });
  }, [params]);

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="card max-w-sm w-full p-8 text-center">
        {status === 'loading' && (
          <p className="text-slate-500">Проверяем ссылку...</p>
        )}
        {status === 'ok' && (
          <>
            <div className="text-4xl mb-4">✓</div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-50 mb-2">Email подтверждён</h1>
            <p className="text-sm text-slate-500 mb-6">Теперь можно войти в аккаунт.</p>
            <Link href="/auth" className="btn-primary w-full block text-center">
              Войти
            </Link>
          </>
        )}
        {status === 'error' && (
          <>
            <div className="text-4xl mb-4">✗</div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-50 mb-2">Ссылка недействительна</h1>
            <p className="text-sm text-slate-500 mb-6">{message || 'Ссылка устарела или уже была использована.'}</p>
            <Link href="/auth" className="btn-primary w-full block text-center">
              На страницу входа
            </Link>
          </>
        )}
      </div>
    </main>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailContent />
    </Suspense>
  );
}
