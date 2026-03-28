import { api } from './api';

const TOKEN_KEY = 'jarlyq_token';
const REFRESH_KEY = 'jarlyq_refresh_token';
const USER_KEY = 'jarlyq_user';

export interface AuthUser {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: string; // "user" | "company_owner" | "school_owner" | "partner" | "admin"
}

export function saveAuth(accessToken: string, refreshToken: string, user: AuthUser) {
  localStorage.setItem(TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_KEY, refreshToken);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(USER_KEY);
  delete api.defaults.headers.common['Authorization'];
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(REFRESH_KEY);
}

export function getUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

export async function googleLogin(idToken: string): Promise<AuthUser> {
  const { data } = await api.post('/auth/google', { token: idToken });
  saveAuth(data.access_token, data.refresh_token, data.user);
  return data.user;
}

export async function emailLogin(email: string, password: string): Promise<AuthUser> {
  const { data } = await api.post('/auth/login', { email, password });
  saveAuth(data.access_token, data.refresh_token, data.user);
  return data.user;
}

export async function emailRegister(
  email: string,
  password: string,
  first_name: string,
  last_name: string,
  terms_accepted = false,
): Promise<AuthUser> {
  const { data } = await api.post('/auth/register', { email, password, first_name, last_name, terms_accepted });
  saveAuth(data.access_token, data.refresh_token, data.user);
  return data.user;
}
