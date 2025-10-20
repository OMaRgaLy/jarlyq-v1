import Image from 'next/image';

export function Hero() {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-slate-200/60 bg-gradient-to-br from-sky-50 via-white to-emerald-50 p-8 dark:border-slate-800/60 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900">
      <div className="relative z-10 grid gap-6 md:grid-cols-2 md:items-center">
        <div className="space-y-4">
          <span className="inline-flex items-center rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wider text-brand shadow-sm dark:bg-slate-900">
            Центральная Азия • Tech
          </span>
          <h1 className="text-3xl font-bold leading-tight text-slate-900 dark:text-slate-50 md:text-4xl">
            Быстрый старт карьеры в IT для Казахстана, Кыргызстана и Узбекистана
          </h1>
          <p className="text-base text-slate-700 dark:text-slate-300">
            Собрали курсы, стажировки, вакансии и компании по нужным стекам. Фильтруйте возможности по региону, проверяйте
            сертификаты и управляйте своими профилями без кода.
          </p>
          <div className="flex flex-wrap gap-3 text-sm text-slate-600 dark:text-slate-300">
            <span className="rounded-full bg-white px-3 py-1 shadow dark:bg-slate-900">SSR + SPA</span>
            <span className="rounded-full bg-white px-3 py-1 shadow dark:bg-slate-900">Мобильная оптимизация</span>
            <span className="rounded-full bg-white px-3 py-1 shadow dark:bg-slate-900">Проверка сертификатов</span>
          </div>
        </div>
        <div className="relative hidden h-72 md:block">
          <Image
            src="https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=900&q=80"
            alt="Команда разработчиков"
            fill
            className="rounded-2xl object-cover shadow-lg"
            priority
          />
        </div>
      </div>
      <div className="absolute inset-0 -z-0 bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.15),_transparent_50%)]" />
    </section>
  );
}
