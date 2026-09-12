// pipeline-api.ts — клиент для Jarlyq Pipeline Server (порт 8082)

const PIPELINE_URL = process.env.NEXT_PUBLIC_PIPELINE_URL || 'http://localhost:8082';

export interface PipelineSource {
  id: string;
  label: string;
  entity: 'companies' | 'schools' | 'vacancies';
}

export interface PipelineJob {
  id: string;
  source: string;
  countries: string;
  status: 'pending' | 'running' | 'done' | 'error' | 'cancelled';
  started_at: string | null;
  finished_at: string | null;
  records_found: number;
  error: string | null;
}

export interface StagingRecord {
  id: string;
  job_id: string | null;
  entity: string;
  source: string;
  external_id: string | null;
  data: Record<string, unknown>;
  ai_data: Record<string, unknown> | null;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  reviewed_at: string | null;
}

export interface AIProvider {
  id: string;
  name: string;
  configured: boolean;
  active: boolean;
  free: boolean;
  note: string;
}

export interface PipelineStatus {
  status: string;
  staging_pending: number;
  total_jobs: number;
  ai_provider: string;
  groq_configured: boolean;
  gemini_configured: boolean;
  ollama_configured: boolean;
  github_configured: boolean;
  telegram_configured: boolean;
}

async function pipelineRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const resp = await fetch(`${PIPELINE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Pipeline API ${resp.status}: ${text}`);
  }
  return resp.json();
}

// ── Status ────────────────────────────────────────────────────────────────────

export function fetchPipelineStatus(): Promise<PipelineStatus> {
  return pipelineRequest('/');
}

// ── Sources & Countries ───────────────────────────────────────────────────────

export function fetchSources(): Promise<PipelineSource[]> {
  return pipelineRequest('/pipeline/sources');
}

export function fetchCountries(): Promise<{ code: string; name: string }[]> {
  return pipelineRequest('/pipeline/countries');
}

// ── Jobs ──────────────────────────────────────────────────────────────────────

export function fetchJobs(limit = 30): Promise<PipelineJob[]> {
  return pipelineRequest(`/pipeline/jobs?limit=${limit}`);
}

export function fetchJob(id: string): Promise<PipelineJob> {
  return pipelineRequest(`/pipeline/jobs/${id}`);
}

export function startJob(
  source: string,
  countries: string[],
  dry_run = false,
): Promise<{ job_id: string; status: string }> {
  return pipelineRequest('/pipeline/run', {
    method: 'POST',
    body: JSON.stringify({ source, countries, dry_run }),
  });
}

export function cancelJob(id: string): Promise<{ status: string }> {
  return pipelineRequest(`/pipeline/jobs/${id}/cancel`, { method: 'POST' });
}

export function jobLogsWS(id: string): WebSocket {
  const wsUrl = PIPELINE_URL.replace(/^http/, 'ws');
  return new WebSocket(`${wsUrl}/pipeline/jobs/${id}/logs`);
}

// ── Staging ───────────────────────────────────────────────────────────────────

export function fetchStaging(params: {
  entity?: string;
  source?: string;
  status?: string;
  needs_review?: boolean;
  limit?: number;
  offset?: number;
}): Promise<{ total: number; records: StagingRecord[] }> {
  const q = new URLSearchParams();
  if (params.entity) q.set('entity', params.entity);
  if (params.source) q.set('source', params.source);
  if (params.status) q.set('status', params.status);
  if (params.needs_review != null) q.set('needs_review', String(params.needs_review));
  if (params.limit) q.set('limit', String(params.limit));
  if (params.offset) q.set('offset', String(params.offset));
  return pipelineRequest(`/staging/records?${q}`);
}

export function updateStagingRecord(
  id: string,
  data: Record<string, unknown>,
): Promise<{ status: string }> {
  return pipelineRequest(`/staging/records/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ data }),
  });
}

export function enrichStagingRecord(
  id: string,
): Promise<{ status: string; ai_data: Record<string, unknown> }> {
  return pipelineRequest(`/staging/records/${id}/enrich`, { method: 'POST' });
}

export function approveRecords(
  ids: string[],
): Promise<{ approved: string[]; errors: { id: string; error: string }[] }> {
  return pipelineRequest('/staging/approve', {
    method: 'POST',
    body: JSON.stringify({ ids }),
  });
}

export function deleteRecord(id: string): Promise<{ status: string }> {
  return pipelineRequest(`/staging/records/${id}`, { method: 'DELETE' });
}

// ── AI ────────────────────────────────────────────────────────────────────────

export function fetchProviders(): Promise<AIProvider[]> {
  return pipelineRequest('/ai/providers');
}

export function testProvider(provider: string): Promise<{ status: string }> {
  return pipelineRequest('/ai/providers/test', {
    method: 'POST',
    body: JSON.stringify({ provider }),
  });
}

// ── URL parser ────────────────────────────────────────────────────────────────

export function parseURL(
  url: string,
): Promise<{ record_id: string; data: Record<string, unknown> }> {
  return pipelineRequest('/parse-url', {
    method: 'POST',
    body: JSON.stringify({ url }),
  });
}

// ── Config ────────────────────────────────────────────────────────────────────

export function fetchEnvConfig(): Promise<
  Record<string, { set: boolean; preview: string }>
> {
  return pipelineRequest('/config/env');
}

export function updateEnvConfig(
  keys: Record<string, string>,
): Promise<{ status: string; updated: string[] }> {
  return pipelineRequest('/config/env', {
    method: 'PUT',
    body: JSON.stringify({ keys }),
  });
}

export function fetchChannels(): Promise<{
  channels: { username: string; country: string; lang: string; note: string }[];
  settings: Record<string, unknown>;
}> {
  return pipelineRequest('/config/channels');
}

export function updateChannels(
  channels: { username: string; country: string; lang: string; note: string }[],
  settings: Record<string, unknown>,
): Promise<{ status: string; count: number }> {
  return pipelineRequest('/config/channels', {
    method: 'PUT',
    body: JSON.stringify({ channels, settings }),
  });
}
