import { Product } from '@/types';

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
  brand: string | null;
  minPrice: string;
  maxPrice: string;
}

export const DEFAULT_CATALOG_FILTERS: CatalogAdvancedFilters = {
  sort: 'default',
  quickFilter: 'all',
  brand: null,
  minPrice: '',
  maxPrice: '',
};

export interface CatalogFilter {
  branch_id: number;
  category_id?: number | null;
  brand?: string | null;
  search?: string;
  is_new?: boolean | 0 | 1;
  is_featured?: boolean | 0 | 1;
  is_coming_soon?: boolean | 0 | 1;
  on_sale?: boolean | 0 | 1;
  min_price?: number;
  max_price?: number;
  sort?: CatalogSortOption;
  per_page?: number;
  page?: number;
}

export interface CatalogBrandFacet {
  brand: string;
  count: number;
}

export interface CatalogBrandsResponse {
  brands: CatalogBrandFacet[];
  offers_count: number;
  total_count: number;
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
