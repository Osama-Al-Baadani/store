import { Cart } from '@/types';

export interface UpdateCartPayload {
  branch_id: number;
  package_id: number;
  quantity: number;
}

export interface CartState {
  cart: Cart | null;
  isLoading: boolean;
  isUpdating: boolean;
  error: string | null;
}

