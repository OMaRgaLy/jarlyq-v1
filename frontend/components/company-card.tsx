import Link from 'next/link';
import { Company } from '../lib/api';
import { useLang } from '../lib/lang-context';

interface Props {
  company: Company;
}

export function CompanyCard({ company }: Props) {
  const { t } = useLang();
  const internships = (company.opportunities ?? []).filter((o) => o.type === 'internship');
  const vacancies = (company.opportunities ?? []).filter((o) => o.type === 'vacancy');

  return (
    <article className="card flex flex-col gap-4 p-6" id={`company-${company.id}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-50">{company.name}</h3>
          {company.description && (
            <p className="text-sm text-slate-600 line-clamp-2 dark:text-slate-300">{company.description}</p>
          )}
        </div>
        <Link
          href={`/companies/${company.id}`}
          className="shrink-0 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:border-brand hover:text-brand dark:border-slate-700 dark:text-slate-300"
        >
          {t.company.details}
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {company.widgets.internshipEnabled && internships.length > 0 && (
          <div>
            <h4 className="mb-2 text-sm font-semibold uppercase tracking-wide text-brand">
              {t.company.internships}
            </h4>
            <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
              {internships.map((item) => (
                <li key={item.id} className="rounded-xl border border-slate-200/70 dark:border-slate-700/60 p-3">
                  <p className="font-medium text-slate-800 dark:text-slate-100">{item.title}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{t.company.level}: {item.level}</p>
                  {item.applyURL && (
                    <a
                      href={item.applyURL}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-flex text-xs text-brand hover:text-brand-dark"
                    >
                      {t.company.apply} →
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {company.widgets.vacancyEnabled && vacancies.length > 0 && (
          <div>
            <h4 className="mb-2 text-sm font-semibold uppercase tracking-wide text-brand">
              {t.company.vacancies}
            </h4>
            <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
              {vacancies.map((item) => (
                <li key={item.id} className="rounded-xl border border-slate-200/70 dark:border-slate-700/60 p-3">
                  <p className="font-medium text-slate-800 dark:text-slate-100">{item.title}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{t.company.level}: {item.level}</p>
                  {item.applyURL && (
                    <a
                      href={item.applyURL}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-flex text-xs text-brand hover:text-brand-dark"
                    >
                      {t.company.respond} →
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </article>
  );
}
