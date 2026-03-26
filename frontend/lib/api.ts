import axios from 'axios';

// Use relative URL by default so requests go through Next.js proxy (no CORS, no mixed-content)
// Override with NEXT_PUBLIC_API_URL only in local dev (http://localhost:8080/api/v1)
const baseURL = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

export const api = axios.create({
  baseURL,
});

// Silent refresh interceptor — runs only in browser
if (typeof window !== 'undefined') {
  let isRefreshing = false;
  let queue: Array<(token: string) => void> = [];

  api.interceptors.response.use(
    (res) => res,
    async (error) => {
      const original = error.config;

      // Only intercept 401s that aren't the refresh endpoint itself
      if (error.response?.status !== 401 || original._retry || original.url?.includes('/auth/')) {
        return Promise.reject(error);
      }

      const { getRefreshToken, saveAuth, clearAuth } = await import('./auth');
      const refreshToken = getRefreshToken();

      if (!refreshToken) {
        clearAuth();
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // Queue requests while refresh is in flight
        return new Promise((resolve) => {
          queue.push((token) => {
            original.headers['Authorization'] = `Bearer ${token}`;
            resolve(api(original));
          });
        });
      }

      original._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post(`${baseURL}/auth/refresh`, { refresh_token: refreshToken });
        saveAuth(data.access_token, data.refresh_token, data.user);
        api.defaults.headers.common['Authorization'] = `Bearer ${data.access_token}`;
        queue.forEach((cb) => cb(data.access_token));
        queue = [];
        original.headers['Authorization'] = `Bearer ${data.access_token}`;
        return api(original);
      } catch {
        clearAuth();
        queue = [];
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    }
  );
}

export interface Stack {
  id: number;
  name: string;
  popularity: number;
  isTrending?: boolean;
}

export interface ContactInfo {
  website?: string;
  telegram?: string;
  email?: string;
  phone?: string;
}

export interface CompanyOffice {
  id: number;
  city: string;
  country: string;
  address?: string;
  isHQ: boolean;
}

export interface CompanyPhoto {
  id: number;
  url: string;
  caption?: string;
  sortOrder: number;
}

export interface CompanyShowcase {
  id: number;
  type: 'internship' | 'event' | 'vacancy' | 'news';
  title: string;
  description?: string;
  imageURL?: string;
  linkURL?: string;
  sortOrder: number;
}

export interface Company {
  id: number;
  name: string;
  coverURL?: string;
  logoURL?: string;
  description?: string;
  about?: string;
  foundedYear?: number;
  employeeCount?: string;
  industry?: string;
  contacts?: ContactInfo;
  widgets: {
    trainingEnabled: boolean;
    internshipEnabled: boolean;
    vacancyEnabled: boolean;
  };
  opportunities: Opportunity[];
  stack?: Stack[];
  offices?: CompanyOffice[];
  photos?: CompanyPhoto[];
  showcase?: CompanyShowcase[];
  reviews?: CompanyReview[];
  hrContacts?: HRContact[];
  hrContent?: HRContent[];
}

export interface CompanyReview {
  id: number;
  companyId: number;
  status: 'pending' | 'approved' | 'rejected';
  isAnonymous: boolean;
  authorName?: string;
  createdAt: string;
  rating: number;
  title: string;
  reviewText: string;
  helpfulCount: number;
  workLifeBalance: number;
  salaryRating: number;
  growthRating: number;
  cultureRating: number;
  employmentType?: string;
  position?: string;
  yearsWorked?: number;
}

export interface Opportunity {
  id: number;
  type: 'internship' | 'vacancy';
  title: string;
  level: string;
  applyURL?: string;
  description?: string;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  workFormat?: string;
  city?: string;
  deadline?: string;
  isYearRound?: boolean;
  source?: string;
  isVerified?: boolean;
}

export interface InternshipItem extends Opportunity {
  companyName: string;
  companyLogoURL?: string;
  companyId: number;
}

export interface HRContact {
  id: number;
  companyId: number;
  name: string;
  position?: string;
  telegram?: string;
  linkedin?: string;
  note?: string;
}

export interface HRContent {
  id: number;
  companyId: number;
  authorName: string;
  authorPos?: string;
  type: 'article' | 'tip' | 'speech' | 'video';
  title: string;
  url?: string;
  description?: string;
  publishedAt?: string;
}

export interface Hackathon {
  id: number;
  title: string;
  description?: string;
  organizer?: string;
  location?: string;
  isOnline: boolean;
  prizePool?: string;
  registerURL?: string;
  websiteURL?: string;
  techStack?: string;
  registrationDeadline?: string;
  startDate?: string;
  endDate?: string;
  isActive: boolean;
}

export interface UserExtProfile {
  id: number;
  userId: number;
  avatarURL?: string;
  city?: string;
  githubURL?: string;
  linkedinURL?: string;
  instagramURL?: string;
}

export interface UserExperience {
  id: number;
  companyName: string;
  position: string;
  startDate: string;
  endDate?: string;
  isCurrent: boolean;
  description?: string;
}

export interface UserSkill {
  id: number;
  stackId: number;
  stack: Stack;
  level: 'beginner' | 'intermediate' | 'expert';
}

export interface School {
  id: number;
  name: string;
  coverURL?: string;
  description?: string;
  contacts?: ContactInfo;
  courses: Course[];
}

export interface Course {
  id: number;
  title: string;
  description?: string;
  externalURL?: string;
  price?: number;
  priceCurrency?: string;
  durationWeeks?: number;
  format?: string;
  hasEmployment?: boolean;
}

export interface CertificateResponse {
  certificate: {
    code: string;
    issuerName: string;
    issuerType: string;
    type: string;
    recipient: string;
    issuedDate: string;
    expiryDate?: string | null;
    metadata?: string;
  };
}

export interface RegionOption {
  id: number;
  name: string;
}

export const regions: RegionOption[] = [
  { id: 1, name: 'Казахстан' },
  { id: 2, name: 'Кыргызстан' },
  { id: 3, name: 'Узбекистан' },
  { id: 4, name: 'EMEA' }
];

// Phase 2: Career Paths
export interface CareerPath {
  id: number;
  title: string;
  description: string;
  icon: string;
  duration: number;
  difficulty: string;
  completedBy: number;
  stages?: PathStage[];
}

export interface PathStage {
  id: number;
  careerPathId: number;
  order: number;
  title: string;
  description: string;
  durationDays: number;
  milestone: string;
  badge: string;
}

// Phase 2: Interview Questions
export interface InterviewQuestion {
  id: number;
  question: string;
  answer: string;
  explanation: string;
  level: string;
  topic: string;
  timesAsked: number;
  successRate: number;
  difficulty: number;
}

// Phase 2: Jobs
export interface Job {
  id: number;
  companyId: number;
  title: string;
  description: string;
  level: string;
  jobType: string;
  location: string;
  countries: string;
  salaryMin: number;
  salaryMax: number;
  salaryCurrency: string;
  workFormat: string;
  yearsExperience: number;
  requirements: string;
  applicationURL: string;
  applicationEmail: string;
  views: number;
  applications: number;
}

// Phase 2: Project Ideas for Portfolio
export interface ProjectIdea {
  id: number;
  title: string;
  description: string;
  direction: string;
  difficulty: string;
  duration: string;
  techStack: string;
  skills: string;
  features: string;
  whyGood: string;
  exampleURL: string;
  likes: number;
  completedBy: number;
}

