import { Category, Product } from '@/types';

export type CatalogSortOption =
  | 'default'
  | 'price_asc'
  | 'price_desc'
  | 'discount_desc'
  | 'newest';

export type CatalogQuickFilter =
  | 'all'
  | 'new'
  | 'discounted'
  | 'featured'
  | 'available';

export interface CatalogAdvancedFilters {
  sort: CatalogSortOption;
  quickFilter: CatalogQuickFilter;
  minPrice: string;
  maxPrice: string;
}

export const DEFAULT_CATALOG_FILTERS: CatalogAdvancedFilters = {
  sort: 'default',
  quickFilter: 'all',
  minPrice: '',
  maxPrice: '',
};

export interface CatalogFilter {
  branch_id: number;
  category_id?: number | null;
  search?: string;
  is_new?: boolean | 0 | 1;
  is_featured?: boolean | 0 | 1;
  is_coming_soon?: boolean | 0 | 1;
  per_page?: number;
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

