import { create } from 'zustand';
import { authService, type LoginDTO } from '../services/auth.service';
import { token } from '../utils/token';
import { usePermissionStore } from './permission.store';

interface AuthState {
  user: any | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: LoginDTO) => Promise<void>;
  logout: () => Promise<void>;
  fetchUser: () => Promise<void>;
  init: () => void;
  afterLogin: () => Promise<void>;
  setUser: (user: any) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: token.get(),
  isAuthenticated: !!token.get(),
  isLoading: false,

  login: async (data: LoginDTO) => {
    set({ isLoading: true });
    try {
      const response = await authService.login(data);
      set({
        user: response.data.user,
        token: response.data.token.access_token,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    try {
      await authService.logout();
    } finally {
      set({
        user: null,
        token: null,
        isAuthenticated: false,
      });
    }
  },

  fetchUser: async () => {
    if (!token.get()) return;
    set({ isLoading: true });
    try {
      const response = await authService.getProfile();
      set({
        user: response.data,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
      token.remove();
    }
  },

  afterLogin: async () => {
    const permissionStore = usePermissionStore.getState();
    await permissionStore.fetchPermissions();
    await permissionStore.fetchMenus();
  },

  init: () => {
    const t = token.get();
    if (t) {
      set({ isAuthenticated: true, token: t });
    }
  },

  setUser: (user: any) => {
    set({ user });
  },
}));
