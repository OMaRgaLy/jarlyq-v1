import { Company } from '../lib/api';

interface Props {
  company: Company;
}

export function CompanyCard({ company }: Props) {
  const internships = (company.opportunities ?? []).filter((o) => o.type === 'internship');
  const vacancies = (company.opportunities ?? []).filter((o) => o.type === 'vacancy');

  return (
    <article className="card flex flex-col gap-4 p-6" id={`company-${company.id}`}>
      <div className="flex flex-col gap-2">
        <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-50">{company.name}</h3>
        {company.description && <p className="text-sm text-slate-600 dark:text-slate-300">{company.description}</p>}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {company.widgets.trainingEnabled && internships.length > 0 && (
          <div>
            <h4 className="mb-2 text-sm font-semibold uppercase tracking-wide text-brand">Стажировки</h4>
            <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
              {internships.map((item) => (
                <li key={item.id} className="rounded-xl border border-slate-200/70 dark:border-slate-700/60 p-3">
                  <p className="font-medium text-slate-800 dark:text-slate-100">{item.title}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Уровень: {item.level}</p>
                  {item.applyURL && (
                    <a
                      href={item.applyURL}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-flex text-xs text-brand hover:text-brand-dark"
                    >
                      Подать заявку →
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {company.widgets.vacancyEnabled && vacancies.length > 0 && (
          <div>
            <h4 className="mb-2 text-sm font-semibold uppercase tracking-wide text-brand">Вакансии</h4>
            <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
              {vacancies.map((item) => (
                <li key={item.id} className="rounded-xl border border-slate-200/70 dark:border-slate-700/60 p-3">
                  <p className="font-medium text-slate-800 dark:text-slate-100">{item.title}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Уровень: {item.level}</p>
                  {item.applyURL && (
                    <a
                      href={item.applyURL}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-flex text-xs text-brand hover:text-brand-dark"
                    >
                      Откликнуться →
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
