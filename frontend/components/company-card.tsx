import Link from 'next/link';
import { Company } from '../lib/api';
import { useLang } from '../lib/lang-context';
import { useTheme } from 'next-themes';
import { FavoriteButton } from './favorite-button';

interface Props {
  company: Company;
}

function formatSalary(min?: number, max?: number, currency?: string, salaryFrom?: string): string | null {
  const curr = currency || '₸';
  if (!min && !max) return null;
  if (min && max) return `${min.toLocaleString()} – ${max.toLocaleString()} ${curr}`;
  if (min) return `${salaryFrom} ${min.toLocaleString()} ${curr}`;
  if (max) return `до ${max.toLocaleString()} ${curr}`;
  return null;
}

export function CompanyCard({ company }: Props) {
  const { t } = useLang();
  const { resolvedTheme } = useTheme();

  const internships = (company.opportunities ?? []).filter((o) => o.type === 'internship');
  const vacancies = (company.opportunities ?? []).filter((o) => o.type === 'vacancy');
  const hasOpenings = internships.length > 0 || vacancies.length > 0;

  const allOpps = [...internships, ...vacancies];
  const salaryMin = allOpps.reduce<number | undefined>((acc, o) =>
    o.salaryMin ? (acc === undefined ? o.salaryMin : Math.min(acc, o.salaryMin)) : acc, undefined);
  const salaryMax = allOpps.reduce<number | undefined>((acc, o) =>
    o.salaryMax ? (acc === undefined ? o.salaryMax : Math.max(acc, o.salaryMax)) : acc, undefined);
  const salaryCurrency = allOpps.find((o) => o.salaryCurrency)?.salaryCurrency;
  const salaryStr = formatSalary(salaryMin, salaryMax, salaryCurrency, t.company.salaryFrom);

  const firstOpp = allOpps[0];
  const city = firstOpp?.city;
  const workFormat = firstOpp?.workFormat;

  const formatLabel: Record<string, string> = {
    remote: t.company.remote,
    office: t.company.office,
    hybrid: t.company.hybrid,
  };

  const formatColor: Record<string, string> = {
    remote: 'pill-green',
    office: 'pill-blue',
    hybrid: 'pill-amber',
  };

  const stacks = (company.stack ?? []).slice(0, 4);
  const extraStacks = (company.stack ?? []).length - 4;

  return (
    <article className="card flex flex-col gap-0 overflow-hidden" id={`company-${company.id}`}>
      {/* Top section */}
      <div className="flex flex-col gap-3 p-5">
        {/* Header: logo + name + actions */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            {/* Logo */}
            <div className="shrink-0">
              {company.logoURL ? (
                <img
                  src={company.logoURL}
                  alt={company.name}
                  className="h-11 w-11 rounded-xl object-cover border border-slate-100 dark:border-slate-800 shadow-sm"
                />
              ) : (
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-brand/15 to-purple-500/15 border border-brand/10 text-brand font-bold text-lg shadow-sm">
                  {company.name[0]?.toUpperCase()}
                </div>
              )}
            </div>
            {/* Name + industry */}
            <div className="min-w-0 pt-0.5">
              <div className="flex items-center gap-2">
                <h3 className="truncate text-[15px] font-semibold text-slate-900 dark:text-slate-50 leading-tight">
                  {company.name}
                </h3>
                {/* Verified badge */}
                {(company as any).isVerified && (
                  <span className="shrink-0 text-brand" title="Верифицирована">
                    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                    </svg>
                  </span>
                )}
              </div>
              {company.industry && (
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{company.industry}</p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5 shrink-0">
            <FavoriteButton entityType="company" entityId={company.id} />
            <Link
              href={`/companies/${company.id}`}
              className="btn-secondary text-xs px-3 py-1.5"
            >
              {t.company.details}
            </Link>
          </div>
        </div>

        {/* Stack tags */}
        {stacks.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {stacks.map((s) => (
              <span key={s.id} className="pill-slate text-[11px]">
                {s.name}
              </span>
            ))}
            {extraStacks > 0 && (
              <span className="pill-slate text-[11px] opacity-60">+{extraStacks}</span>
            )}
          </div>
        )}

        {/* Badges */}
        {((company as any).badges ?? []).length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {((company as any).badges as Array<{ id: number; icon: string; label: string; colorLight: string; colorDark: string }>).map(badge => {
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

        {/* Meta: city + format */}
        {(city || workFormat) && (
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            {city && (
              <span className="flex items-center gap-1">
                <svg className="h-3 w-3 opacity-60" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/>
                </svg>
                {city}
              </span>
            )}
            {workFormat && (
              <span className={formatColor[workFormat] ?? 'pill-slate'}>
                {formatLabel[workFormat] ?? workFormat}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Footer section */}
      <div className="border-t border-slate-100 dark:border-slate-800/70 bg-slate-50/50 dark:bg-slate-900/30 px-5 py-3">
        {hasOpenings ? (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap gap-1.5">
              {internships.length > 0 && (
                <span className="pill-purple">
                  {internships.length} {t.company.internships.toLowerCase()}
                </span>
              )}
              {vacancies.length > 0 && (
                <span className="pill-blue">
                  {vacancies.length} {t.company.vacancies.toLowerCase()}
                </span>
              )}
            </div>
            {salaryStr && (
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 tabular-nums">
                {salaryStr}
              </span>
            )}
          </div>
        ) : (
          <p className="text-xs text-slate-400 dark:text-slate-500 italic">
            {t.company.noOpeningsCard}
          </p>
        )}
      </div>
    </article>
  );
}
