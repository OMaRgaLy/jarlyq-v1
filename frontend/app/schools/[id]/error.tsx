'use client';
import Link from 'next/link';
export default function Error({ reset }: { reset: () => void }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="text-lg font-semibold text-slate-800 dark:text-white">Не удалось загрузить страницу школы</p>
      <p className="text-sm text-slate-500">Проверьте соединение и попробуйте снова</p>
      <div className="flex gap-3">
        <button onClick={reset} className="rounded-xl bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark">
          Попробовать снова
        </button>
        <Link href="/#schools" className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:border-brand hover:text-brand dark:border-slate-700 dark:text-slate-300">
          Все школы
        </Link>
      </div>
    </div>
  );
}
