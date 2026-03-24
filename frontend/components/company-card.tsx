import Link from 'next/link';
import { Company } from '../lib/api';
import { useLang } from '../lib/lang-context';

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

  const internships = (company.opportunities ?? []).filter((o) => o.type === 'internship');
  const vacancies = (company.opportunities ?? []).filter((o) => o.type === 'vacancy');
  const hasOpenings = internships.length > 0 || vacancies.length > 0;

  // Best salary: take the lowest min across all opportunities that have one
  const allOpps = [...internships, ...vacancies];
  const salaryMin = allOpps.reduce<number | undefined>((acc, o) =>
    o.salaryMin ? (acc === undefined ? o.salaryMin : Math.min(acc, o.salaryMin)) : acc, undefined);
  const salaryMax = allOpps.reduce<number | undefined>((acc, o) =>
    o.salaryMax ? (acc === undefined ? o.salaryMax : Math.max(acc, o.salaryMax)) : acc, undefined);
  const salaryCurrency = allOpps.find((o) => o.salaryCurrency)?.salaryCurrency;
  const salaryStr = formatSalary(salaryMin, salaryMax, salaryCurrency, t.company.salaryFrom);

  // City + format from first opportunity
  const firstOpp = allOpps[0];
  const city = firstOpp?.city;
  const workFormat = firstOpp?.workFormat;

  const formatLabel: Record<string, string> = {
    remote: t.company.remote,
    office: t.company.office,
    hybrid: t.company.hybrid,
  };

  // Stack tags (up to 4)
  const stacks = (company.stack ?? []).slice(0, 4);

  return (
    <article className="card flex flex-col gap-3 p-5" id={`company-${company.id}`}>
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-lg font-semibold text-slate-900 dark:text-slate-50">{company.name}</h3>
          {company.industry && (
            <p className="text-xs text-slate-400 dark:text-slate-500">{company.industry}</p>
          )}
        </div>
        <Link
          href={`/companies/${company.id}`}
          className="shrink-0 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:border-brand hover:text-brand dark:border-slate-700 dark:text-slate-300"
        >
          {t.company.details}
        </Link>
      </div>

      {/* Stack tags */}
      {stacks.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {stacks.map((s) => (
            <span
              key={s.id}
              className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300"
            >
              {s.name}
            </span>
          ))}
          {(company.stack ?? []).length > 4 && (
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-400 dark:bg-slate-800">
              +{(company.stack ?? []).length - 4}
            </span>
          )}
        </div>
      )}

      {/* Meta row: city · format */}
      {(city || workFormat) && (
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          {city && <span>📍 {city}</span>}
          {workFormat && (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 dark:bg-slate-800">
              {formatLabel[workFormat] ?? workFormat}
            </span>
          )}
        </div>
      )}

      {/* Openings + salary */}
      <div className="mt-auto border-t border-slate-100 pt-3 dark:border-slate-800">
        {hasOpenings ? (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap gap-2">
              {internships.length > 0 && (
                <span className="rounded-full bg-purple-50 px-2.5 py-0.5 text-xs font-medium text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                  {internships.length} {t.company.internships.toLowerCase()}
                </span>
              )}
              {vacancies.length > 0 && (
                <span className="rounded-full bg-brand/10 px-2.5 py-0.5 text-xs font-medium text-brand">
                  {vacancies.length} {t.company.vacancies.toLowerCase()}
                </span>
              )}
            </div>
            {salaryStr && (
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                {salaryStr}
              </span>
            )}
          </div>
        ) : (
          <p className="text-xs text-slate-400 dark:text-slate-500">
            {t.company.noOpeningsCard}
          </p>
        )}
      </div>
    </article>
  );
}
