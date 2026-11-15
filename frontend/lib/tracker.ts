'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from './api';
import { getUser } from './auth';

// ─── Statuses ────────────────────────────────────────────────────────────────

export type AppStatus = 'saved' | 'applied' | 'interview' | 'offer' | 'rejected';

export const STATUSES: { key: AppStatus; label: string; chip: string }[] = [
  { key: 'saved', label: 'Сохранено', chip: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
  { key: 'applied', label: 'Откликнулся', chip: 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300' },
  { key: 'interview', label: 'Собеседование', chip: 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300' },
  { key: 'offer', label: 'Оффер', chip: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300' },
  { key: 'rejected', label: 'Отказ', chip: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300' },
];

export function statusMeta(key: string) {
  return STATUSES.find((s) => s.key === key) ?? STATUSES[0];
}

export interface TrackerItem {
  id: number;
  opportunityId: number;
  status: AppStatus;
  note: string;
  appliedAt?: string;
  createdAt: string;
  updatedAt: string;
  title: string;
  type: 'internship' | 'vacancy';
  deadline?: string;
  isYearRound: boolean;
  applyURL?: string;
  city?: string;
  workFormat?: string;
  isActive: boolean;
  companyId: number;
  companyName: string;
  companyLogoURL?: string;
}

// ─── Deadlines ───────────────────────────────────────────────────────────────

/**
 * Whole days from today to the deadline. 0 = today, negative = passed, null = no deadline.
 * Deadlines are stored as plain dates (midnight UTC), so we compare calendar days,
 * not hours — otherwise "tomorrow" flips depending on the time of day.
 */
export function daysLeft(deadline?: string | null): number | null {
  if (!deadline) return null;
  const d = new Date(deadline);
  if (Number.isNaN(d.getTime())) return null;
  const now = new Date();
  const target = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((target - today) / 86_400_000);
}

export type DeadlineTone = 'expired' | 'urgent' | 'soon' | 'ok' | 'none';

export function deadlineInfo(deadline?: string | null, yearRound?: boolean): { text: string; tone: DeadlineTone; days: number | null } {
  if (yearRound) return { text: 'Приём круглый год', tone: 'ok', days: null };
  const days = daysLeft(deadline);
  if (days === null) return { text: 'Без дедлайна', tone: 'none', days: null };
  if (days < 0) return { text: 'Приём закрыт', tone: 'expired', days };
  if (days === 0) return { text: 'Дедлайн сегодня', tone: 'urgent', days };
  if (days === 1) return { text: 'Остался 1 день', tone: 'urgent', days };
  const word = days % 10 >= 2 && days % 10 <= 4 && (days < 10 || days > 20) ? 'дня' : 'дней';
  return { text: `Осталось ${days} ${word}`, tone: days <= 3 ? 'urgent' : days <= 7 ? 'soon' : 'ok', days };
}

export const TONE_CLASS: Record<DeadlineTone, string> = {
  expired: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
  urgent: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
  soon: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  ok: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300',
  none: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
};

// ─── Apply ───────────────────────────────────────────────────────────────────

export interface ApplyResult {
  applyURL: string;
  tracked: boolean;
}

/**
 * Click on "Откликнуться": count the click, move the posting to "applied" in the
 * user's tracker (if signed in) and open the company's own application page.
 * The tab is opened synchronously, before the request, so the browser's
 * pop-up blocker does not swallow it.
 */
export async function applyTo(oppId: number): Promise<ApplyResult> {
  const win = typeof window !== 'undefined' ? window.open('about:blank', '_blank') : null;
  try {
    const { data } = await api.post<ApplyResult>(`/internships/${oppId}/apply`);
    if (win) {
      if (data.applyURL) {
        win.opener = null;
        win.location.href = data.applyURL;
      } else {
        win.close();
      }
    } else if (data.applyURL && typeof window !== 'undefined') {
      // Pop-up blocked: open the application page in this tab instead of doing nothing.
      window.location.assign(data.applyURL);
    }

    // The access token lasts 15 minutes. If it had expired, the server saw an anonymous
    // click and did not touch the tracker. Reading the tracker triggers the silent token
    // refresh, after which we record the application ourselves — never downgrading a later stage.
    if (!data.tracked && getUser()) {
      try {
        const { data: t } = await api.get<{ items: TrackerItem[] }>('/tracker');
        const existing = t.items.find((i) => i.opportunityId === oppId);
        if (!existing || existing.status === 'saved') {
          await api.put(`/tracker/${oppId}`, { status: 'applied' });
        }
      } catch { /* the click itself already succeeded */ }
    }
    return data;
  } catch (err) {
    win?.close();
    throw err;
  }
}

// ─── Hook ────────────────────────────────────────────────────────────────────

/** The signed-in user's tracker, plus helpers to change it. Empty for guests. */
export function useTracker() {
  const [items, setItems] = useState<TrackerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);

  const reload = useCallback(async () => {
    if (!getUser()) {
      setItems([]);
      setLoggedIn(false);
      setLoading(false);
      return;
    }
    setLoggedIn(true);
    try {
      const { data } = await api.get<{ items: TrackerItem[] }>('/tracker');
      setItems(data.items ?? []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const byOpp = useMemo(() => new Map(items.map((i) => [i.opportunityId, i])), [items]);

  const save = useCallback(async (oppId: number) => {
    await api.put(`/tracker/${oppId}`, {});
    await reload();
  }, [reload]);

  const setStatus = useCallback(async (oppId: number, status: AppStatus) => {
    await api.put(`/tracker/${oppId}`, { status });
    await reload();
  }, [reload]);

  const setNote = useCallback(async (oppId: number, note: string) => {
    await api.put(`/tracker/${oppId}`, { note });
    await reload();
  }, [reload]);

  const remove = useCallback(async (oppId: number) => {
    await api.delete(`/tracker/${oppId}`);
    await reload();
  }, [reload]);

  return { items, byOpp, loading, loggedIn, reload, save, setStatus, setNote, remove };
}
