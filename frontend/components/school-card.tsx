import { School } from '../lib/api';

export function SchoolCard({ school }: { school: School }) {
  return (
    <article className="card flex flex-col gap-4 p-6">
      <div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">{school.name}</h3>
        {school.description && <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{school.description}</p>}
      </div>
      <div className="space-y-3">
        {(school.courses ?? []).map((course) => (
          <div key={course.id} className="rounded-xl border border-slate-200/70 dark:border-slate-700/60 p-4">
            <p className="font-medium text-slate-800 dark:text-slate-100">{course.title}</p>
            {course.description && <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{course.description}</p>}
            {course.externalURL && (
              <a
                href={course.externalURL}
                className="mt-2 inline-flex text-xs text-brand hover:text-brand-dark"
                target="_blank"
                rel="noreferrer"
              >
                Перейти на сайт →
              </a>
            )}
          </div>
        ))}
      </div>
    </article>
  );
}
