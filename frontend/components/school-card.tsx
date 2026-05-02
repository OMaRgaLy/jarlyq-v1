import Link from 'next/link';
import { School } from '../lib/api';
import { useLang } from '../lib/lang-context';
import { useTheme } from 'next-themes';
import { FavoriteButton } from './favorite-button';

const TYPE_LABELS: Record<string, string> = {
  bootcamp: 'Буткемп',
  university: 'Университет',
  state_program: 'Гос. программа',
  university_abroad: 'Зарубежный вуз',
  center: 'Центр',
  peer_learning: 'Peer-to-peer',
};

export function SchoolCard({ school }: { school: School }) {
  const { t } = useLang();
  const { resolvedTheme } = useTheme();
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

  const typeLabel = TYPE_LABELS[school.type] ?? school.type;
  const badges = school.badges ?? [];

  return (
    <article className="card flex flex-col gap-3 p-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          {/* Logo */}
          {school.logoURL?.startsWith('http') && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={school.logoURL} alt={school.name}
              className="h-10 w-10 shrink-0 rounded-xl object-contain border border-slate-100 dark:border-slate-800 bg-white p-0.5 shadow-sm" />
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="truncate text-[15px] font-semibold text-slate-900 dark:text-slate-50">{school.name}</h3>
              {school.isVerified && (
                <span className="text-brand shrink-0" title="Верифицировано">
                  <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                  </svg>
                </span>
              )}
            </div>
            <div className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-400">
              <span className="rounded border border-slate-200 dark:border-slate-700 px-1.5 py-0.5">{typeLabel}</span>
              {school.country && <span>{school.city ? `${school.city}, ${school.country}` : school.country}</span>}
              {school.ageRange && <span>· {school.ageRange}</span>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <FavoriteButton entityType="school" entityId={school.id} />
          <Link href={`/schools/${school.id}`}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:border-brand hover:text-brand dark:border-slate-700 dark:text-slate-300">
            {t.school.details}
          </Link>
        </div>
      </div>

      {school.description && (
        <p className="line-clamp-2 text-sm text-slate-500 dark:text-slate-400">{school.description}</p>
      )}

      {/* CMS Badges */}
      {badges.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {badges.map(badge => {
            const color = resolvedTheme === 'dark' ? badge.colorDark : badge.colorLight;
            return (
              <span key={badge.id}
                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold"
                style={{ color, backgroundColor: color + '18', border: `1px solid ${color}35` }}>
                <span>{badge.icon === 'verified' ? '✓' : badge.icon}</span>
                {badge.label}
              </span>
            );
          })}
        </div>
      )}

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
              {t.school.priceFrom} {minDuration} {t.school.weeks}
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
