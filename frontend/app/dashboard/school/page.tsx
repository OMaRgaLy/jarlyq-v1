'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '../../../components/header';
import { getToken, getUser } from '../../../lib/auth';
import { useLang } from '../../../lib/lang-context';
import { api, School, Course } from '../../../lib/api';
import {
  fetchDashboardSchool,
  updateDashboardSchool,
  createDashboardCourse,
  deleteDashboardCourse,
} from '../../../lib/dashboard-api';

export default function SchoolDashboardPage() {
  const router = useRouter();
  const { t } = useLang();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [school, setSchool] = useState<School | null>(null);

  const [form, setForm] = useState({
    name: '', type: 'bootcamp', country: '', description: '', cover_url: '',
    is_state_funded: false, website: '', telegram: '', email: '',
  });

  const [showCourseForm, setShowCourseForm] = useState(false);
  const [courseForm, setCourseForm] = useState({
    title: '', description: '', external_url: '', price: 0, price_currency: 'KZT',
    duration_weeks: 0, format: 'online', has_employment: false,
    level: 'course', language: 'ru', scholarship_available: false, application_deadline: '',
  });

  useEffect(() => {
    const token = getToken();
    const u = getUser();
    if (!token || !u) { router.push('/'); return; }
    if (u.role !== 'school_owner' && u.role !== 'admin') { router.push('/dashboard'); return; }
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

    fetchDashboardSchool()
      .then(s => {
        setSchool(s);
        setForm({
          name: s.name, type: s.type || 'bootcamp', country: s.country || '',
          description: s.description || '', cover_url: s.coverURL || '',
          is_state_funded: s.isStateFunded || false,
          website: s.contacts?.website || '', telegram: s.contacts?.telegram || '',
          email: s.contacts?.email || '',
        });
      })
      .catch(() => router.push('/dashboard'))
      .finally(() => setLoading(false));
  }, [router]);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const updated = await updateDashboardSchool(form);
      setSchool(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch { /* handled */ }
    finally { setSaving(false); }
  };

  const handleAddCourse = async () => {
    try {
      const course = await createDashboardCourse(courseForm);
      setSchool(prev => prev ? { ...prev, courses: [...(prev.courses || []), course] } : prev);
      setShowCourseForm(false);
      setCourseForm({ title: '', description: '', external_url: '', price: 0, price_currency: 'KZT', duration_weeks: 0, format: 'online', has_employment: false, level: 'course', language: 'ru', scholarship_available: false, application_deadline: '' });
    } catch { /* handled */ }
  };

  const handleDeleteCourse = async (id: number) => {
    try {
      await deleteDashboardCourse(id);
      setSchool(prev => prev ? { ...prev, courses: prev.courses.filter(c => c.id !== id) } : prev);
    } catch { /* handled */ }
  };

  if (loading) {
    return (
      <>
        <Header />
        <main className="max-w-4xl mx-auto px-4 py-10">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-64" />
            <div className="h-40 bg-muted rounded" />
          </div>
        </main>
      </>
    );
  }

  const inputCls = 'w-full rounded-lg border border-border bg-background px-3 py-2 text-sm';
  const labelCls = 'block text-sm font-medium mb-1';
  const btnCls = 'px-4 py-2 rounded-lg bg-brand text-white text-sm font-medium hover:bg-brand/90 transition disabled:opacity-50';
  const btnDangerCls = 'px-3 py-1 rounded-lg bg-red-500/10 text-red-600 text-xs font-medium hover:bg-red-500/20 transition';

  return (
    <>
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">{t.dashboard.editSchool}</h1>
          {saved && <span className="text-sm text-green-600">{t.dashboard.saved}</span>}
        </div>

        {/* School Info Form */}
        <section className="border border-border rounded-xl p-6 bg-card mb-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Name</label>
              <input className={inputCls} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <label className={labelCls}>Type</label>
              <select className={inputCls} value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                <option value="bootcamp">Bootcamp</option>
                <option value="university">University</option>
                <option value="state_program">State Program</option>
                <option value="university_abroad">University Abroad</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Country</label>
              <input className={inputCls} value={form.country} onChange={e => setForm(f => ({ ...f, country: e.target.value }))} />
            </div>
            <div>
              <label className={labelCls}>Cover URL</label>
              <input className={inputCls} value={form.cover_url} onChange={e => setForm(f => ({ ...f, cover_url: e.target.value }))} />
            </div>
          </div>

          <div>
            <label className={labelCls}>Description</label>
            <textarea className={inputCls} rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className={labelCls}>Website</label>
              <input className={inputCls} value={form.website} onChange={e => setForm(f => ({ ...f, website: e.target.value }))} />
            </div>
            <div>
              <label className={labelCls}>Telegram</label>
              <input className={inputCls} value={form.telegram} onChange={e => setForm(f => ({ ...f, telegram: e.target.value }))} />
            </div>
            <div>
              <label className={labelCls}>Email</label>
              <input className={inputCls} value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.is_state_funded} onChange={e => setForm(f => ({ ...f, is_state_funded: e.target.checked }))} />
            State Funded
          </label>

          <button onClick={handleSave} disabled={saving} className={btnCls}>
            {saving ? '...' : t.dashboard.save}
          </button>
        </section>

        {/* Courses */}
        <section className="border border-border rounded-xl p-6 bg-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">{t.dashboard.courses}</h2>
            <button onClick={() => setShowCourseForm(v => !v)} className={btnCls}>{t.dashboard.addCourse}</button>
          </div>

          {showCourseForm && (
            <div className="border border-border rounded-lg p-4 mb-4 space-y-3">
              <input className={inputCls} placeholder="Title" value={courseForm.title} onChange={e => setCourseForm(f => ({ ...f, title: e.target.value }))} />
              <textarea className={inputCls} rows={2} placeholder="Description" value={courseForm.description} onChange={e => setCourseForm(f => ({ ...f, description: e.target.value }))} />
              <div className="grid grid-cols-3 gap-3">
                <select className={inputCls} value={courseForm.format} onChange={e => setCourseForm(f => ({ ...f, format: e.target.value }))}>
                  <option value="online">Online</option>
                  <option value="offline">Offline</option>
                  <option value="hybrid">Hybrid</option>
                </select>
                <select className={inputCls} value={courseForm.level} onChange={e => setCourseForm(f => ({ ...f, level: e.target.value }))}>
                  <option value="course">Course</option>
                  <option value="bootcamp">Bootcamp</option>
                  <option value="bachelor">Bachelor</option>
                  <option value="master">Master</option>
                </select>
                <select className={inputCls} value={courseForm.language} onChange={e => setCourseForm(f => ({ ...f, language: e.target.value }))}>
                  <option value="ru">Russian</option>
                  <option value="en">English</option>
                  <option value="kk">Kazakh</option>
                </select>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <input className={inputCls} type="number" placeholder="Price" value={courseForm.price || ''} onChange={e => setCourseForm(f => ({ ...f, price: Number(e.target.value) }))} />
                <input className={inputCls} type="number" placeholder="Duration (weeks)" value={courseForm.duration_weeks || ''} onChange={e => setCourseForm(f => ({ ...f, duration_weeks: Number(e.target.value) }))} />
                <input className={inputCls} placeholder="External URL" value={courseForm.external_url} onChange={e => setCourseForm(f => ({ ...f, external_url: e.target.value }))} />
              </div>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={courseForm.has_employment} onChange={e => setCourseForm(f => ({ ...f, has_employment: e.target.checked }))} />
                  Employment
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={courseForm.scholarship_available} onChange={e => setCourseForm(f => ({ ...f, scholarship_available: e.target.checked }))} />
                  Scholarship
                </label>
              </div>
              <button onClick={handleAddCourse} disabled={!courseForm.title} className={btnCls}>{t.dashboard.save}</button>
            </div>
          )}

          <div className="space-y-2">
            {school?.courses?.map((c: Course) => (
              <div key={c.id} className="flex items-center justify-between border border-border rounded-lg px-4 py-3">
                <div>
                  <span className="text-sm font-medium">{c.title}</span>
                  <span className="text-xs text-muted-foreground ml-2">
                    {c.format} · {c.durationWeeks}w · {c.level}
                    {c.price ? ` · ${c.price} ${c.priceCurrency}` : ''}
                  </span>
                </div>
                <button onClick={() => handleDeleteCourse(c.id)} className={btnDangerCls}>{t.dashboard.delete}</button>
              </div>
            ))}
            {(!school?.courses || school.courses.length === 0) && (
              <p className="text-sm text-muted-foreground">No courses yet</p>
            )}
          </div>
        </section>
      </main>
    </>
  );
}
