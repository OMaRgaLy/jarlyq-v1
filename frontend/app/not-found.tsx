import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-100/60 px-4 dark:bg-slate-950">
      <p className="text-6xl font-extrabold text-brand">404</p>
      <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
        Страница не найдена
      </p>
      <Link
        href="/"
        className="mt-6 rounded-xl bg-brand px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark"
      >
        На главную
      </Link>
    </div>
  );
}
