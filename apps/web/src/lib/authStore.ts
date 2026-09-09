import { create } from 'zustand';
import { apiRequest } from './api';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'MANAGER' | 'MR';
  phone?: string | null;
  region?: string | null;
  managerId?: string | null;
  manager?: { id: string; name: string; email: string; region?: string } | null;
}

interface AuthState {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (tokens: { accessToken: string; refreshToken: string }, user: UserProfile) => void;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: (() => {
    try {
      const stored = localStorage.getItem('aegis_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  })(),
  token: localStorage.getItem('aegis_access_token'),
  isAuthenticated: !!localStorage.getItem('aegis_access_token'),
  isLoading: false,

  login: (tokens, user) => {
    localStorage.setItem('aegis_access_token', tokens.accessToken);
    localStorage.setItem('aegis_refresh_token', tokens.refreshToken);
    localStorage.setItem('aegis_user', JSON.stringify(user));
    set({
      user,
      token: tokens.accessToken,
      isAuthenticated: true,
    });
  },

  logout: () => {
    localStorage.removeItem('aegis_access_token');
    localStorage.removeItem('aegis_refresh_token');
    localStorage.removeItem('aegis_user');
    set({
      user: null,
      token: null,
      isAuthenticated: false,
    });
  },

  checkAuth: async () => {
    const token = localStorage.getItem('aegis_access_token');
    if (!token) {
      set({ user: null, isAuthenticated: false });
      return;
    }

    try {
      set({ isLoading: true });
      const data = await apiRequest<{ user: UserProfile }>('/auth/me');
      localStorage.setItem('aegis_user', JSON.stringify(data.user));
      set({ user: data.user, isAuthenticated: true, isLoading: false });
    } catch (err) {
      localStorage.removeItem('aegis_access_token');
      localStorage.removeItem('aegis_refresh_token');
      localStorage.removeItem('aegis_user');
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },
}));
