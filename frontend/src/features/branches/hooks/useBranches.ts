'use client';

import { useState, useEffect, useCallback } from 'react';
import { Branch } from '@/types';
import { branchesApi } from '../api/branches.api';

export function useBranches() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBranches = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await branchesApi.getBranches();
      if (res.success && res.data) {
        setBranches(res.data);

        // استعادة الفرع المحفوظ مسبقاً إن وجد
        const savedBranchId = localStorage.getItem('selected_branch_id');
        if (savedBranchId) {
          const match = res.data.find((b) => b.id === parseInt(savedBranchId, 10));
          if (match) {
            setSelectedBranch(match);
          }
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'تعذر تحميل قائمة الفروع');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBranches();
  }, [fetchBranches]);

  const selectBranch = (branch: Branch) => {
    setSelectedBranch(branch);
    localStorage.setItem('selected_branch_id', branch.id.toString());
  };

  return {
    branches,
    selectedBranch,
    isLoading,
    error,
    selectBranch,
    refreshBranches: fetchBranches,
  };
}

