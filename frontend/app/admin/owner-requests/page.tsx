'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AdminNav } from '../../../components/admin-nav';
import {
  getAdminToken,
  fetchAdminOwnerRequests,
  approveOwnerRequest,
  rejectOwnerRequest,
  AdminOwnerRequest,
} from '../../../lib/admin-api';

const statusColors: Record<string, string> = {
  pending:  'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  approved: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

export default function AdminOwnerRequestsPage() {
  const router = useRouter();
  const [items, setItems] = useState<AdminOwnerRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [acting, setActing] = useState<number | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await fetchAdminOwnerRequests(filter));
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    if (!getAdminToken()) { router.push('/admin'); return; }
    reload();
  }, [router, reload]);

  const act = async (id: number, action: 'approve' | 'reject') => {
    setActing(id);
    try {
      if (action === 'approve') await approveOwnerRequest(id);
      else await rejectOwnerRequest(id);
      reload();
    } finally {
      setActing(null);
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <AdminNav />
      <main className="flex-1 p-8">
        <h1 className="text-2xl font-bold mb-6">Owner Requests</h1>

        <div className="flex gap-2 mb-6">
          {['pending', 'approved', 'rejected'].map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition ${
                filter === s ? 'bg-brand text-white' : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-20 bg-muted rounded-xl animate-pulse" />)}
          </div>
        ) : items.length === 0 ? (
          <p className="text-muted-foreground">No {filter} requests</p>
        ) : (
          <div className="space-y-3">
            {items.map(r => (
              <div key={r.id} className="border border-border rounded-xl p-5 bg-card">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[r.status] || ''}`}>
                        {r.status}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {r.entityType} #{r.entityId}
                      </span>
                    </div>
                    <p className="text-sm font-medium">{r.userName} ({r.userEmail})</p>
                    <p className="text-sm text-muted-foreground">
                      wants to manage: <strong>{r.entityName || `${r.entityType} #${r.entityId}`}</strong>
                    </p>
                    {r.message && (
                      <p className="text-sm mt-1 text-muted-foreground italic">&ldquo;{r.message}&rdquo;</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  {r.status === 'pending' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => act(r.id, 'approve')}
                        disabled={acting === r.id}
                        className="px-3 py-1.5 rounded-lg bg-green-500/10 text-green-600 text-sm font-medium hover:bg-green-500/20 transition disabled:opacity-50"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => act(r.id, 'reject')}
                        disabled={acting === r.id}
                        className="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-600 text-sm font-medium hover:bg-red-500/20 transition disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
