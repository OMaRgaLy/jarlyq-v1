'use client';

import { useState } from 'react';
import { api, CertificateResponse } from '../lib/api';

export function CertificateChecker() {
  const [code, setCode] = useState('');
  const [result, setResult] = useState<CertificateResponse['certificate'] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const { data } = await api.get<CertificateResponse>('/certificates/verify', { params: { code } });
      setResult(data.certificate);
    } catch (err) {
      setError('Сертификат не найден. Проверьте код и попробуйте снова.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="certificates" className="card space-y-4 p-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50">Проверка сертификата</h2>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Введите код сертификата, чтобы убедиться в его подлинности. Поддерживаются сертификаты школ, компаний и независимые.
        </p>
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 md:flex-row">
        <input
          value={code}
          onChange={(event) => setCode(event.target.value)}
          placeholder="Например: JRQ-2024-001"
          className="flex-1 rounded-xl border border-slate-200/70 bg-white px-4 py-2 text-sm shadow-sm focus:border-brand focus:outline-none dark:border-slate-700/60 dark:bg-slate-900/70"
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-brand px-5 py-2 text-sm font-semibold text-white shadow hover:bg-brand-dark disabled:opacity-60"
        >
          Проверить
        </button>
      </form>
      {error && <p className="text-sm text-red-500">{error}</p>}
      {result && (
        <div className="rounded-xl border border-emerald-300/70 bg-emerald-50 p-4 text-sm text-emerald-900 dark:border-emerald-700/60 dark:bg-emerald-900/40 dark:text-emerald-100">
          <p className="font-semibold">Код: {result.code}</p>
          <p>Тип: {result.type}</p>
          <p>Выдан: {result.issuerName}</p>
          <p>Владелец: {result.recipient}</p>
          <p>Дата выдачи: {new Date(result.issuedDate).toLocaleDateString('ru-RU')}</p>
          {result.expiryDate && <p>Действителен до: {new Date(result.expiryDate).toLocaleDateString('ru-RU')}</p>}
          {result.metadata && <p className="mt-2 text-xs text-slate-600 dark:text-slate-300">{result.metadata}</p>}
        </div>
      )}
    </section>
  );
}
