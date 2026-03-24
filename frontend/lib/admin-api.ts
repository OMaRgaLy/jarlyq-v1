import axios from 'axios';

const TOKEN_KEY = 'jarlyq_admin_token';

export const adminApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || '/api/v1',
  // No withCredentials — we use Authorization header, not cookies
});

adminApi.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export function saveAdminToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearAdminToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export function getAdminToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

// ─── Types ───────────────────────────────────────────────────────────────────

export interface AdminCompany {
  id: number;
  name: string;
  description: string;
  coverURL: string;
  contacts: { website: string; telegram: string; email: string };
  widgets: { trainingEnabled: boolean; internshipEnabled: boolean; vacancyEnabled: boolean };
  opportunities?: AdminOpportunity[];
}

export interface AdminOpportunity {
  id: number;
  type: 'internship' | 'vacancy';
  title: string;
  description: string;
  requirements: string;
  apply_url: string;
  level: string;
  salary_min: number;
  salary_max: number;
  salary_currency: string;
  work_format: string;
  city: string;
}

export interface AdminSchool {
  id: number;
  name: string;
  description: string;
  cover_url: string;
  website: string;
  telegram: string;
  email: string;
  courses?: AdminCourse[];
}

export interface AdminCourse {
  id: number;
  title: string;
  description: string;
  external_url: string;
  price: number;
  price_currency: string;
  duration_weeks: number;
  format: string;
  has_employment: boolean;
}

export interface AdminStack {
  id: number;
  name: string;
  popularity: number;
  is_trending: boolean;
}

// ─── API calls ───────────────────────────────────────────────────────────────

export const adminLogin = async (email: string, password: string) => {
  const { data } = await adminApi.post('/auth/login', { email, password });
  return data as { access_token: string; user: { email: string } };
};

// Company write body uses snake_case (what the backend form accepts)
export interface AdminCompanyBody {
  name: string;
  description: string;
  cover_url: string;
  logo_url: string;
  about: string;
  founded_year: number;
  employee_count: string;
  industry: string;
  website: string;
  telegram: string;
  email: string;
  training_enabled: boolean;
  internship_enabled: boolean;
  vacancy_enabled: boolean;
}

// Companies
export const fetchAdminCompanies = async (): Promise<AdminCompany[]> => {
  const { data } = await adminApi.get('/admin/companies');
  return data.companies;
};
export const createAdminCompany = (body: AdminCompanyBody) =>
  adminApi.post('/admin/companies', body);
export const updateAdminCompany = (id: number, body: AdminCompanyBody) =>
  adminApi.put(`/admin/companies/${id}`, body);
export const deleteAdminCompany = (id: number) => adminApi.delete(`/admin/companies/${id}`);

// Opportunities
export const createAdminOpportunity = (companyId: number, body: Omit<AdminOpportunity, 'id'>) =>
  adminApi.post(`/admin/companies/${companyId}/opportunities`, body);
export const deleteAdminOpportunity = (id: number) => adminApi.delete(`/admin/opportunities/${id}`);

// Schools
export const fetchAdminSchools = async (): Promise<AdminSchool[]> => {
  const { data } = await adminApi.get('/admin/schools');
  return data.schools;
};
export const createAdminSchool = (body: Omit<AdminSchool, 'id' | 'courses'>) =>
  adminApi.post('/admin/schools', body);
export const updateAdminSchool = (id: number, body: Omit<AdminSchool, 'id' | 'courses'>) =>
  adminApi.put(`/admin/schools/${id}`, body);
export const deleteAdminSchool = (id: number) => adminApi.delete(`/admin/schools/${id}`);

// Courses
export const createAdminCourse = (schoolId: number, body: Omit<AdminCourse, 'id'>) =>
  adminApi.post(`/admin/schools/${schoolId}/courses`, body);
export const updateAdminCourse = (id: number, body: Omit<AdminCourse, 'id'>) =>
  adminApi.put(`/admin/courses/${id}`, body);
export const deleteAdminCourse = (id: number) => adminApi.delete(`/admin/courses/${id}`);

// Stacks
export const fetchAdminStacks = async (): Promise<AdminStack[]> => {
  const { data } = await adminApi.get('/admin/stacks');
  return data.stacks;
};
export const createAdminStack = (body: { name: string; popularity: number; is_trending: boolean }) =>
  adminApi.post('/admin/stacks', body);
export const deleteAdminStack = (id: number) => adminApi.delete(`/admin/stacks/${id}`);
