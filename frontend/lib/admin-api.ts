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
  isVerified: boolean;
  isActive?: boolean;
  source?: string;
  externalId?: string;
  opportunities?: AdminOpportunity[];
}

export interface AdminOpportunity {
  id: number;
  type: 'internship' | 'vacancy' | 'job' | 'grant';
  title: string;
  description: string;
  requirements: string;
  apply_url: string;
  source_url?: string;
  level: string;
  salary_min: number;
  salary_max: number;
  salary_currency: string;
  work_format: string;
  city: string;
  country?: string;
  deadline: string | null;
  is_year_round: boolean;
  is_verified: boolean;
  is_active?: boolean;
  needs_review?: boolean;
  source: string;
  external_id?: string;
}

export interface AdminSchool {
  id: number;
  name: string;
  type: string;
  country: string;
  description: string;
  cover_url: string;
  is_state_funded: boolean;
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
  is_verified: boolean;
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
export const updateAdminOpportunity = (id: number, body: Omit<AdminOpportunity, 'id'>) =>
  adminApi.put(`/admin/opportunities/${id}`, body);
export const deleteAdminOpportunity = (id: number) => adminApi.delete(`/admin/opportunities/${id}`);

// Review queue
export const fetchReviewQueue = async (limit = 50, offset = 0): Promise<{ opportunities: AdminOpportunity[]; total: number }> => {
  const { data } = await adminApi.get('/admin/opportunities', { params: { needs_review: 'true', limit, offset } });
  return { opportunities: data.opportunities ?? [], total: data.total ?? 0 };
};
export const approveOpportunity = (id: number, updates?: { title?: string; type?: string; level?: string; work_format?: string; is_verified?: boolean }) =>
  adminApi.put(`/admin/opportunities/${id}/approve`, updates ?? {});
export const rejectOpportunity = (id: number) =>
  adminApi.put(`/admin/opportunities/${id}/reject`, {});

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
export const updateAdminStack = (id: number, body: { name: string; popularity: number; is_trending: boolean }) =>
  adminApi.put(`/admin/stacks/${id}`, body);
export const deleteAdminStack = (id: number) => adminApi.delete(`/admin/stacks/${id}`);

// Hackathons
export interface AdminHackathon {
  id: number;
  title: string;
  description: string;
  organizer: string;
  location: string;
  is_online: boolean;
  prize_pool: string;
  register_url: string;
  website_url: string;
  tech_stack: string;
  registration_deadline: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
}

export const fetchAdminHackathons = async (): Promise<AdminHackathon[]> => {
  const { data } = await adminApi.get('/admin/hackathons');
  return data.hackathons ?? [];
};
export const createAdminHackathon = (body: Omit<AdminHackathon, 'id'>) =>
  adminApi.post('/admin/hackathons', body);
export const updateAdminHackathon = (id: number, body: Omit<AdminHackathon, 'id'>) =>
  adminApi.put(`/admin/hackathons/${id}`, body);
export const deleteAdminHackathon = (id: number) => adminApi.delete(`/admin/hackathons/${id}`);

// Reviews moderation
export interface AdminReview {
  id: number;
  company_id: number;
  user_id: number;
  author_name: string;
  status: 'pending' | 'approved' | 'rejected';
  is_anonymous: boolean;
  employment_type: string;
  pros: string;
  cons: string;
  overall_rating: number;
  created_at: string;
}

export const fetchAdminReviews = async (status = 'pending'): Promise<AdminReview[]> => {
  const { data } = await adminApi.get('/admin/reviews', { params: { status } });
  return data.reviews ?? [];
};
export const approveAdminReview = (id: number) => adminApi.put(`/admin/reviews/${id}/approve`);
export const rejectAdminReview = (id: number) => adminApi.put(`/admin/reviews/${id}/reject`);

// Users
export interface AdminUser {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  role: string;
  company_id: number | null;
  school_id: number | null;
  created_at: string;
}
export const fetchAdminUsers = async (): Promise<AdminUser[]> => {
  const { data } = await adminApi.get('/admin/users');
  return data.users ?? [];
};

// Owner Requests
export interface AdminOwnerRequest {
  id: number;
  createdAt: string;
  userId: number;
  entityType: string;
  entityId: number;
  message: string;
  status: string;
  adminNotes: string;
  userEmail: string;
  userName: string;
  entityName: string;
}
export const fetchAdminOwnerRequests = async (status = 'pending'): Promise<AdminOwnerRequest[]> => {
  const { data } = await adminApi.get('/admin/owner-requests', { params: { status } });
  return data.requests ?? [];
};
export const approveOwnerRequest = (id: number) => adminApi.put(`/admin/owner-requests/${id}/approve`);
export const rejectOwnerRequest = (id: number, notes?: string) =>
  adminApi.put(`/admin/owner-requests/${id}/reject`, { notes });

// User role management
export const setUserRole = (userId: number, body: { role: string; company_id?: number; school_id?: number }) =>
  adminApi.put(`/admin/users/${userId}/role`, body);

// Audit Log
export interface AuditLogEntry {
  id: number;
  created_at: string;
  user_id: number;
  user_email: string;
  action: string;
  entity: string;
  entity_id: number;
  details?: string;
  ip?: string;
}
export const fetchAuditLog = async (page = 1, entity?: string, action?: string): Promise<{ logs: AuditLogEntry[]; total: number }> => {
  const { data } = await adminApi.get('/admin/audit-log', { params: { page, entity, action } });
  return { logs: data.logs ?? [], total: data.total ?? 0 };
};

// ─── CMS: Types ───────────────────────────────────────────────────────────────

export interface EntityBadge {
  id: number;
  entityType: string;
  entityId: number;
  icon: string;       // predefined slug or emoji
  label: string;
  colorLight: string; // hex e.g. "#2563eb"
  colorDark: string;  // hex e.g. "#3b82f6"
  sortOrder: number;
  createdAt: string;
}

export interface EntityTheme {
  id?: number;
  entityType: string;
  entityId: number;
  accentLight: string;
  accentDark: string;
  coverGradient: 'none' | 'top' | 'overlay' | 'blur';
}

export interface AdminShowcaseItem {
  id: number;
  type: 'internship' | 'event' | 'vacancy' | 'news';
  title: string;
  description?: string;
  imageURL?: string;
  linkURL?: string;
  sortOrder: number;
}

export interface AdminPhoto {
  id: number;
  url: string;
  caption?: string;
  sortOrder: number;
}

export interface AdminOffice {
  id: number;
  city: string;
  country: string;
  address?: string;
  isHQ: boolean;
}

export interface AdminHRContact {
  id: number;
  name: string;
  position?: string;
  telegram?: string;
  linkedin?: string;
  note?: string;
}

export interface AdminCompanyFull extends AdminCompany {
  logoURL?: string;
  about?: string;
  foundedYear?: number;
  employeeCount?: string;
  industry?: string;
  stack?: { id: number; name: string }[];
  offices?: AdminOffice[];
  photos?: AdminPhoto[];
  showcase?: AdminShowcaseItem[];
  hrContacts?: AdminHRContact[];
  hrContent?: { id: number; title: string; type: string; url?: string; authorName: string }[];
}

// Predefined badge configs
export const PREDEFINED_BADGES = [
  { icon: 'verified',    label: 'Верифицировано',    colorLight: '#059669', colorDark: '#10b981' },
  { icon: '⭐',           label: 'Топ работодатель',  colorLight: '#d97706', colorDark: '#f59e0b' },
  { icon: '🤝',           label: 'Партнёр Jarlyq',   colorLight: '#7c3aed', colorDark: '#8b5cf6' },
  { icon: '🏛',           label: 'Государственный',  colorLight: '#475569', colorDark: '#94a3b8' },
  { icon: '🔥',           label: 'В тренде',         colorLight: '#dc2626', colorDark: '#f87171' },
  { icon: '✨',           label: 'Новое',            colorLight: '#0284c7', colorDark: '#38bdf8' },
  { icon: '💼',           label: 'Активно нанимает', colorLight: '#0891b2', colorDark: '#22d3ee' },
  { icon: '🎓',           label: 'Есть стипендии',   colorLight: '#2563eb', colorDark: '#3b82f6' },
] as const;

// ─── CMS: Single Company ──────────────────────────────────────────────────────

export const fetchAdminCompany = async (id: number): Promise<{ company: AdminCompanyFull; badges: EntityBadge[]; theme: EntityTheme }> => {
  const { data } = await adminApi.get(`/admin/companies/${id}`);
  return data;
};

export const setCompanyStacks = (companyId: number, stackIds: number[]) =>
  adminApi.put(`/admin/companies/${companyId}/stacks`, { stack_ids: stackIds });

// ─── CMS: Showcase ────────────────────────────────────────────────────────────

export const createShowcase = (companyId: number, body: Omit<AdminShowcaseItem, 'id'>) =>
  adminApi.post(`/admin/companies/${companyId}/showcase`, body);
export const updateShowcase = (id: number, body: Omit<AdminShowcaseItem, 'id'>) =>
  adminApi.put(`/admin/showcase/${id}`, body);
export const deleteShowcase = (id: number) => adminApi.delete(`/admin/showcase/${id}`);

// ─── CMS: Photos ─────────────────────────────────────────────────────────────

export const createPhoto = (companyId: number, body: Omit<AdminPhoto, 'id'>) =>
  adminApi.post(`/admin/companies/${companyId}/photos`, {
    url: body.url, caption: body.caption, sort_order: body.sortOrder,
  });
export const updatePhoto = (id: number, body: Omit<AdminPhoto, 'id'>) =>
  adminApi.put(`/admin/photos/${id}`, { url: body.url, caption: body.caption, sort_order: body.sortOrder });
export const deletePhoto = (id: number) => adminApi.delete(`/admin/photos/${id}`);

// ─── CMS: Offices ─────────────────────────────────────────────────────────────

export const createOffice = (companyId: number, body: Omit<AdminOffice, 'id'>) =>
  adminApi.post(`/admin/companies/${companyId}/offices`, {
    city: body.city, country: body.country, address: body.address, is_hq: body.isHQ,
  });
export const updateOffice = (id: number, body: Omit<AdminOffice, 'id'>) =>
  adminApi.put(`/admin/offices/${id}`, { city: body.city, country: body.country, address: body.address, is_hq: body.isHQ });
export const deleteOffice = (id: number) => adminApi.delete(`/admin/offices/${id}`);

// ─── CMS: HR Contacts ────────────────────────────────────────────────────────

export const createHRContact = (companyId: number, body: Omit<AdminHRContact, 'id'>) =>
  adminApi.post(`/admin/companies/${companyId}/hr-contacts`, body);
export const updateHRContact = (id: number, body: Omit<AdminHRContact, 'id'>) =>
  adminApi.put(`/admin/hr-contacts/${id}`, body);
export const deleteHRContact = (id: number) => adminApi.delete(`/admin/hr-contacts/${id}`);

// ─── CMS: Badges ─────────────────────────────────────────────────────────────

export const fetchBadges = async (entityType: string, entityId: number): Promise<EntityBadge[]> => {
  const { data } = await adminApi.get('/admin/badges', { params: { entity_type: entityType, entity_id: entityId } });
  return data.badges ?? [];
};
export const createBadge = (body: Omit<EntityBadge, 'id' | 'createdAt'>) =>
  adminApi.post('/admin/badges', {
    entity_type: body.entityType,
    entity_id: body.entityId,
    icon: body.icon,
    label: body.label,
    color_light: body.colorLight,
    color_dark: body.colorDark,
    sort_order: body.sortOrder,
  });
export const updateBadge = (id: number, body: Partial<Omit<EntityBadge, 'id' | 'createdAt'>>) =>
  adminApi.put(`/admin/badges/${id}`, {
    icon: body.icon, label: body.label,
    color_light: body.colorLight, color_dark: body.colorDark,
    sort_order: body.sortOrder,
  });
export const deleteBadge = (id: number) => adminApi.delete(`/admin/badges/${id}`);

// ─── CMS: Themes ─────────────────────────────────────────────────────────────

export const fetchTheme = async (entityType: string, entityId: number): Promise<EntityTheme> => {
  const { data } = await adminApi.get('/admin/themes', { params: { entity_type: entityType, entity_id: entityId } });
  return data;
};
export const upsertTheme = (body: EntityTheme) =>
  adminApi.put('/admin/themes', {
    entity_type: body.entityType,
    entity_id: body.entityId,
    accent_light: body.accentLight,
    accent_dark: body.accentDark,
    cover_gradient: body.coverGradient,
  });

// ─── CMS: Schools ─────────────────────────────────────────────────────────────

export interface AdminSchoolFull extends AdminSchool {
  logoURL?: string;
  about?: string;
  ageRange?: string;
  audience?: string;
  city?: string;
  isVerified?: boolean;
  courses?: AdminCourse[];
}

export interface AdminSchoolFullBody {
  name: string;
  type: string;
  country: string;
  city: string;
  description: string;
  about: string;
  age_range: string;
  audience: string;
  logo_url: string;
  cover_url: string;
  is_state_funded: boolean;
  is_verified: boolean;
  website: string;
  telegram: string;
  email: string;
}

export const fetchAdminSchool = async (id: number): Promise<{ school: AdminSchoolFull; badges: EntityBadge[]; theme: EntityTheme }> => {
  const { data } = await adminApi.get(`/admin/schools/${id}`);
  return data;
};

export const updateAdminSchoolFull = (id: number, body: AdminSchoolFullBody) =>
  adminApi.put(`/admin/schools/${id}/full`, body);

export const SCHOOL_TYPES = [
  { value: 'bootcamp',          label: 'Буткемп / Курсы' },
  { value: 'university',        label: 'Университет (локальный)' },
  { value: 'university_abroad', label: 'Университет (зарубежный)' },
  { value: 'state_program',     label: 'Государственная программа' },
  { value: 'center',            label: 'Образовательный центр' },
  { value: 'peer_learning',     label: 'Peer-to-peer обучение' },
] as const;

export const SCHOOL_PREDEFINED_BADGES = [
  { icon: 'verified',    label: 'Верифицировано',    colorLight: '#059669', colorDark: '#10b981' },
  { icon: '🎓',           label: 'Трудоустройство',   colorLight: '#2563eb', colorDark: '#3b82f6' },
  { icon: '🆓',           label: 'Бесплатно',        colorLight: '#059669', colorDark: '#10b981' },
  { icon: '🏛',           label: 'Гос. программа',   colorLight: '#475569', colorDark: '#94a3b8' },
  { icon: '🌍',           label: 'Онлайн',           colorLight: '#0284c7', colorDark: '#38bdf8' },
  { icon: '🏢',           label: 'Оффлайн',          colorLight: '#7c3aed', colorDark: '#8b5cf6' },
  { icon: '🎯',           label: '12–17 лет',        colorLight: '#d97706', colorDark: '#f59e0b' },
  { icon: '✨',           label: 'Стипендии',        colorLight: '#dc2626', colorDark: '#f87171' },
  { icon: '🤝',           label: 'Партнёр Jarlyq',   colorLight: '#7c3aed', colorDark: '#8b5cf6' },
] as const;

// ─── Resources ────────────────────────────────────────────────────────────────

export interface AdminResource {
  id: number;
  title: string;
  url: string;
  description?: string;
  category: string;
  subcategory?: string;
  isFree: boolean;
  language: string;
  difficulty?: string;
  countryFocus?: string;
  isActive: boolean;
  sortOrder: number;
}

export interface ResourceForm {
  title: string;
  url: string;
  description: string;
  category: string;
  subcategory: string;
  is_free: boolean;
  language: string;
  difficulty: string;
  country_focus: string;
  is_active: boolean;
  sort_order: number;
}

export const RESOURCE_CATEGORIES: { value: string; label: string }[] = [
  { value: 'courses',       label: 'Курсы и обучение' },
  { value: 'scholarships',  label: 'Стипендии и гранты' },
  { value: 'test_prep',     label: 'Подготовка к экзаменам' },
  { value: 'languages',     label: 'Изучение языков' },
  { value: 'certifications',label: 'Сертификации' },
  { value: 'security',      label: 'Информационная безопасность' },
  { value: 'communities',   label: 'Сообщества' },
  { value: 'career',        label: 'Карьера в IT' },
  { value: 'other',         label: 'Другое' },
];

export const fetchAdminResources = async (): Promise<AdminResource[]> => {
  const { data } = await adminApi.get('/admin/resources');
  return data.resources ?? [];
};
export const createAdminResource = (body: ResourceForm) =>
  adminApi.post('/admin/resources', body);
export const updateAdminResource = (id: number, body: ResourceForm) =>
  adminApi.put(`/admin/resources/${id}`, body);
export const deleteAdminResource = (id: number) =>
  adminApi.delete(`/admin/resources/${id}`);

