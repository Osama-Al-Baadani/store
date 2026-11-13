import { Order } from '@/types';

export interface CheckoutPayload {
  branch_id: number;
  notes?: string;
}

export interface OrdersListResponse {
  items: Order[];
  pagination: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

