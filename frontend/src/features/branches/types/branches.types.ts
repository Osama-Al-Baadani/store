import { Branch } from '@/types';

export interface BranchState {
  branches: Branch[];
  currentBranch: Branch | null;
  isLoading: boolean;
  error: string | null;
}

