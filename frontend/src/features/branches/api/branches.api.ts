import { apiClient } from '@/shared/lib/axios';
import { ApiResponse, Branch } from '@/types';

export const branchesApi = {
  getBranches: async (): Promise<ApiResponse<Branch[]>> => {
    const { data } = await apiClient.get<ApiResponse<Branch[]>>('/branches');
    return data;
  },

  getBranchById: async (id: number): Promise<ApiResponse<Branch>> => {
    const { data } = await apiClient.get<ApiResponse<Branch>>(`/branches/${id}`);
    return data;
  },
};

