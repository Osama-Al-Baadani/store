export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
  errors: Record<string, string[]> | null;
}

export type CustomerStatus = 'pending' | 'active' | 'rejected' | 'suspended';
export type OrderStatus = 'new' | 'processing' | 'ready' | 'delivered' | 'cancelled';

export interface MerchantProfile {
  id: number;
  company_name: string;
  cr_number: string;
  vat_number: string | null;
  owner_name: string;
  city: string;
  address: string | null;
  customer_code: string | null;
  status: CustomerStatus;
  status_label: string;
  is_active: boolean;
  cr_document_url: string | null;
  approved_at: string | null;
  created_at: string;
}

export interface User {
  id: number;
  name: string;
  phone: string;
  email: string | null;
  role: 'merchant' | 'admin';
  role_label: string;
  merchant_profile?: MerchantProfile;
  token?: string;
  token_type?: string;
}

export interface Branch {
  id: number;
  name: string;
  code: string;
  description: string | null;
  color: string;
  logo_url: string | null;
  is_active: boolean;
}

export interface Category {
  id: number;
  branch_id: number;
  parent_id?: number | null;
  name: string;
  icon_url: string | null;
  sort: number;
  children?: Category[];
}

export interface ProductPackage {
  id: number;
  name: string;
  unit: string;
  pack_quantity: number;
  step_quantity: number;
  unit_price: number;
  old_price: number | null;
  discount_percent: number;
  is_default: boolean;
}

export interface Product {
  id: number;
  branch_id: number;
  category_id: number | null;
  category_name?: string;
  code: string;
  barcode: string | null;
  name: string;
  description: string | null;
  image_url: string | null;
  is_new: boolean;
  is_featured: boolean;
  is_coming_soon: boolean;
  packages: ProductPackage[];
}

export interface CartItem {
  id: number;
  package_id: number;
  product_id: number;
  product_name: string;
  product_code: string;
  barcode: string | null;
  image_url: string | null;
  package_name: string;
  unit: string;
  pack_quantity: number;
  step_quantity: number;
  unit_price: number;
  quantity: number;
  line_total: number;
}

export interface CartSummary {
  items_count: number;
  total_quantity: number;
  subtotal: number;
  vat_rate: number;
  vat_amount: number;
  total: number;
}

export interface Cart {
  id: number;
  branch_id: number;
  items: CartItem[];
  summary: CartSummary;
}

export interface OrderItem {
  id: number;
  product_id: number | null;
  product_name: string;
  product_code: string;
  barcode: string | null;
  package_name: string;
  unit: string;
  pack_quantity: number;
  quantity: number;
  unit_price: number;
  line_total: number;
}

export interface Order {
  id: number;
  order_number: string;
  status: OrderStatus;
  status_label: string;
  branch?: Branch;
  merchant?: MerchantProfile;
  items_count: number;
  total_quantity: number;
  subtotal: number;
  vat_rate: number;
  vat_amount: number;
  total: number;
  notes: string | null;
  invoice_pdf_url: string | null;
  items?: OrderItem[];
  created_at: string;
  created_at_formatted: string;
}

