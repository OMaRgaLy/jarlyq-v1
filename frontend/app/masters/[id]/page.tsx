'use client';

import Link from 'next/link';
import { Header } from '../../../components/header';
import { FavoriteButton } from '../../../components/favorite-button';
import { useMasterProgram } from '../../../lib/hooks';
import { useLang } from '../../../lib/lang-context';

const FLAGS: Record<string, string> = {
  KZ: '\u{1F1F0}\u{1F1FF}', US: '\u{1F1FA}\u{1F1F8}', UK: '\u{1F1EC}\u{1F1E7}', DE: '\u{1F1E9}\u{1F1EA}',
  CH: '\u{1F1E8}\u{1F1ED}', FR: '\u{1F1EB}\u{1F1F7}', IT: '\u{1F1EE}\u{1F1F9}', NO: '\u{1F1F3}\u{1F1F4}',
  SE: '\u{1F1F8}\u{1F1EA}', ES: '\u{1F1EA}\u{1F1F8}', PL: '\u{1F1F5}\u{1F1F1}', CZ: '\u{1F1E8}\u{1F1FF}',
  CA: '\u{1F1E8}\u{1F1E6}', CN: '\u{1F1E8}\u{1F1F3}', KR: '\u{1F1F0}\u{1F1F7}', JP: '\u{1F1EF}\u{1F1F5}',
};

export default function MasterDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const { data: prog, isLoading } = useMasterProgram(Number(id));
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
      </div>
    );
  }

  if (!prog) {
    return (
      <div className="min-h-screen bg-slate-100/60 dark:bg-slate-950">
        <Header />
        <main className="mx-auto max-w-3xl px-4 py-8">
          <p className="text-slate-500">{t.common.notFound}</p>
          <Link href="/masters" className="mt-4 inline-block text-sm text-brand hover:underline">
            &larr; {t.nav.masters ?? 'Masters'}
          </Link>
        </main>
      </div>
    );
  }

  const flag = FLAGS[prog.schoolCountry ?? ''] ?? '';
  const price = prog.price
    ? `${prog.price.toLocaleString()} ${prog.priceCurrency ?? 'EUR'}`
    : null;
  const duration = prog.durationWeeks
    ? prog.durationWeeks >= 52
      ? `${Math.round(prog.durationWeeks / 52)} year(s)`
      : `${prog.durationWeeks} weeks`
    : null;

  return (
    <div className="min-h-screen bg-slate-100/60 dark:bg-slate-950">
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-8 space-y-6">
        <Link href="/masters" className="inline-flex text-sm text-brand hover:underline">
          &larr; {t.nav.masters ?? 'Masters'}
        </Link>

        <div className="card p-6 space-y-4">
          {/* School info */}
          <div className="flex items-center gap-3">
            {prog.schoolLogoURL ? (
              <img src={prog.schoolLogoURL} alt={prog.schoolName} className="h-12 w-12 rounded-lg object-cover" />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-brand/10 text-xl">
                {flag || prog.schoolName?.[0]}
              </div>
            )}
            <div>
              <Link href={`/schools/${prog.schoolId}`} className="text-sm text-brand hover:underline">
                {flag} {prog.schoolName}
              </Link>
              {prog.schoolCountry && (
                <p className="text-xs text-slate-400">{prog.schoolCountry}</p>
              )}
            </div>
          </div>

          {/* Title */}
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{prog.courseTitle}</h1>
            <FavoriteButton entityType="course" entityId={prog.courseId} />
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            {prog.language && (
              <span className="rounded-full bg-brand/10 px-3 py-1 text-xs font-medium text-brand">{prog.language.toUpperCase()}</span>
            )}
            {prog.format && (
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">{prog.format}</span>
            )}
            {prog.scholarshipAvailable && (
              <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">Scholarship</span>
            )}
          </div>

          {/* Details */}
          <div className="flex flex-wrap gap-6 text-sm">
            {price && (
              <div>
                <span className="text-slate-400">Стоимость: </span>
                <span className="font-semibold text-slate-900 dark:text-white">{price}</span>
              </div>
            )}
            {duration && (
              <div>
                <span className="text-slate-400">Длительность: </span>
                <span className="font-semibold text-slate-900 dark:text-white">{duration}</span>
              </div>
            )}
            {prog.applicationDeadline && (
              <div>
                <span className="text-slate-400">{t.internships.deadline}: </span>
                <span className="font-semibold text-slate-900 dark:text-white">{prog.applicationDeadline}</span>
              </div>
            )}
          </div>

          {/* Description */}
          {prog.description && (
            <div className="prose prose-sm max-w-none text-slate-600 dark:text-slate-300 dark:prose-invert">
              <p className="whitespace-pre-line">{prog.description}</p>
            </div>
          )}

          {/* Apply */}
          {prog.externalURL && (
            <a
              href={prog.externalURL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex rounded-xl bg-brand px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark"
            >
              {t.school.goToSite ?? 'Visit site'} &rarr;
            </a>
          )}
        </div>
      </main>
    </div>
  );
}
