'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { clearAdminToken } from '../lib/admin-api';

const links = [
  { href: '/admin/dashboard', label: '🏠 Главная' },
  { href: '/admin/reviews', label: '⭐ Отзывы' },
  { href: '/admin/suggestions', label: '📬 Предложения' },
  { href: '/admin/companies', label: '🏢 Компании' },
  { href: '/admin/schools', label: '🎓 Школы' },
  { href: '/admin/hackathons', label: '🏆 Хакатоны' },
  { href: '/admin/stacks', label: '⚙️ Стеки' },
  { href: '/admin/users', label: '👤 Пользователи' },
];

export function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    clearAdminToken();
    router.push('/admin');
  };

  return (
    <aside className="flex w-56 flex-shrink-0 flex-col border-r border-slate-200/70 bg-white dark:border-slate-700/60 dark:bg-slate-900">
      <div className="border-b border-slate-200/70 px-4 py-4 dark:border-slate-700/60">
        <Link href="/" className="text-lg font-bold text-brand">
          Jarlyq
        </Link>
        <p className="text-xs text-slate-500">Admin Panel</p>
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-3">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
              pathname === link.href
                ? 'bg-brand/10 text-brand'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
            }`}
          >
            {link.label}
          </Link>
        ))}
      </nav>
      <div className="border-t border-slate-200/70 p-3 dark:border-slate-700/60">
        <button
          onClick={handleLogout}
          className="w-full rounded-lg px-3 py-2 text-left text-sm text-slate-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
        >
          Выйти
        </button>
      </div>
    </aside>
  );
}
