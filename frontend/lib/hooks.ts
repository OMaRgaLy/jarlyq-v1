import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, Company, School, Stack, CareerPath, InterviewQuestion, Job, ProjectIdea, CompanyReview, MasterProgram, InternshipItem, UserFavorite } from './api';

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

export const useInternship = (id: number) =>
  useQuery<InternshipItem>({
    queryKey: ['internship', id],
    queryFn: async () => {
      const { data } = await api.get<{ internship: InternshipItem }>(`/internships/${id}`);
      return data.internship;
    },
    enabled: id > 0,
  });

export const useJob = (id: number) =>
  useQuery<InternshipItem>({
    queryKey: ['job', id],
    queryFn: async () => {
      const { data } = await api.get<{ opportunity: InternshipItem }>(`/internships/${id}`);
      return data.opportunity;
    },
    enabled: id > 0,
  });

export const useMasterProgram = (id: number) =>
  useQuery<MasterProgram>({
    queryKey: ['master', id],
    queryFn: async () => {
      const { data } = await api.get<{ program: MasterProgram }>(`/masters/${id}`);
      return data.program;
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

export const useMasters = (params?: { country?: string; language?: string; scholarship?: boolean }) =>
  useQuery<MasterProgram[]>({
    queryKey: ['masters', params],
    queryFn: async () => {
      const { data } = await api.get<{ programs: MasterProgram[] }>('/masters', { params });
      return data.programs ?? [];
    },
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


// Favorites
export const useFavorites = (type?: string) =>
  useQuery<UserFavorite[]>({
    queryKey: ['favorites', type],
    queryFn: async () => {
      const { data } = await api.get<{ favorites: UserFavorite[] }>('/favorites', { params: type ? { type } : {} });
      return data.favorites ?? [];
    },
  });

export const useIsFavorite = (entityType: string, entityId: number) =>
  useQuery<boolean>({
    queryKey: ['favorite-check', entityType, entityId],
    queryFn: async () => {
      const { data } = await api.get<{ isFavorite: boolean }>(`/favorites/check/${entityType}/${entityId}`);
      return data.isFavorite;
    },
    enabled: entityId > 0,
  });

export const useToggleFavorite = () => {
  const qc = useQueryClient();
  const add = useMutation({
    mutationFn: async ({ entityType, entityId }: { entityType: string; entityId: number }) => {
      await api.post('/favorites', { entity_type: entityType, entity_id: entityId });
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['favorites'] });
      qc.setQueryData(['favorite-check', vars.entityType, vars.entityId], true);
    },
  });
  const remove = useMutation({
    mutationFn: async ({ entityType, entityId }: { entityType: string; entityId: number }) => {
      await api.delete(`/favorites/${entityType}/${entityId}`);
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['favorites'] });
      qc.setQueryData(['favorite-check', vars.entityType, vars.entityId], false);
    },
  });
  return { add, remove };
};

export const useCompanyReviews = (companyId: number) =>
  useQuery<{ reviews: CompanyReview[]; total: number }>({
    queryKey: ['company-reviews', companyId],
    queryFn: async () => {
      const { data } = await api.get(`/companies/${companyId}/reviews`);
      return data;
    },
    enabled: companyId > 0,
  });
