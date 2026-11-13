'use client';

import { useState, useEffect, useCallback } from 'react';
import Cookies from 'js-cookie';
import { User } from '@/types';
import { authApi } from '../api/auth.api';
import { LoginCredentials, RegisterCredentials } from '../types/auth.types';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUser = useCallback(async () => {
    const token = Cookies.get('merchant_token');
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const res = await authApi.getMe();
      if (res.success && res.data) {
        setUser(res.data);
      }
    } catch {
      setUser(null);
      Cookies.remove('merchant_token');
      localStorage.removeItem('merchant_token');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const login = async (credentials: LoginCredentials) => {
    setError(null);
    setIsLoading(true);
    try {
      const res = await authApi.login(credentials);
      if (res.success && res.data.token) {
        Cookies.set('merchant_token', res.data.token, { expires: 30 });
        localStorage.setItem('merchant_token', res.data.token);
        setUser(res.data);
        return res.data;
      }
      throw new Error(res.message);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'فشل تسجيل الدخول';
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (credentials: RegisterCredentials) => {
    setError(null);
    setIsLoading(true);
    try {
      const res = await authApi.register(credentials);
      return res;
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'فشل إرسال طلب التسجيل';
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore
    } finally {
      Cookies.remove('merchant_token');
      localStorage.removeItem('merchant_token');
      setUser(null);
    }
  };

  return {
    user,
    isAuthenticated: !!user,
    isActiveMerchant: user?.merchant_profile?.is_active ?? false,
    isLoading,
    error,
    login,
    register,
    logout,
    refreshUser: fetchUser,
  };
}

