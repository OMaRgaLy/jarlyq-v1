'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '../../../components/header';
import { getToken, getUser } from '../../../lib/auth';
import { useLang } from '../../../lib/lang-context';
import { api, Company, Opportunity, HRContact } from '../../../lib/api';
import {
  fetchDashboardCompany,
  updateDashboardCompany,
  createDashboardOpportunity,
  deleteDashboardOpportunity,
  createDashboardHRContact,
  deleteDashboardHRContact,
} from '../../../lib/dashboard-api';

export default function CompanyDashboardPage() {
  const router = useRouter();
  const { t } = useLang();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [company, setCompany] = useState<Company | null>(null);

  // Company form
  const [form, setForm] = useState({
    name: '', description: '', about: '', logo_url: '', cover_url: '',
    founded_year: 0, employee_count: '', industry: '',
    website: '', telegram: '', email: '',
    training_enabled: false, internship_enabled: false, vacancy_enabled: false,
  });

  // New opportunity form
  const [showOppForm, setShowOppForm] = useState(false);
  const [oppForm, setOppForm] = useState({
    type: 'internship', title: '', description: '', requirements: '',
    apply_url: '', level: 'intern', salary_min: 0, salary_max: 0,
    salary_currency: 'KZT', work_format: 'office', city: '',
  });

  // New HR contact form
  const [showHRForm, setShowHRForm] = useState(false);
  const [hrForm, setHRForm] = useState({ name: '', position: '', telegram: '', linkedin: '', note: '' });

  useEffect(() => {
    const token = getToken();
    const u = getUser();
    if (!token || !u) { router.push('/'); return; }
    if (u.role !== 'company_owner' && u.role !== 'admin') { router.push('/dashboard'); return; }
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

    fetchDashboardCompany()
      .then(c => {
        setCompany(c);
        setForm({
          name: c.name, description: c.description || '', about: c.about || '',
          logo_url: c.logoURL || '', cover_url: c.coverURL || '',
          founded_year: c.foundedYear || 0, employee_count: c.employeeCount || '',
          industry: c.industry || '',
          website: c.contacts?.website || '', telegram: c.contacts?.telegram || '',
          email: c.contacts?.email || '',
          training_enabled: c.widgets?.trainingEnabled || false,
          internship_enabled: c.widgets?.internshipEnabled || false,
          vacancy_enabled: c.widgets?.vacancyEnabled || false,
        });
      })
      .catch(() => router.push('/dashboard'))
      .finally(() => setLoading(false));
  }, [router]);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const updated = await updateDashboardCompany(form);
      setCompany(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch { /* handled */ }
    finally { setSaving(false); }
  };

  const handleAddOpportunity = async () => {
    try {
      const opp = await createDashboardOpportunity(oppForm);
      setCompany(prev => prev ? { ...prev, opportunities: [...(prev.opportunities || []), opp] } : prev);
      setShowOppForm(false);
      setOppForm({ type: 'internship', title: '', description: '', requirements: '', apply_url: '', level: 'intern', salary_min: 0, salary_max: 0, salary_currency: 'KZT', work_format: 'office', city: '' });
    } catch { /* handled */ }
  };

  const handleDeleteOpportunity = async (id: number) => {
    try {
      await deleteDashboardOpportunity(id);
      setCompany(prev => prev ? { ...prev, opportunities: prev.opportunities.filter(o => o.id !== id) } : prev);
    } catch { /* handled */ }
  };

  const handleAddHRContact = async () => {
    try {
      const contact = await createDashboardHRContact(hrForm);
      setCompany(prev => prev ? { ...prev, hrContacts: [...(prev.hrContacts || []), contact] } : prev);
      setShowHRForm(false);
      setHRForm({ name: '', position: '', telegram: '', linkedin: '', note: '' });
    } catch { /* handled */ }
  };

  const handleDeleteHRContact = async (id: number) => {
    try {
      await deleteDashboardHRContact(id);
      setCompany(prev => prev ? { ...prev, hrContacts: (prev.hrContacts || []).filter(c => c.id !== id) } : prev);
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
          <h1 className="text-2xl font-bold">{t.dashboard.editCompany}</h1>
          {saved && <span className="text-sm text-green-600">{t.dashboard.saved}</span>}
        </div>

        {/* Company Info Form */}
        <section className="border border-border rounded-xl p-6 bg-card mb-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Name</label>
              <input className={inputCls} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <label className={labelCls}>Industry</label>
              <input className={inputCls} value={form.industry} onChange={e => setForm(f => ({ ...f, industry: e.target.value }))} />
            </div>
            <div>
              <label className={labelCls}>Founded Year</label>
              <input className={inputCls} type="number" value={form.founded_year || ''} onChange={e => setForm(f => ({ ...f, founded_year: Number(e.target.value) }))} />
            </div>
            <div>
              <label className={labelCls}>Employees</label>
              <input className={inputCls} value={form.employee_count} onChange={e => setForm(f => ({ ...f, employee_count: e.target.value }))} placeholder="50-100" />
            </div>
          </div>

          <div>
            <label className={labelCls}>Description</label>
            <textarea className={inputCls} rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <div>
            <label className={labelCls}>About</label>
            <textarea className={inputCls} rows={4} value={form.about} onChange={e => setForm(f => ({ ...f, about: e.target.value }))} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Logo URL</label>
              <input className={inputCls} value={form.logo_url} onChange={e => setForm(f => ({ ...f, logo_url: e.target.value }))} />
            </div>
            <div>
              <label className={labelCls}>Cover URL</label>
              <input className={inputCls} value={form.cover_url} onChange={e => setForm(f => ({ ...f, cover_url: e.target.value }))} />
            </div>
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

          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.internship_enabled} onChange={e => setForm(f => ({ ...f, internship_enabled: e.target.checked }))} />
              Internships
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.vacancy_enabled} onChange={e => setForm(f => ({ ...f, vacancy_enabled: e.target.checked }))} />
              Vacancies
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.training_enabled} onChange={e => setForm(f => ({ ...f, training_enabled: e.target.checked }))} />
              Training
            </label>
          </div>

          <button onClick={handleSave} disabled={saving} className={btnCls}>
            {saving ? '...' : t.dashboard.save}
          </button>
        </section>

        {/* Opportunities */}
        <section className="border border-border rounded-xl p-6 bg-card mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">{t.dashboard.opportunities}</h2>
            <button onClick={() => setShowOppForm(v => !v)} className={btnCls}>{t.dashboard.addOpportunity}</button>
          </div>

          {showOppForm && (
            <div className="border border-border rounded-lg p-4 mb-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <select className={inputCls} value={oppForm.type} onChange={e => setOppForm(f => ({ ...f, type: e.target.value }))}>
                  <option value="internship">Internship</option>
                  <option value="vacancy">Vacancy</option>
                </select>
                <input className={inputCls} placeholder="Title" value={oppForm.title} onChange={e => setOppForm(f => ({ ...f, title: e.target.value }))} />
              </div>
              <textarea className={inputCls} rows={2} placeholder="Description" value={oppForm.description} onChange={e => setOppForm(f => ({ ...f, description: e.target.value }))} />
              <div className="grid grid-cols-3 gap-3">
                <select className={inputCls} value={oppForm.level} onChange={e => setOppForm(f => ({ ...f, level: e.target.value }))}>
                  <option value="intern">Intern</option>
                  <option value="junior">Junior</option>
                  <option value="middle">Middle</option>
                  <option value="senior">Senior</option>
                </select>
                <select className={inputCls} value={oppForm.work_format} onChange={e => setOppForm(f => ({ ...f, work_format: e.target.value }))}>
                  <option value="office">Office</option>
                  <option value="remote">Remote</option>
                  <option value="hybrid">Hybrid</option>
                </select>
                <input className={inputCls} placeholder="City" value={oppForm.city} onChange={e => setOppForm(f => ({ ...f, city: e.target.value }))} />
              </div>
              <input className={inputCls} placeholder="Apply URL" value={oppForm.apply_url} onChange={e => setOppForm(f => ({ ...f, apply_url: e.target.value }))} />
              <button onClick={handleAddOpportunity} disabled={!oppForm.title} className={btnCls}>{t.dashboard.save}</button>
            </div>
          )}

          <div className="space-y-2">
            {company?.opportunities?.map((opp: Opportunity) => (
              <div key={opp.id} className="flex items-center justify-between border border-border rounded-lg px-4 py-3">
                <div>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-brand/10 text-brand mr-2">{opp.type}</span>
                  <span className="text-sm font-medium">{opp.title}</span>
                  <span className="text-xs text-muted-foreground ml-2">{opp.level} · {opp.workFormat} · {opp.city}</span>
                </div>
                <button onClick={() => handleDeleteOpportunity(opp.id)} className={btnDangerCls}>{t.dashboard.delete}</button>
              </div>
            ))}
            {(!company?.opportunities || company.opportunities.length === 0) && (
              <p className="text-sm text-muted-foreground">No opportunities yet</p>
            )}
          </div>
        </section>

        {/* HR Contacts */}
        <section className="border border-border rounded-xl p-6 bg-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">HR Contacts</h2>
            <button onClick={() => setShowHRForm(v => !v)} className={btnCls}>Add Contact</button>
          </div>

          {showHRForm && (
            <div className="border border-border rounded-lg p-4 mb-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input className={inputCls} placeholder="Name" value={hrForm.name} onChange={e => setHRForm(f => ({ ...f, name: e.target.value }))} />
                <input className={inputCls} placeholder="Position" value={hrForm.position} onChange={e => setHRForm(f => ({ ...f, position: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input className={inputCls} placeholder="Telegram" value={hrForm.telegram} onChange={e => setHRForm(f => ({ ...f, telegram: e.target.value }))} />
                <input className={inputCls} placeholder="LinkedIn" value={hrForm.linkedin} onChange={e => setHRForm(f => ({ ...f, linkedin: e.target.value }))} />
              </div>
              <input className={inputCls} placeholder="Note" value={hrForm.note} onChange={e => setHRForm(f => ({ ...f, note: e.target.value }))} />
              <button onClick={handleAddHRContact} disabled={!hrForm.name} className={btnCls}>{t.dashboard.save}</button>
            </div>
          )}

          <div className="space-y-2">
            {company?.hrContacts?.map((c: HRContact) => (
              <div key={c.id} className="flex items-center justify-between border border-border rounded-lg px-4 py-3">
                <div>
                  <span className="text-sm font-medium">{c.name}</span>
                  {c.position && <span className="text-xs text-muted-foreground ml-2">{c.position}</span>}
                </div>
                <button onClick={() => handleDeleteHRContact(c.id)} className={btnDangerCls}>{t.dashboard.delete}</button>
              </div>
            ))}
            {(!company?.hrContacts || company.hrContacts.length === 0) && (
              <p className="text-sm text-muted-foreground">No HR contacts yet</p>
            )}
          </div>
        </section>
      </main>
    </>
  );
}
