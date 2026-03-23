import { api } from './api';

const TOKEN_KEY = 'jarlyq_token';
const USER_KEY = 'jarlyq_user';

export interface AuthUser {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
}

export function saveAuth(token: string, user: AuthUser) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  delete api.defaults.headers.common['Authorization'];
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

export async function googleLogin(idToken: string): Promise<AuthUser> {
  const { data } = await api.post('/auth/google', { token: idToken });
  saveAuth(data.access_token, data.user);
  return data.user;
}

export async function emailLogin(email: string, password: string): Promise<AuthUser> {
  const { data } = await api.post('/auth/login', { email, password });
  saveAuth(data.access_token, data.user);
  return data.user;
}

export async function emailRegister(
  email: string,
  password: string,
  first_name: string,
  last_name: string,
): Promise<AuthUser> {
  const { data } = await api.post('/auth/register', { email, password, first_name, last_name });
  saveAuth(data.access_token, data.user);
  return data.user;
}
