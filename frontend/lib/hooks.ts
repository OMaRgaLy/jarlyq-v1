import { useQuery } from '@tanstack/react-query';
import { api, Company, School, Stack, CareerPath, InterviewQuestion, Job, ProjectIdea } from './api';

export const useCompany = (id: number) =>
  useQuery<Company>({
    queryKey: ['company', id],
    queryFn: async () => {
      const { data } = await api.get<{ company: Company }>(`/companies/${id}`);
      return data.company;
    },
    enabled: id > 0,
  });

export const useSchool = (id: number) =>
  useQuery<School>({
    queryKey: ['school', id],
    queryFn: async () => {
      const { data } = await api.get<{ school: School }>(`/schools/${id}`);
      return data.school;
    },
    enabled: id > 0,
  });

export const useStacks = () =>
  useQuery<Stack[]>({
    queryKey: ['stacks'],
    queryFn: async () => {
      const { data } = await api.get<{ stacks: Stack[] }>('/stacks');
      return data.stacks;
    }
  });

export const useCompanies = (params: Record<string, unknown>) =>
  useQuery<Company[]>({
    queryKey: ['companies', params],
    queryFn: async () => {
      const { data } = await api.get<{ companies: Company[] }>('/companies', { params });
      return data.companies;
    }
  });

export const useSchools = (params: Record<string, unknown>) =>
  useQuery<School[]>({
    queryKey: ['schools', params],
    queryFn: async () => {
      const { data } = await api.get<{ schools: School[] }>('/schools', { params });
      return data.schools;
    }
  });

// Phase 2 hooks

export const useCareerPaths = () =>
  useQuery<CareerPath[]>({
    queryKey: ['career-paths'],
    queryFn: async () => {
      const { data } = await api.get<{ data: CareerPath[] }>('/career-paths');
      return data.data;
    }
  });

export const useCareerPath = (id: number) =>
  useQuery<CareerPath>({
    queryKey: ['career-path', id],
    queryFn: async () => {
      const { data } = await api.get<{ data: CareerPath }>(`/career-paths/${id}`);
      return data.data;
    },
    enabled: id > 0
  });

export const useInterviewQuestions = (params?: { level?: string; topic?: string }) =>
  useQuery<InterviewQuestion[]>({
    queryKey: ['interview-questions', params],
    queryFn: async () => {
      const { data } = await api.get<{ data: InterviewQuestion[] }>('/interview-questions', { params });
      return data.data;
    }
  });

export const useInterviewTopics = () =>
  useQuery<string[]>({
    queryKey: ['interview-topics'],
    queryFn: async () => {
      const { data } = await api.get<{ data: string[] }>('/interview-questions/topics');
      return data.data;
    }
  });

export const useJobs = (params?: { level?: string; location?: string; type?: string }) =>
  useQuery<Job[]>({
    queryKey: ['jobs', params],
    queryFn: async () => {
      const { data } = await api.get<{ data: Job[] }>('/jobs', { params });
      return data.data;
    }
  });

export const usePopularJobs = (limit = 10) =>
  useQuery<Job[]>({
    queryKey: ['jobs-popular', limit],
    queryFn: async () => {
      const { data } = await api.get<{ data: Job[] }>('/jobs/popular', { params: { limit } });
      return data.data;
    }
  });

// Project Ideas hooks

export const useProjectIdeas = (params?: { direction?: string; difficulty?: string }) =>
  useQuery<ProjectIdea[]>({
    queryKey: ['project-ideas', params],
    queryFn: async () => {
      const { data } = await api.get<{ data: ProjectIdea[] }>('/project-ideas', { params });
      return data.data;
    }
  });

export const useProjectDirections = () =>
  useQuery<string[]>({
    queryKey: ['project-directions'],
    queryFn: async () => {
      const { data } = await api.get<{ data: string[] }>('/project-ideas/directions');
      return data.data;
    }
  });

export const usePopularProjectIdeas = (limit = 10) =>
  useQuery<ProjectIdea[]>({
    queryKey: ['project-ideas-popular', limit],
    queryFn: async () => {
      const { data } = await api.get<{ data: ProjectIdea[] }>('/project-ideas/popular', { params: { limit } });
      return data.data;
    }
  });
