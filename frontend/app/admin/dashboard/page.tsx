'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminNav } from '../../../components/admin-nav';
import {
  getAdminToken,
  fetchAdminCompanies,
  fetchAdminSchools,
  fetchAdminStacks,
  fetchAdminHackathons,
  fetchAdminReviews,
  fetchAdminUsers,
} from '../../../lib/admin-api';
import Link from 'next/link';

export default function AdminDashboard() {
  const router = useRouter();
  const [counts, setCounts] = useState({ companies: 0, schools: 0, stacks: 0, hackathons: 0, reviewsPending: 0, users: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!getAdminToken()) {
      router.push('/admin');
      return;
    }
    Promise.all([
      fetchAdminCompanies(),
      fetchAdminSchools(),
      fetchAdminStacks(),
      fetchAdminHackathons(),
      fetchAdminReviews('pending'),
      fetchAdminUsers(),
    ])
      .then(([companies, schools, stacks, hackathons, reviews, users]) => {
        setCounts({
          companies: companies.length,
          schools: schools.length,
          stacks: stacks.length,
          hackathons: hackathons.length,
          reviewsPending: reviews.length,
          users: users.length,
        });
      })
      .catch(() => router.push('/admin'))
      .finally(() => setLoading(false));
  }, [router]);

  const stats = [
    { label: 'Компании', count: counts.companies, href: '/admin/companies', emoji: '🏢' },
    { label: 'Школы', count: counts.schools, href: '/admin/schools', emoji: '🎓' },
    { label: 'Хакатоны', count: counts.hackathons, href: '/admin/hackathons', emoji: '🏆' },
    { label: 'Стеки', count: counts.stacks, href: '/admin/stacks', emoji: '⚙️' },
    { label: 'Отзывов (ожидает)', count: counts.reviewsPending, href: '/admin/reviews', emoji: '⭐' },
    { label: 'Пользователей', count: counts.users, href: '/admin/users', emoji: '👤' },
  ];

  return (
    <div className="flex min-h-screen">
      <AdminNav />
      <main className="flex-1 p-8">
        <h1 className="mb-6 text-2xl font-bold text-slate-900 dark:text-white">
          Обзор
        </h1>
        {loading ? (
          <p className="text-slate-500">Загружаем...</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-3">
            {stats.map((s) => (
              <Link
                key={s.href}
                href={s.href}
                className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm transition hover:shadow-md dark:border-slate-700/60 dark:bg-slate-900"
              >
                <div className="text-3xl">{s.emoji}</div>
                <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
                  {s.count}
                </p>
                <p className="text-sm text-slate-500">{s.label}</p>
              </Link>
            ))}
          </div>
        )}

        <div className="mt-8 rounded-2xl border border-brand/20 bg-brand/5 p-6">
          <h2 className="mb-3 font-semibold text-slate-900 dark:text-white">Быстрые действия</h2>
          <div className="flex flex-wrap gap-3">
            <Link href="/admin/companies" className="rounded-xl bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark">
              + Компанию
            </Link>
            <Link href="/admin/schools" className="rounded-xl bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark">
              + Школу
            </Link>
            <Link href="/admin/hackathons" className="rounded-xl bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark">
              + Хакатон
            </Link>
            <Link href="/admin/reviews" className="rounded-xl border border-brand/40 bg-brand/5 px-4 py-2 text-sm font-medium text-brand hover:bg-brand/10">
              Модерация отзывов
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
