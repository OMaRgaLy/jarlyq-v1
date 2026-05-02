import { api } from './api';

// Only user data lives in localStorage — NOT tokens (they are httpOnly cookies now).
const USER_KEY = 'jarlyq_user';

export interface AuthUser {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: string; // "user" | "company_owner" | "school_owner" | "partner" | "admin"
}

/** Called after a successful login/register/refresh. Saves user to localStorage. */
export function saveAuth(_accessToken: string, _refreshToken: string, user: AuthUser) {
  // Tokens are httpOnly cookies set by the server — we never touch them from JS.
  // We only keep the user object for UI (name, role, etc.).
  if (typeof window !== 'undefined') {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }
}

/** Clears user from localStorage and asks the server to expire the auth cookies. */
export async function clearAuth() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(USER_KEY);
  }
  try {
    // Tell the server to clear the httpOnly cookies.
    await api.post('/auth/logout');
  } catch {
    // Ignore — cookies may already be expired.
  }
}

/** Returns a truthy value if the user appears to be logged in (user data present). */
export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  // We can't read the httpOnly access_token cookie from JS.
  // We use the presence of the cached user object as a "logged in" indicator.
  return localStorage.getItem(USER_KEY) ? 'cookie' : null;
}

/** @deprecated Not used with cookie auth — kept for compatibility. */
export function getRefreshToken(): string | null {
  return null;
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
