import { useQuery } from '@tanstack/react-query';
import { api, Company, School, Stack } from './api';

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
