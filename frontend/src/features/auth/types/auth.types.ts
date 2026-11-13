import { User } from '@/types';

export interface LoginCredentials {
  phone: string;
  password: string;
}

export interface RegisterCredentials {
  company_name: string;
  cr_number: string;
  vat_number?: string;
  owner_name: string;
  phone: string;
  password: string;
  city: string;
  address?: string;
  email?: string;
  cr_document?: File;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

