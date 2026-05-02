'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header } from '../../components/header';
import { getToken, getUser, AuthUser } from '../../lib/auth';
import { useLang } from '../../lib/lang-context';
import { api, Company, School, OwnerRequest } from '../../lib/api';
import { fetchMyOwnerRequests, createOwnerRequest } from '../../lib/dashboard-api';

export default function DashboardPage() {
  const router = useRouter();
  const { t } = useLang();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<OwnerRequest[]>([]);

  // Request form
  const [showForm, setShowForm] = useState(false);
  const [entityType, setEntityType] = useState<'company' | 'school'>('company');
  const [entityId, setEntityId] = useState<number>(0);
  const [message, setMessage] = useState('');
  const [companies, setCompanies] = useState<{ id: number; name: string }[]>([]);
  const [schools, setSchools] = useState<{ id: number; name: string }[]>([]);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    const token = getToken();
    const u = getUser();
    if (!token || !u) {
      router.push('/');
      return;
    }
    setUser(u);


    // Load owner requests
    fetchMyOwnerRequests().then(setRequests).catch(() => {});

    // Load companies/schools for selector
    Promise.all([
      api.get('/companies').then(r => r.data.companies?.map((c: Company) => ({ id: c.id, name: c.name })) || []),
      api.get('/schools').then(r => r.data.schools?.map((s: School) => ({ id: s.id, name: s.name })) || []),
    ]).then(([c, s]) => {
      setCompanies(c);
      setSchools(s);
    }).catch(() => {});

    setLoading(false);
  }, [router]);

  const handleSubmitRequest = async () => {
    if (!entityId) return;
    setSending(true);
    try {
      const req = await createOwnerRequest({ entity_type: entityType, entity_id: entityId, message });
      setRequests(prev => [req, ...prev]);
      setSent(true);
      setShowForm(false);
      setMessage('');
    } catch {
      // Error handled by interceptor
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <main className="max-w-4xl mx-auto px-4 py-10">
          <div className="animate-pulse h-8 bg-muted rounded w-48 mb-6" />
        </main>
      </>
    );
  }

  const role = user?.role || 'user';

  return (
    <>
      <Header />
      <main className="max-w-4xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold mb-6">{t.dashboard.title}</h1>

        {/* Quick links based on role */}
        {role === 'company_owner' && (
          <Link
            href="/dashboard/company"
            className="block p-6 rounded-xl border border-border bg-card hover:border-brand transition mb-4"
          >
            <h2 className="text-lg font-semibold">{t.dashboard.myCompany}</h2>
            <p className="text-sm text-muted-foreground mt-1">{t.dashboard.editCompany}</p>
          </Link>
        )}

        {role === 'school_owner' && (
          <Link
            href="/dashboard/school"
            className="block p-6 rounded-xl border border-border bg-card hover:border-brand transition mb-4"
          >
            <h2 className="text-lg font-semibold">{t.dashboard.mySchool}</h2>
            <p className="text-sm text-muted-foreground mt-1">{t.dashboard.editSchool}</p>
          </Link>
        )}

        {role === 'admin' && (
          <Link
            href="/admin/dashboard"
            className="block p-6 rounded-xl border border-border bg-card hover:border-brand transition mb-4"
          >
            <h2 className="text-lg font-semibold">Admin Panel</h2>
            <p className="text-sm text-muted-foreground mt-1">Manage all platform content</p>
          </Link>
        )}

        {/* For regular users — request access form */}
        {role === 'user' && (
          <div className="border border-border rounded-xl p-6 bg-card mb-6">
            <p className="text-muted-foreground mb-4">{t.dashboard.requestAccess}</p>

            {sent && (
              <div className="bg-green-500/10 text-green-600 dark:text-green-400 rounded-lg px-4 py-2 mb-4 text-sm">
                {t.dashboard.requestSent}
              </div>
            )}

            {!showForm ? (
              <button
                onClick={() => setShowForm(true)}
                className="px-4 py-2 rounded-lg bg-brand text-white text-sm font-medium hover:bg-brand/90 transition"
              >
                {t.dashboard.requestRole}
              </button>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">{t.dashboard.entityType}</label>
                  <select
                    value={entityType}
                    onChange={e => { setEntityType(e.target.value as 'company' | 'school'); setEntityId(0); }}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  >
                    <option value="company">{t.dashboard.selectCompany}</option>
                    <option value="school">{t.dashboard.selectSchool}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    {entityType === 'company' ? t.dashboard.selectCompany : t.dashboard.selectSchool}
                  </label>
                  <select
                    value={entityId}
                    onChange={e => setEntityId(Number(e.target.value))}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  >
                    <option value={0}>—</option>
                    {(entityType === 'company' ? companies : schools).map(e => (
                      <option key={e.id} value={e.id}>{e.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">{t.dashboard.message}</label>
                  <textarea
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    rows={3}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                    placeholder="Я HR менеджер в компании..."
                  />
                </div>

                <button
                  onClick={handleSubmitRequest}
                  disabled={!entityId || sending}
                  className="px-4 py-2 rounded-lg bg-brand text-white text-sm font-medium hover:bg-brand/90 transition disabled:opacity-50"
                >
                  {sending ? '...' : t.dashboard.send}
                </button>
              </div>
            )}
          </div>
        )}

        {/* My requests history */}
        {requests.length > 0 && (
          <div className="mt-6">
            <h2 className="text-lg font-semibold mb-3">{t.dashboard.requestRole}</h2>
            <div className="space-y-2">
              {requests.map(r => (
                <div key={r.id} className="flex items-center justify-between border border-border rounded-lg px-4 py-3 bg-card">
                  <div>
                    <span className="text-sm font-medium">{r.entityType}: {r.entityName || `#${r.entityId}`}</span>
                    {r.message && <p className="text-xs text-muted-foreground mt-0.5">{r.message}</p>}
                  </div>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                    r.status === 'pending' ? 'bg-yellow-500/10 text-yellow-600' :
                    r.status === 'approved' ? 'bg-green-500/10 text-green-600' :
                    'bg-red-500/10 text-red-600'
                  }`}>
                    {r.status === 'pending' ? t.dashboard.requestPending :
                     r.status === 'approved' ? t.dashboard.requestApproved :
                     t.dashboard.requestRejected}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </>
  );
}
