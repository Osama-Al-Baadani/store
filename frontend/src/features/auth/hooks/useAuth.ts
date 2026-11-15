'use client';

import { useState, useEffect, useCallback, useSyncExternalStore } from 'react';
import Cookies from 'js-cookie';
import { ApiResponse, User } from '@/types';
import { authApi } from '../api/auth.api';
import { LoginCredentials, RegisterCredentials } from '../types/auth.types';

const USER_CACHE_KEY = 'merchant_user_cache';
let inFlightMePromise: Promise<ApiResponse<User>> | null = null;
const noopSubscribe = () => () => {};
const getClientHydrated = () => true;
const getServerHydrated = () => false;

function requestCurrentUser(): Promise<ApiResponse<User>> {
  if (!inFlightMePromise) {
    inFlightMePromise = authApi.getMe().finally(() => {
      inFlightMePromise = null;
    });
  }
  return inFlightMePromise;
}

function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return Cookies.get('merchant_token') || localStorage.getItem('merchant_token');
}

function readCachedUser(): User | null {
  if (typeof window === 'undefined') return null;
  const token = getStoredToken();
  if (!token) return null;
  try {
    const raw = localStorage.getItem(USER_CACHE_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

function clearAuthStorage(): void {
  Cookies.remove('merchant_token');
  if (typeof window !== 'undefined') {
    localStorage.removeItem('merchant_token');
    localStorage.removeItem(USER_CACHE_KEY);
  }
}

function persistAuthStorage(userData: User, token?: string): void {
  if (token) {
    Cookies.set('merchant_token', token, { expires: 30 });
    if (typeof window !== 'undefined') {
      localStorage.setItem('merchant_token', token);
    }
  }
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(USER_CACHE_KEY, JSON.stringify(userData));
    } catch {
      // ignore storage quota errors
    }
  }
}

export function useAuth() {
  // تهيئة متطابقة بين الخادم والعميل عبر useSyncExternalStore لمنع Hydration Mismatch
  const isHydrated = useSyncExternalStore(noopSubscribe, getClientHydrated, getServerHydrated);
  const [resolvedUser, setResolvedUser] = useState<User | null | undefined>(undefined);
  const [isCheckingSession, setIsCheckingSession] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUser = useCallback(async (background = false) => {
    const token = getStoredToken();
    if (!token) {
      setResolvedUser(null);
      setIsCheckingSession(false);
      return;
    }

    if (!background) {
      setIsCheckingSession(true);
    }

    try {
      const res = await requestCurrentUser();
      if (res.success && res.data) {
        persistAuthStorage(res.data);
        setResolvedUser(res.data);
      }
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 401 || status === 403 || !background) {
        clearAuthStorage();
        setResolvedUser(null);
      }
    } finally {
      setIsCheckingSession(false);
    }
  }, []);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) return;

    let cancelled = false;
    const cached = readCachedUser();

    requestCurrentUser()
      .then((res) => {
        if (!cancelled && res.success && res.data) {
          persistAuthStorage(res.data);
          setResolvedUser(res.data);
        }
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const status = (err as { response?: { status?: number } })?.response?.status;
        if (status === 401 || status === 403 || !cached) {
          clearAuthStorage();
          setResolvedUser(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsCheckingSession(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const hasToken = isHydrated ? Boolean(getStoredToken()) : false;
  const cachedUser = isHydrated ? readCachedUser() : null;
  const user = isHydrated ? (resolvedUser !== undefined ? resolvedUser : cachedUser) : null;
  const isLoading = !isHydrated || isCheckingSession || (hasToken && user === null && resolvedUser === undefined);

  const login = async (credentials: LoginCredentials) => {
    setError(null);
    setIsCheckingSession(true);
    try {
      const res = await authApi.login(credentials);
      if (res.success && res.data.token) {
        persistAuthStorage(res.data, res.data.token);
        setResolvedUser(res.data);
        return res.data;
      }
      throw new Error(res.message);
    } catch (err: unknown) {
      const errObj = err as { response?: { data?: { message?: string } }; message?: string };
      const msg = errObj.response?.data?.message || errObj.message || 'فشل تسجيل الدخول';
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsCheckingSession(false);
    }
  };

  const register = async (credentials: RegisterCredentials) => {
    setError(null);
    setIsCheckingSession(true);
    try {
      const res = await authApi.register(credentials);
      return res;
    } catch (err: unknown) {
      const errObj = err as { response?: { data?: { message?: string } }; message?: string };
      const msg = errObj.response?.data?.message || errObj.message || 'فشل إرسال طلب التسجيل';
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsCheckingSession(false);
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore
    } finally {
      clearAuthStorage();
      setResolvedUser(null);
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
    refreshUser: () => fetchUser(false),
  };
}
