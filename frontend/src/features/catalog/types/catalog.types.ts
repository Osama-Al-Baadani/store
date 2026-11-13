import { Category, Product } from '@/types';

export interface CatalogFilter {
  branch_id: number;
  category_id?: number | null;
  search?: string;
  is_new?: boolean;
  is_featured?: boolean;
  is_coming_soon?: boolean;
  page?: number;
}

export interface CatalogResponse {
  items: Product[];
  pagination: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

