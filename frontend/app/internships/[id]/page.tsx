'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Header } from '../../../components/header';
import { Footer } from '../../../components/footer';
import { FavoriteButton } from '../../../components/favorite-button';
import { JsonLd, jobPostingJsonLd } from '../../../components/json-ld';
import { useInternship } from '../../../lib/hooks';
import { useLang } from '../../../lib/lang-context';

const SOURCE_LABELS: Record<string, string> = {
  hh: 'hh.kz',
  'hh.ru': 'hh.ru',
  tg: 'Telegram',
  telegram: 'Telegram',
  admin: 'Jarlyq',
};

function sourceBadge(source?: string, sourceURL?: string) {
  if (!source || source === 'admin') return null;
  const label = SOURCE_LABELS[source] ?? source;
  const inner = (
    <span className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-500 dark:border-slate-700 dark:text-slate-400">
      via {label}
    </span>
  );
  if (sourceURL) {
    return (
      <a href={sourceURL} target="_blank" rel="noreferrer noopener">
        {inner}
      </a>
    );
  }
  return inner;
}

const COUNTRY_FLAGS: Record<string, string> = {
  KZ: '🇰🇿',
  KG: '🇰🇬',
  UZ: '🇺🇿',
  RU: '🇷🇺',
  TR: '🇹🇷',
  REMOTE: '🌐',
};

export default function InternshipDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const { data: item, isLoading } = useInternship(Number(id));
  const { t } = useLang();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-100/60 dark:bg-slate-950">
        <Header />
        <main className="mx-auto max-w-3xl px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-6 w-48 rounded-lg bg-slate-200 dark:bg-slate-800" />
            <div className="h-64 rounded-2xl bg-slate-200 dark:bg-slate-800" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-slate-100/60 dark:bg-slate-950">
        <Header />
        <main className="mx-auto max-w-3xl px-4 py-8">
          <p className="text-slate-500">{t.common.notFound}</p>
          <Link href="/internships" className="mt-4 inline-block text-sm text-brand hover:underline">
            &larr; {t.internships.title}
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const salary =
    item.salaryMin || item.salaryMax
      ? `${item.salaryMin?.toLocaleString() ?? '?'} – ${item.salaryMax?.toLocaleString() ?? '?'} ${item.salaryCurrency ?? 'KZT'}`
      : null;

  const countryCode = item.country?.toUpperCase();
  const countryFlag = countryCode ? COUNTRY_FLAGS[countryCode] : null;

  return (
    <div className="min-h-screen bg-slate-100/60 dark:bg-slate-950">
      <Header />
      <JsonLd data={jobPostingJsonLd(item, item.companyName)} />
      <main className="mx-auto max-w-3xl px-4 py-8 space-y-6">
        <Link href="/internships" className="inline-flex text-sm text-brand hover:underline">
          &larr; {t.internships.title}
        </Link>

        <div className="card p-6 space-y-5">
          {/* Company */}
          <div className="flex items-center gap-3">
            {item.companyLogoURL ? (
              <Image
                src={item.companyLogoURL}
                alt={item.companyName}
                width={48}
                height={48}
                className="h-12 w-12 rounded-lg object-cover"
                unoptimized
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-brand/10 text-brand font-bold text-lg">
                {item.companyName?.[0]}
              </div>
            )}
            <div>
              <Link href={`/companies/${item.companyId}`} className="text-sm font-medium text-brand hover:underline">
                {item.companyName}
              </Link>
              {countryFlag && (
                <p className="text-xs text-slate-400 mt-0.5">
                  {countryFlag} {countryCode}
                </p>
              )}
            </div>
          </div>

          {/* Title + favorite */}
          <div className="flex items-start gap-3">
            <h1 className="flex-1 text-2xl font-bold text-slate-900 dark:text-white">{item.title}</h1>
            <FavoriteButton entityType="opportunity" entityId={item.id} />
          </div>

          {/* Badges */}
          <div className="flex flex-wrap gap-2">
            {item.level && (
              <span className="rounded-full bg-brand/10 px-3 py-1 text-xs font-medium text-brand">{item.level}</span>
            )}
            {item.workFormat && (
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                {item.workFormat}
              </span>
            )}
            {item.city && (
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                {item.city}
              </span>
            )}
            {item.isYearRound && (
              <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                {t.internships.yearRound}
              </span>
            )}
            {sourceBadge(item.source, item.sourceURL)}
          </div>

          {/* Stack tags */}
          {item.stack && item.stack.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">Стек</p>
              <div className="flex flex-wrap gap-2">
                {item.stack.map((s) => (
                  <span
                    key={s.id}
                    className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                  >
                    {s.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Salary & Deadline */}
          <div className="flex flex-wrap gap-6 text-sm">
            {salary && (
              <div>
                <span className="text-slate-400">{t.reviews.salaryRating}: </span>
                <span className="font-semibold text-slate-900 dark:text-white">{salary}</span>
              </div>
            )}
            {item.deadline && (
              <div>
                <span className="text-slate-400">{t.internships.deadline}: </span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {new Date(item.deadline).toLocaleDateString('ru')}
                </span>
              </div>
            )}
          </div>

          {/* Description */}
          {item.description && (
            <div className="prose prose-sm max-w-none text-slate-600 dark:text-slate-300 dark:prose-invert">
              <p className="whitespace-pre-line">{item.description}</p>
            </div>
          )}

          {/* Apply button */}
          {item.applyURL && (
            <a
              href={item.applyURL}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex rounded-xl bg-brand px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark"
            >
              {t.internships.apply} &rarr;
            </a>
          )}
        </div>

        {/* Back to company */}
        <div className="text-center text-sm text-slate-500">
          <Link href={`/companies/${item.companyId}`} className="text-brand hover:underline">
            Все возможности от {item.companyName} &rarr;
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
