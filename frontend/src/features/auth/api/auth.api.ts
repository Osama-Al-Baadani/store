import { apiClient } from '@/shared/lib/axios';
import { ApiResponse, User } from '@/types';
import { LoginCredentials, RegisterCredentials } from '../types/auth.types';

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<ApiResponse<User>> => {
    const { data } = await apiClient.post<ApiResponse<User>>('/auth/login', credentials);
    return data;
  },

  register: async (credentials: RegisterCredentials): Promise<ApiResponse<User>> => {
    const formData = new FormData();
    Object.entries(credentials).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, value);
      }
    });

    const { data } = await apiClient.post<ApiResponse<User>>('/auth/register', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  getMe: async (): Promise<ApiResponse<User>> => {
    const { data } = await apiClient.get<ApiResponse<User>>('/auth/me');
    return data;
  },

  logout: async (): Promise<ApiResponse<null>> => {
    const { data } = await apiClient.post<ApiResponse<null>>('/auth/logout');
    return data;
  },

  simulateApproval: async (): Promise<ApiResponse<User>> => {
    const { data } = await apiClient.post<ApiResponse<User>>('/auth/simulate-approval');
    return data;
  },
};

