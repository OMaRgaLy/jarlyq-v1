import { api, Company, School, Opportunity, Course, HRContact, OwnerRequest } from './api';

// ─── Owner Requests ──────────────────────────────────────────────────────────

export async function createOwnerRequest(input: {
  entity_type: string;
  entity_id: number;
  message?: string;
}): Promise<OwnerRequest> {
  const { data } = await api.post('/dashboard/owner-requests', input);
  return data.request;
}

export async function fetchMyOwnerRequests(): Promise<OwnerRequest[]> {
  const { data } = await api.get('/dashboard/owner-requests/mine');
  return data.requests;
}

// ─── Company Owner Dashboard ─────────────────────────────────────────────────

export async function fetchDashboardCompany(): Promise<Company> {
  const { data } = await api.get('/dashboard/company');
  return data.company;
}

export async function updateDashboardCompany(input: Record<string, unknown>): Promise<Company> {
  const { data } = await api.put('/dashboard/company', input);
  return data.company;
}

export async function createDashboardOpportunity(input: Record<string, unknown>): Promise<Opportunity> {
  const { data } = await api.post('/dashboard/company/opportunities', input);
  return data.opportunity;
}

export async function updateDashboardOpportunity(id: number, input: Record<string, unknown>): Promise<Opportunity> {
  const { data } = await api.put(`/dashboard/company/opportunities/${id}`, input);
  return data.opportunity;
}

export async function deleteDashboardOpportunity(id: number): Promise<void> {
  await api.delete(`/dashboard/company/opportunities/${id}`);
}

export async function createDashboardHRContact(input: Record<string, unknown>): Promise<HRContact> {
  const { data } = await api.post('/dashboard/company/hr-contacts', input);
  return data.contact;
}

export async function deleteDashboardHRContact(id: number): Promise<void> {
  await api.delete(`/dashboard/company/hr-contacts/${id}`);
}

// ─── School Owner Dashboard ──────────────────────────────────────────────────

export async function fetchDashboardSchool(): Promise<School> {
  const { data } = await api.get('/dashboard/school');
  return data.school;
}

export async function updateDashboardSchool(input: Record<string, unknown>): Promise<School> {
  const { data } = await api.put('/dashboard/school', input);
  return data.school;
}

export async function createDashboardCourse(input: Record<string, unknown>): Promise<Course> {
  const { data } = await api.post('/dashboard/school/courses', input);
  return data.course;
}

export async function updateDashboardCourse(id: number, input: Record<string, unknown>): Promise<Course> {
  const { data } = await api.put(`/dashboard/school/courses/${id}`, input);
  return data.course;
}

export async function deleteDashboardCourse(id: number): Promise<void> {
  await api.delete(`/dashboard/school/courses/${id}`);
}
