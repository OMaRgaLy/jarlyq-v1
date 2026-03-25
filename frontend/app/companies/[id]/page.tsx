'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Header } from '../../../components/header';
import { useCompany, useCompanyReviews } from '../../../lib/hooks';
import { useLang } from '../../../lib/lang-context';
import { getUser } from '../../../lib/auth';
import { api } from '../../../lib/api';
import type { CompanyShowcase, HRContent } from '../../../lib/api';

// ─── helpers ─────────────────────────────────────────────────────────────────

const levelColors: Record<string, string> = {
  intern: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  junior: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  middle: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  senior: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
};

const showcaseTypeColors: Record<string, string> = {
  internship: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  event: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  vacancy: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  news: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
};

const contentTypeIcons: Record<HRContent['type'], string> = {
  article: '📄',
  tip: '💡',
  speech: '🎤',
  video: '🎬',
};

function ShowcaseTypeLabel({ type, t }: {
  type: CompanyShowcase['type'];
  t: { showcaseInternship: string; showcaseEvent: string; showcaseVacancy: string; showcaseNews: string };
}) {
  const labels: Record<CompanyShowcase['type'], string> = {
    internship: t.showcaseInternship,
    event: t.showcaseEvent,
    vacancy: t.showcaseVacancy,
    news: t.showcaseNews,
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${showcaseTypeColors[type] ?? 'bg-slate-100 text-slate-600'}`}>
      {labels[type]}
    </span>
  );
}

function StarRating({ value, max = 5 }: { value: number; max?: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <span key={i} className={i < Math.round(value) ? 'text-amber-400' : 'text-slate-200 dark:text-slate-700'}>★</span>
      ))}
    </span>
  );
}

function SubRatingBar({ label, value }: { label: string; value: number }) {
  if (!value) return null;
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-32 shrink-0 text-slate-500">{label}</span>
      <div className="h-1.5 flex-1 rounded-full bg-slate-100 dark:bg-slate-700">
        <div className="h-1.5 rounded-full bg-brand" style={{ width: `${(value / 5) * 100}%` }} />
      </div>
      <span className="w-4 text-right text-slate-600 dark:text-slate-300">{value}</span>
    </div>
  );
}

function formatSalary(min?: number, max?: number, currency?: string, fromLabel?: string): string | null {
  const curr = currency || '₸';
  if (!min && !max) return null;
  if (min && max) return `${min.toLocaleString()} – ${max.toLocaleString()} ${curr}`;
  if (min) return `${fromLabel} ${min.toLocaleString()} ${curr}`;
  if (max) return `до ${max.toLocaleString()} ${curr}`;
  return null;
}

// ─── main component ───────────────────────────────────────────────────────────

type Tab = 'overview' | 'jobs' | 'team' | 'reviews';

export default function CompanyDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const { data: company, isLoading } = useCompany(Number(id));
  const { data: reviewsData, refetch: refetchReviews } = useCompanyReviews(Number(id));
  const { t } = useLang();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [activePhoto, setActivePhoto] = useState(0);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const user = typeof window !== 'undefined' ? getUser() : null;

  const [form, setForm] = useState({
    rating: 5,
    title: '',
    review_text: '',
    is_anonymous: false,
    employment_type: 'current',
    position: '',
    years_worked: 0,
    work_life_balance: 0,
    salary_rating: 0,
    growth_rating: 0,
    culture_rating: 0,
  });

  const handleSubmitReview = async () => {
    setReviewError('');
    setSubmitting(true);
    try {
      await api.post(`/companies/${id}/reviews`, form);
      setReviewSubmitted(true);
      setShowReviewForm(false);
      refetchReviews();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Error submitting review';
      setReviewError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // ─── loading / not found ──────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-100/60 dark:bg-slate-950">
        <Header />
        <main className="mx-auto max-w-5xl px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-6 w-36 rounded-lg bg-slate-200 dark:bg-slate-800" />
            <div className="h-64 rounded-2xl bg-slate-200 dark:bg-slate-800" />
            <div className="h-12 rounded-2xl bg-slate-200 dark:bg-slate-800" />
            <div className="h-60 rounded-2xl bg-slate-200 dark:bg-slate-800" />
          </div>
        </main>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen bg-slate-100/60 dark:bg-slate-950">
        <Header />
        <main className="mx-auto max-w-5xl px-4 py-8">
          <p className="text-slate-500">{t.common.notFound}</p>
          <Link href="/companies" className="mt-4 inline-block text-sm text-brand hover:underline">
            {t.company.backToList}
          </Link>
        </main>
      </div>
    );
  }

  // ─── derived data ─────────────────────────────────────────────────────────

  const internships = (company.opportunities ?? []).filter((o) => o.type === 'internship');
  const vacancies = (company.opportunities ?? []).filter((o) => o.type === 'vacancy');
  const photos = company.photos ?? [];
  const offices = company.offices ?? [];
  const showcase = company.showcase ?? [];
  const hrContacts = company.hrContacts ?? [];
  const hrContent = company.hrContent ?? [];
  const reviews = reviewsData?.reviews ?? [];
  const reviewTotal = reviewsData?.total ?? 0;
  const avgRating = reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
  const displayedReviews = showAllReviews ? reviews : reviews.slice(0, 3);

  const formatLabel: Record<string, string> = {
    remote: t.company.remote,
    office: t.company.office,
    hybrid: t.company.hybrid,
  };

  const contentTypeLabel: Record<HRContent['type'], string> = {
    article: t.company.contentTypeArticle,
    tip: t.company.contentTypeTip,
    speech: t.company.contentTypeSpeech,
    video: t.company.contentTypeVideo,
  };

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: 'overview', label: t.company.tabOverview },
    { key: 'jobs', label: t.company.tabJobs, count: internships.length + vacancies.length },
    { key: 'team', label: t.company.tabTeam, count: hrContacts.length + hrContent.length || undefined },
    { key: 'reviews', label: t.company.tabReviews, count: reviewTotal || undefined },
  ];

  // ─── render ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-100/60 dark:bg-slate-950">
      <Header />
      <main className="mx-auto max-w-5xl px-4 py-8 space-y-6">
        <Link href="/companies" className="inline-flex text-sm text-brand hover:underline">
          {t.company.backToList}
        </Link>

        {/* ── Hero card ── */}
        <div className="card overflow-hidden">
          {/* Cover / photo gallery */}
          {photos.length > 0 && photos[activePhoto].url?.startsWith('http') ? (
            <div className="relative h-56 w-full bg-slate-100 dark:bg-slate-800">
              <Image
                src={photos[activePhoto].url}
                alt={photos[activePhoto].caption || company.name}
                fill
                className="object-cover transition-opacity duration-300"
                sizes="(max-width: 768px) 100vw, 1024px"
                priority
              />
              {photos.length > 1 && (
                <>
                  <button
                    onClick={() => setActivePhoto((p) => (p - 1 + photos.length) % photos.length)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 px-2 py-1 text-lg text-white hover:bg-black/60"
                    aria-label="Previous photo"
                  >‹</button>
                  <button
                    onClick={() => setActivePhoto((p) => (p + 1) % photos.length)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 px-2 py-1 text-lg text-white hover:bg-black/60"
                    aria-label="Next photo"
                  >›</button>
                  <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
                    {photos.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setActivePhoto(i)}
                        className={`h-1.5 rounded-full transition-all ${i === activePhoto ? 'w-5 bg-white' : 'w-1.5 bg-white/50'}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          ) : company.coverURL?.startsWith('http') ? (
            <div className="relative h-56 w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
              <Image src={company.coverURL} alt={company.name} fill className="object-cover" sizes="(max-width: 768px) 100vw, 1024px" priority />
            </div>
          ) : null}

          <div className="p-6">
            <div className="flex items-start gap-4">
              {company.logoURL?.startsWith('http') && (
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-700 shadow-sm">
                  <Image src={company.logoURL} alt={`${company.name} logo`} fill className="object-contain p-1.5" sizes="64px" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{company.name}</h1>
                    {company.industry && (
                      <p className="text-sm text-slate-500 dark:text-slate-400">{company.industry}</p>
                    )}
                  </div>
                  {/* Rating badge */}
                  {reviewTotal > 0 && (
                    <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-1.5 dark:border-amber-800/40 dark:bg-amber-900/20">
                      <span className="text-amber-500">★</span>
                      <span className="font-semibold text-amber-700 dark:text-amber-400">{avgRating.toFixed(1)}</span>
                      <span className="text-xs text-amber-600/70 dark:text-amber-500/70">({reviewTotal})</span>
                    </div>
                  )}
                </div>

                {/* Meta row */}
                <div className="mt-3 flex flex-wrap gap-3 text-sm text-slate-500 dark:text-slate-400">
                  {company.foundedYear ? <span>📅 {company.foundedYear}</span> : null}
                  {company.employeeCount ? <span>👥 {company.employeeCount}</span> : null}
                  {(company.stack ?? []).length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {(company.stack ?? []).slice(0, 5).map((s) => (
                        <span key={s.id} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                          {s.name}
                        </span>
                      ))}
                      {(company.stack ?? []).length > 5 && (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-400 dark:bg-slate-800">
                          +{(company.stack ?? []).length - 5}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Short description */}
                {company.description && (
                  <p className="mt-3 text-sm text-slate-600 dark:text-slate-300 line-clamp-2">{company.description}</p>
                )}

                {/* Contact links */}
                {company.contacts && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {company.contacts.website && (
                      <a href={company.contacts.website} target="_blank" rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-brand hover:bg-brand/5 dark:border-slate-700">
                        🌐 {t.company.website}
                      </a>
                    )}
                    {company.contacts.telegram && (
                      <a href={`https://t.me/${company.contacts.telegram.replace('@', '')}`} target="_blank" rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-[#229ED9] hover:bg-[#229ED9]/5 dark:border-slate-700">
                        ✈️ {t.company.telegram}
                      </a>
                    )}
                    {company.contacts.email && (
                      <a href={`mailto:${company.contacts.email}`}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300">
                        📧 {t.company.email}
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Tab bar ── */}
        <div className="flex gap-1 rounded-2xl border border-slate-200/70 bg-white p-1 dark:border-slate-700/60 dark:bg-slate-900">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'bg-brand text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
              }`}
            >
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className={`rounded-full px-1.5 py-0.5 text-xs font-semibold ${
                  activeTab === tab.key ? 'bg-white/20' : 'bg-slate-100 dark:bg-slate-800'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Tab: Overview ── */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* About */}
            {(company.about || company.description) && (
              <section className="card p-6">
                <h2 className="mb-3 text-base font-semibold text-slate-900 dark:text-white">{t.company.about}</h2>
                <p className="whitespace-pre-line leading-relaxed text-slate-600 dark:text-slate-300">
                  {company.about || company.description}
                </p>
              </section>
            )}

            {/* Showcase */}
            {showcase.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-base font-semibold text-slate-900 dark:text-white">{t.company.showcase}</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {showcase.map((item) => (
                    <div key={item.id} className="card flex flex-col overflow-hidden">
                      {item.imageURL?.startsWith('http') && (
                        <div className="relative h-36 w-full bg-slate-100 dark:bg-slate-800">
                          <Image src={item.imageURL} alt={item.title} fill className="object-cover" sizes="(max-width: 640px) 100vw, 512px" />
                        </div>
                      )}
                      <div className="flex flex-1 flex-col gap-2 p-4">
                        <ShowcaseTypeLabel type={item.type} t={t.company} />
                        <p className="font-semibold text-slate-900 dark:text-white">{item.title}</p>
                        {item.description && (
                          <p className="line-clamp-2 text-sm text-slate-600 dark:text-slate-300">{item.description}</p>
                        )}
                        {item.linkURL && (
                          <a href={item.linkURL} target="_blank" rel="noreferrer"
                            className="mt-auto inline-flex text-sm font-medium text-brand hover:underline">
                            {t.company.learnMore} →
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Offices */}
            {offices.length > 0 && (
              <section className="card p-6">
                <h2 className="mb-4 text-base font-semibold text-slate-900 dark:text-white">{t.company.offices}</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {offices.map((office) => (
                    <div key={office.id} className="flex items-start gap-3 rounded-xl border border-slate-200/70 bg-slate-50 p-3 dark:border-slate-700/60 dark:bg-slate-800/50">
                      <span className="mt-0.5 text-lg">{office.isHQ ? '🏢' : '📍'}</span>
                      <div>
                        <p className="font-medium text-slate-800 dark:text-slate-100">
                          {office.city}, {office.country}
                          {office.isHQ && (
                            <span className="ml-2 rounded-full bg-brand/10 px-2 py-0.5 text-xs font-semibold text-brand">{t.company.hq}</span>
                          )}
                        </p>
                        {office.address && <p className="text-sm text-slate-500">{office.address}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {/* ── Tab: Jobs ── */}
        {activeTab === 'jobs' && (
          <div className="space-y-6">
            {internships.length === 0 && vacancies.length === 0 ? (
              <div className="card flex flex-col items-center gap-3 py-14 text-center">
                <span className="text-4xl">🔍</span>
                <p className="font-semibold text-slate-700 dark:text-slate-200">{t.company.noOpportunities}</p>
              </div>
            ) : (
              <>
                {internships.length > 0 && (
                  <section className="space-y-3">
                    <h2 className="text-sm font-semibold uppercase tracking-wide text-brand">{t.company.internships}</h2>
                    <div className="grid gap-4 sm:grid-cols-2">
                      {internships.map((opp) => {
                        const salary = formatSalary(opp.salaryMin, opp.salaryMax, opp.salaryCurrency, t.company.salaryFrom);
                        return (
                          <div key={opp.id} className="card flex flex-col gap-3 p-5">
                            <div className="flex items-start justify-between gap-2">
                              <p className="font-semibold text-slate-900 dark:text-white">{opp.title}</p>
                              <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${levelColors[opp.level] ?? 'bg-slate-100 text-slate-600'}`}>
                                {opp.level}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                              {opp.city && <span>📍 {opp.city}</span>}
                              {opp.workFormat && (
                                <span className="rounded-full bg-slate-100 px-2 py-0.5 dark:bg-slate-800">
                                  {formatLabel[opp.workFormat] ?? opp.workFormat}
                                </span>
                              )}
                              {opp.isYearRound && (
                                <span className="rounded-full bg-green-100 px-2 py-0.5 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                  Круглый год
                                </span>
                              )}
                            </div>
                            {salary && <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{salary}</p>}
                            {opp.description && (
                              <p className="line-clamp-2 text-sm text-slate-600 dark:text-slate-300">{opp.description}</p>
                            )}
                            {opp.deadline && (
                              <p className="text-xs text-slate-400">
                                До {new Date(opp.deadline).toLocaleDateString()}
                              </p>
                            )}
                            {opp.applyURL && (
                              <a href={opp.applyURL} target="_blank" rel="noreferrer"
                                className="mt-auto inline-flex rounded-lg bg-brand px-4 py-2 text-center text-xs font-semibold text-white hover:bg-brand-dark">
                                {t.company.apply}
                              </a>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </section>
                )}

                {vacancies.length > 0 && (
                  <section className="space-y-3">
                    <h2 className="text-sm font-semibold uppercase tracking-wide text-brand">{t.company.vacancies}</h2>
                    <div className="grid gap-4 sm:grid-cols-2">
                      {vacancies.map((opp) => {
                        const salary = formatSalary(opp.salaryMin, opp.salaryMax, opp.salaryCurrency, t.company.salaryFrom);
                        return (
                          <div key={opp.id} className="card flex flex-col gap-3 p-5">
                            <div className="flex items-start justify-between gap-2">
                              <p className="font-semibold text-slate-900 dark:text-white">{opp.title}</p>
                              <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${levelColors[opp.level] ?? 'bg-slate-100 text-slate-600'}`}>
                                {opp.level}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                              {opp.city && <span>📍 {opp.city}</span>}
                              {opp.workFormat && (
                                <span className="rounded-full bg-slate-100 px-2 py-0.5 dark:bg-slate-800">
                                  {formatLabel[opp.workFormat] ?? opp.workFormat}
                                </span>
                              )}
                            </div>
                            {salary && <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{salary}</p>}
                            {opp.description && (
                              <p className="line-clamp-2 text-sm text-slate-600 dark:text-slate-300">{opp.description}</p>
                            )}
                            {opp.deadline && (
                              <p className="text-xs text-slate-400">
                                До {new Date(opp.deadline).toLocaleDateString()}
                              </p>
                            )}
                            {opp.applyURL && (
                              <a href={opp.applyURL} target="_blank" rel="noreferrer"
                                className="mt-auto inline-flex rounded-lg bg-brand px-4 py-2 text-center text-xs font-semibold text-white hover:bg-brand-dark">
                                {t.company.respond}
                              </a>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </section>
                )}
              </>
            )}
          </div>
        )}

        {/* ── Tab: Team ── */}
        {activeTab === 'team' && (
          <div className="space-y-6">
            {/* HR Contacts */}
            <section className="card p-6">
              <h2 className="mb-4 text-base font-semibold text-slate-900 dark:text-white">{t.company.hrContacts}</h2>
              {hrContacts.length === 0 ? (
                <p className="text-sm text-slate-400">{t.company.noHRContacts}</p>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {hrContacts.map((contact) => (
                    <div key={contact.id} className="flex items-start gap-4 rounded-2xl border border-slate-200/70 bg-slate-50 p-4 dark:border-slate-700/60 dark:bg-slate-800/50">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand/10 text-lg font-bold text-brand">
                        {contact.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-slate-900 dark:text-white">{contact.name}</p>
                        {contact.position && (
                          <p className="text-xs text-slate-500 dark:text-slate-400">{contact.position}</p>
                        )}
                        {contact.note && (
                          <p className="mt-1 text-xs italic text-slate-400">&ldquo;{contact.note}&rdquo;</p>
                        )}
                        <div className="mt-2 flex flex-wrap gap-2">
                          {contact.telegram && (
                            <a
                              href={`https://t.me/${contact.telegram.replace('@', '')}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 rounded-lg border border-[#229ED9]/30 px-2.5 py-1 text-xs font-medium text-[#229ED9] hover:bg-[#229ED9]/5"
                            >
                              ✈️ {t.company.connectTelegram}
                            </a>
                          )}
                          {contact.linkedin && (
                            <a
                              href={contact.linkedin}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300"
                            >
                              💼 {t.company.viewLinkedIn}
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* HR Content */}
            <section className="card p-6">
              <h2 className="mb-4 text-base font-semibold text-slate-900 dark:text-white">{t.company.hrContent}</h2>
              {hrContent.length === 0 ? (
                <p className="text-sm text-slate-400">{t.company.noHRContent}</p>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {hrContent.map((item) => (
                    <div key={item.id} className="flex flex-col gap-2 rounded-2xl border border-slate-200/70 bg-slate-50 p-4 dark:border-slate-700/60 dark:bg-slate-800/50">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{contentTypeIcons[item.type]}</span>
                        <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                          {contentTypeLabel[item.type]}
                        </span>
                      </div>
                      <p className="font-semibold text-slate-900 dark:text-white">{item.title}</p>
                      <p className="text-xs text-slate-500">
                        {item.authorName}
                        {item.authorPos && <span className="text-slate-400"> · {item.authorPos}</span>}
                      </p>
                      {item.description && (
                        <p className="line-clamp-2 text-sm text-slate-600 dark:text-slate-300">{item.description}</p>
                      )}
                      {item.url && (
                        <a href={item.url} target="_blank" rel="noreferrer"
                          className="mt-auto inline-flex text-sm font-medium text-brand hover:underline">
                          {t.company.learnMore} →
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        {/* ── Tab: Reviews ── */}
        {activeTab === 'reviews' && (
          <section className="card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-slate-900 dark:text-white">{t.reviews.title}</h2>
                {reviewTotal > 0 && reviewTotal < 10 && (
                  <p className="mt-0.5 text-xs text-slate-400">{t.reviews.ratingHidden}</p>
                )}
              </div>
              {!reviewSubmitted && !showReviewForm && (
                user ? (
                  <button
                    onClick={() => setShowReviewForm(true)}
                    className="rounded-lg border border-brand/40 bg-brand/5 px-3 py-1.5 text-sm font-medium text-brand hover:bg-brand/10"
                  >
                    + {t.reviews.addReview}
                  </button>
                ) : (
                  <p className="text-xs text-slate-400">{t.reviews.loginRequired}</p>
                )
              )}
            </div>

            {/* Rating summary */}
            {reviewTotal >= 10 && (
              <div className="flex items-center gap-4 rounded-2xl border border-amber-200/60 bg-amber-50/60 p-4 dark:border-amber-800/30 dark:bg-amber-900/10">
                <div className="text-center">
                  <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">{avgRating.toFixed(1)}</p>
                  <StarRating value={avgRating} />
                  <p className="mt-1 text-xs text-slate-400">{reviewTotal} отзывов</p>
                </div>
              </div>
            )}

            {/* Success */}
            {reviewSubmitted && (
              <div className="rounded-xl bg-green-50 px-4 py-3 text-sm text-green-700 dark:bg-green-900/20 dark:text-green-400">
                ✓ {t.reviews.successText}
              </div>
            )}

            {/* Review form */}
            {showReviewForm && (
              <div className="rounded-2xl border border-slate-200/70 bg-slate-50 p-5 space-y-4 dark:border-slate-700/60 dark:bg-slate-800/50">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">{t.reviews.ratingLabel}</label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button key={s} onClick={() => setForm(f => ({ ...f, rating: s }))}
                        className={`text-2xl ${s <= form.rating ? 'text-amber-400' : 'text-slate-200 dark:text-slate-700'}`}>★</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">{t.reviews.titleLabel}</label>
                  <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 dark:border-slate-700 dark:bg-slate-900" maxLength={255} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">{t.reviews.textLabel}</label>
                  <textarea value={form.review_text} onChange={e => setForm(f => ({ ...f, review_text: e.target.value }))}
                    rows={4} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 dark:border-slate-700 dark:bg-slate-900" />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {([
                    ['work_life_balance', t.reviews.workLifeBalance],
                    ['salary_rating', t.reviews.salaryRating],
                    ['growth_rating', t.reviews.growthRating],
                    ['culture_rating', t.reviews.cultureRating],
                  ] as [keyof typeof form, string][]).map(([key, label]) => (
                    <div key={key}>
                      <label className="mb-1 block text-xs text-slate-500">{label}</label>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <button key={s} onClick={() => setForm(f => ({ ...f, [key]: s }))}
                            className={`text-lg ${s <= (form[key] as number) ? 'text-amber-400' : 'text-slate-200 dark:text-slate-700'}`}>★</button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs text-slate-500">{t.reviews.employmentType}</label>
                    <select value={form.employment_type} onChange={e => setForm(f => ({ ...f, employment_type: e.target.value }))}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900">
                      <option value="current">{t.reviews.employmentCurrent}</option>
                      <option value="former">{t.reviews.employmentFormer}</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-slate-500">{t.reviews.position}</label>
                    <input type="text" value={form.position} onChange={e => setForm(f => ({ ...f, position: e.target.value }))}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900" />
                  </div>
                </div>
                <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                  <input type="checkbox" checked={form.is_anonymous} onChange={e => setForm(f => ({ ...f, is_anonymous: e.target.checked }))} className="rounded" />
                  {t.reviews.anonymous}
                </label>
                <p className="text-xs text-slate-400">{t.reviews.modNotice}</p>
                {reviewError && (
                  <p className="text-xs text-red-500">
                    {reviewError === 'phone number required to leave a review' ? t.reviews.phoneRequired
                      : reviewError === 'you have already reviewed this company' ? t.reviews.alreadyReviewed
                      : reviewError}
                  </p>
                )}
                <div className="flex gap-2">
                  <button onClick={handleSubmitReview} disabled={submitting || !form.title || !form.review_text}
                    className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-50">
                    {submitting ? '...' : t.reviews.submitReview}
                  </button>
                  <button onClick={() => { setShowReviewForm(false); setReviewError(''); }}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300">
                    {t.profile.cancel}
                  </button>
                </div>
              </div>
            )}

            {/* Reviews list */}
            {reviews.length === 0 ? (
              <p className="text-sm text-slate-400">{t.reviews.noReviews}</p>
            ) : (
              <div className="space-y-4">
                {displayedReviews.map((review) => (
                  <div key={review.id} className="rounded-2xl border border-slate-200/70 bg-white p-4 dark:border-slate-700/60 dark:bg-slate-900/70">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">{review.title}</p>
                        <div className="mt-0.5 flex items-center gap-2">
                          <StarRating value={review.rating} />
                          <span className="text-xs text-slate-400">{review.authorName}</span>
                          {review.position && <span className="text-xs text-slate-400">· {review.position}</span>}
                        </div>
                      </div>
                      <span className="shrink-0 text-xs text-slate-400">{new Date(review.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className="mt-2 whitespace-pre-line text-sm text-slate-600 dark:text-slate-300">{review.reviewText}</p>
                    {(review.workLifeBalance || review.salaryRating || review.growthRating || review.cultureRating) > 0 && (
                      <div className="mt-3 space-y-1">
                        <SubRatingBar label={t.reviews.workLifeBalance} value={review.workLifeBalance} />
                        <SubRatingBar label={t.reviews.salaryRating} value={review.salaryRating} />
                        <SubRatingBar label={t.reviews.growthRating} value={review.growthRating} />
                        <SubRatingBar label={t.reviews.cultureRating} value={review.cultureRating} />
                      </div>
                    )}
                  </div>
                ))}
                {reviews.length > 3 && (
                  <button onClick={() => setShowAllReviews(v => !v)} className="text-sm text-brand hover:underline">
                    {showAllReviews ? t.reviews.showLess : `${t.reviews.showAll} (${reviews.length})`}
                  </button>
                )}
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
