import { apiClient } from '@/shared/lib/axios';
import { ApiResponse } from '@/types';

export interface AdminStats {
  merchants: {
    total: number;
    pending: number;
    active: number;
    suspended: number;
  };
  orders: {
    total: number;
    new?: number;
    active_carts?: number;
    revenue: number;
  };
  catalog: {
    products: number;
    branches: number;
  };
}

export interface MerchantItem {
  id: number;
  user_id: number;
  company_name: string;
  cr_number: string;
  vat_number: string;
  owner_name: string;
  city: string;
  address: string;
  status: 'pending' | 'active' | 'suspended' | 'rejected';
  customer_code: string;
  admin_note?: string;
  approved_at?: string;
  created_at: string;
  user?: {
    id: number;
    name: string;
    phone: string;
    email: string;
  };
}

export interface AdminOrder {
  id: number;
  order_number: string;
  subtotal?: number;
  vat_amount?: number;
  total: number;
  status: string;
  status_label?: string;
  items_count?: number;
  total_quantity?: number;
  notes?: string | null;
  invoice_pdf_url?: string;
  invoice_download_url?: string;
  created_at: string;
  branch?: {
    id: number;
    name: string;
  };
  user?: {
    id: number;
    name: string;
    phone: string;
    merchant_profile?: {
      company_name: string;
      customer_code: string;
    };
  };
  items?: Array<{
    id: number;
    product_name: string;
    sku?: string;
    unit_name?: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }>;
}

export interface AdminActiveCartItem {
  id: number;
  package_id: number;
  product_name: string;
  sku?: string;
  unit_name?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface AdminActiveCart {
  id: number;
  branch_id: number;
  branch?: {
    id: number;
    name: string;
  } | null;
  user?: {
    id: number;
    name: string;
    phone: string;
    merchant_profile?: {
      company_name: string;
      customer_code?: string;
    } | null;
  } | null;
  summary: {
    items_count: number;
    total_quantity: number;
    subtotal: number;
    vat_rate: number;
    vat_amount: number;
    total: number;
  };
  items: AdminActiveCartItem[];
  updated_at: string;
  created_at: string;
}

export interface ExtractedProductPayload {
  name: string;
  description: string;
  unit_price: string;
  code: string;
  code_source: 'extracted' | 'generated';
  image: string;
  source_url: string;
  ai_enhanced: boolean;
  gemini_configured?: boolean;
}

export interface ProductImportPreviewRow {
  row_number: number;
  status: 'create' | 'update' | 'skip' | 'error';
  error: string | null;
  name: string;
  code: string;
  unit_price: number | null;
  category: string;
  branch: string;
  image_source: 'embedded' | 'zip' | 'url' | 'none';
}

export interface ProductImportPreviewResponse {
  headers: string[];
  mapping: Record<string, number | null>;
  rows_count: number;
  embedded_images_count: number;
  zip_images_count: number;
  summary: {
    will_create: number;
    will_update: number;
    will_skip: number;
    errors: number;
  };
  rows: ProductImportPreviewRow[];
}

export interface ProductImportExecuteResult {
  created: number;
  updated: number;
  skipped: number;
  failed: number;
  images_saved: number;
  errors: string[];
}

export interface AdvertisementItem {
  id: number;
  title?: string | null;
  subtitle?: string | null;
  badge_text?: string | null;
  image_path: string;
  image_url: string;
  placement: 'all' | 'home' | 'catalog';
  link_url?: string | null;
  sort: number;
  is_active: boolean;
  created_at: string;
}

export const getPublicAdvertisements = async (placement?: 'home' | 'catalog'): Promise<ApiResponse<AdvertisementItem[]>> => {
  const { data } = await apiClient.get<ApiResponse<AdvertisementItem[]>>('/advertisements', {
    params: placement ? { placement } : undefined,
  });
  return data;
};

async function downloadCsvFromEndpoint(endpoint: string, filename: string, params?: Record<string, unknown>): Promise<void> {
  const response = await apiClient.get(endpoint, { params, responseType: 'blob' });
  const url = window.URL.createObjectURL(new Blob([response.data], { type: 'text/csv;charset=utf-8;' }));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export const adminApi = {
  getStats: async (): Promise<ApiResponse<AdminStats>> => {
    const { data } = await apiClient.get<ApiResponse<AdminStats>>('/admin/stats');
    return data;
  },

  getMerchants: async (params?: { status?: string; search?: string }): Promise<ApiResponse<MerchantItem[]>> => {
    const { data } = await apiClient.get<ApiResponse<MerchantItem[]>>('/admin/merchants', { params });
    return data;
  },

  approveMerchant: async (id: number): Promise<ApiResponse<MerchantItem>> => {
    const { data } = await apiClient.post<ApiResponse<MerchantItem>>(`/admin/merchants/${id}/approve`);
    return data;
  },

  rejectMerchant: async (id: number, payload?: { action: 'suspended' | 'rejected'; note?: string }): Promise<ApiResponse<MerchantItem>> => {
    const { data } = await apiClient.post<ApiResponse<MerchantItem>>(`/admin/merchants/${id}/reject`, payload);
    return data;
  },

  getOrders: async (params?: { status?: string; search?: string }): Promise<ApiResponse<AdminOrder[]>> => {
    const { data } = await apiClient.get<ApiResponse<AdminOrder[]>>('/admin/orders', { params });
    return data;
  },

  updateOrderStatus: async (id: number, status: string): Promise<ApiResponse<AdminOrder>> => {
    const { data } = await apiClient.patch<ApiResponse<AdminOrder>>(`/admin/orders/${id}/status`, { status });
    return data;
  },

  getActiveCarts: async (): Promise<ApiResponse<AdminActiveCart[]>> => {
    const { data } = await apiClient.get<ApiResponse<AdminActiveCart[]>>('/admin/carts');
    return data;
  },

  convertCartToOrder: async (cartId: number): Promise<ApiResponse<AdminOrder>> => {
    const { data } = await apiClient.post<ApiResponse<AdminOrder>>(`/admin/carts/${cartId}/convert-to-order`);
    return data;
  },

  getProducts: async (params?: { search?: string; category_id?: number; branch_id?: number }): Promise<ApiResponse<any[]>> => {
    const { data } = await apiClient.get<ApiResponse<any[]>>('/admin/products', { params });
    return data;
  },

  createProduct: async (payload: any): Promise<ApiResponse<any>> => {
    const isForm = typeof FormData !== 'undefined' && payload instanceof FormData;
    const { data } = await apiClient.post<ApiResponse<any>>(
      '/admin/products',
      payload,
      isForm ? { headers: { 'Content-Type': 'multipart/form-data' } } : undefined
    );
    return data;
  },

  extractProductFromUrl: async (url: string): Promise<ApiResponse<ExtractedProductPayload>> => {
    const { data } = await apiClient.post<ApiResponse<ExtractedProductPayload>>('/admin/products/extract-from-url', {
      url,
    });
    return data;
  },

  previewProductsImport: async (formData: FormData): Promise<ApiResponse<ProductImportPreviewResponse>> => {
    const { data } = await apiClient.post<ApiResponse<ProductImportPreviewResponse>>(
      '/admin/products/import/preview',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return data;
  },

  importProducts: async (formData: FormData): Promise<ApiResponse<ProductImportExecuteResult>> => {
    const { data } = await apiClient.post<ApiResponse<ProductImportExecuteResult>>(
      '/admin/products/import',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return data;
  },

  exportProductsCsv: async (params?: { search?: string; category_id?: number; branch_id?: number }): Promise<void> => {
    await downloadCsvFromEndpoint(
      '/admin/products/export',
      `products-export-${new Date().toISOString().slice(0, 10)}.csv`,
      params
    );
  },

  downloadImportTemplateCsv: async (): Promise<void> => {
    await downloadCsvFromEndpoint('/admin/products/import-template', 'products-import-template.csv');
  },

  updateProduct: async (id: number, payload: any): Promise<ApiResponse<any>> => {
    const isForm = typeof FormData !== 'undefined' && payload instanceof FormData;
    if (isForm) {
      const { data } = await apiClient.post<ApiResponse<any>>(`/admin/products/${id}`, payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return data;
    }
    const { data } = await apiClient.patch<ApiResponse<any>>(`/admin/products/${id}`, payload);
    return data;
  },

  deleteProduct: async (id: number): Promise<ApiResponse<any>> => {
    const { data } = await apiClient.delete<ApiResponse<any>>(`/admin/products/${id}`);
    return data;
  },

  getCategories: async (): Promise<ApiResponse<any[]>> => {
    const { data } = await apiClient.get<ApiResponse<any[]>>('/admin/categories');
    return data;
  },

  createCategory: async (payload: any): Promise<ApiResponse<any>> => {
    const { data } = await apiClient.post<ApiResponse<any>>('/admin/categories', payload);
    return data;
  },

  updateCategory: async (id: number, payload: any): Promise<ApiResponse<any>> => {
    const { data } = await apiClient.patch<ApiResponse<any>>(`/admin/categories/${id}`, payload);
    return data;
  },

  deleteCategory: async (id: number): Promise<ApiResponse<any>> => {
    const { data } = await apiClient.delete<ApiResponse<any>>(`/admin/categories/${id}`);
    return data;
  },

  getBranches: async (): Promise<ApiResponse<any[]>> => {
    const { data } = await apiClient.get<ApiResponse<any[]>>('/admin/branches');
    return data;
  },

  createBranch: async (payload: any): Promise<ApiResponse<any>> => {
    const { data } = await apiClient.post<ApiResponse<any>>('/admin/branches', payload);
    return data;
  },

  updateBranch: async (id: number, payload: any): Promise<ApiResponse<any>> => {
    const { data } = await apiClient.patch<ApiResponse<any>>(`/admin/branches/${id}`, payload);
    return data;
  },

  deleteBranch: async (id: number): Promise<ApiResponse<any>> => {
    const { data } = await apiClient.delete<ApiResponse<any>>(`/admin/branches/${id}`);
    return data;
  },

  getUsers: async (): Promise<ApiResponse<any[]>> => {
    const { data } = await apiClient.get<ApiResponse<any[]>>('/admin/users');
    return data;
  },

  resetUserPassword: async (id: number, password: string): Promise<ApiResponse<any>> => {
    const { data } = await apiClient.post<ApiResponse<any>>(`/admin/users/${id}/password`, { password });
    return data;
  },

  getAdvertisements: async (): Promise<ApiResponse<AdvertisementItem[]>> => {
    const { data } = await apiClient.get<ApiResponse<AdvertisementItem[]>>('/admin/advertisements');
    return data;
  },

  createAdvertisement: async (formData: FormData): Promise<ApiResponse<AdvertisementItem>> => {
    const { data } = await apiClient.post<ApiResponse<AdvertisementItem>>('/admin/advertisements', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  updateAdvertisement: async (
    id: number,
    payload: FormData | { is_active?: boolean; sort?: number; placement?: string; title?: string; subtitle?: string }
  ): Promise<ApiResponse<AdvertisementItem>> => {
    if (payload instanceof FormData) {
      const { data } = await apiClient.post<ApiResponse<AdvertisementItem>>(`/admin/advertisements/${id}`, payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return data;
    }
    const { data } = await apiClient.patch<ApiResponse<AdvertisementItem>>(`/admin/advertisements/${id}`, payload);
    return data;
  },

  deleteAdvertisement: async (id: number): Promise<ApiResponse<any>> => {
    const { data } = await apiClient.delete<ApiResponse<any>>(`/admin/advertisements/${id}`);
    return data;
  },
};

