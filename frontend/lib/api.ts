import axios from 'axios';

const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

export const api = axios.create({
  baseURL,
  withCredentials: true
});

export interface Stack {
  id: number;
  name: string;
  popularity: number;
}

export interface Company {
  id: number;
  name: string;
  coverURL?: string;
  description?: string;
  widgets: {
    trainingEnabled: boolean;
    internshipEnabled: boolean;
    vacancyEnabled: boolean;
  };
  opportunities: Opportunity[];
}

export interface Opportunity {
  id: number;
  type: 'internship' | 'vacancy';
  title: string;
  level: string;
  applyURL?: string;
  description?: string;
}

export interface School {
  id: number;
  name: string;
  description?: string;
  courses: Course[];
}

export interface Course {
  id: number;
  title: string;
  description?: string;
  externalURL?: string;
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

