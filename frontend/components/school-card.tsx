import Link from 'next/link';
import { School } from '../lib/api';
import { useLang } from '../lib/lang-context';

export function SchoolCard({ school }: { school: School }) {
  const { t } = useLang();
  const courses = school.courses ?? [];

  // Price range across all courses
  const prices = courses.map((c) => c.price).filter((p): p is number => !!p && p > 0);
  const minPrice = prices.length > 0 ? Math.min(...prices) : undefined;
  const currency = courses.find((c) => c.priceCurrency)?.priceCurrency || '₸';

  // Formats present
  const formats = [...new Set(courses.map((c) => c.format).filter(Boolean))];

  // Employment offered
  const hasEmployment = courses.some((c) => c.hasEmployment);

  // Min duration
  const durations = courses.map((c) => c.durationWeeks).filter((d): d is number => !!d && d > 0);
  const minDuration = durations.length > 0 ? Math.min(...durations) : undefined;

  const formatLabel: Record<string, string> = {
    online: t.school.online,
    offline: t.school.offline,
    hybrid: t.school.hybrid,
  };

  return (
    <article className="card flex flex-col gap-3 p-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-lg font-semibold text-slate-900 dark:text-slate-50">{school.name}</h3>
          {school.description && (
            <p className="mt-1 line-clamp-2 text-sm text-slate-500 dark:text-slate-400">{school.description}</p>
          )}
        </div>
        <Link
          href={`/schools/${school.id}`}
          className="shrink-0 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:border-brand hover:text-brand dark:border-slate-700 dark:text-slate-300"
        >
          {t.school.details}
        </Link>
      </div>

      {/* Meta pills */}
      {(formats.length > 0 || minDuration || hasEmployment) && (
        <div className="flex flex-wrap gap-1.5">
          {formats.map((f) => (
            <span key={f} className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              {formatLabel[f!] ?? f}
            </span>
          ))}
          {minDuration && (
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-500 dark:bg-slate-800 dark:text-slate-400">
              от {minDuration} {t.school.weeks}
            </span>
          )}
          {hasEmployment && (
            <span className="rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
              ✓ {t.school.hasEmployment}
            </span>
          )}
        </div>
      )}

      {/* Footer: course count + price */}
      <div className="mt-auto border-t border-slate-100 pt-3 dark:border-slate-800">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {courses.length} {t.school.courses.toLowerCase()}
          </span>
          {minPrice !== undefined ? (
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
              {t.school.priceFrom} {minPrice.toLocaleString()} {currency}
            </span>
          ) : courses.length > 0 ? (
            <span className="text-xs font-medium text-green-600 dark:text-green-400">{t.school.free}</span>
          ) : null}
        </div>
      </div>
    </article>
  );
}
