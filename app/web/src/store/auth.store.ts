import { create } from 'zustand';
import { authService } from '../services/auth.service';
import { token } from '../utils/token';
import type { Member } from '../types';

interface AuthState {
  member: Member | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Actions
  loginByPassword: (phone: string, password: string) => Promise<void>;
  loginBySms: (phone: string, code: string) => Promise<void>;
  registerByPassword: (phone: string, password: string, confirmPassword: string) => Promise<void>;
  registerBySms: (phone: string, code: string) => Promise<void>;
  logout: () => Promise<void>;
  init: () => void;
  setMember: (member: Member | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  member: null,
  token: token.get(),
  isAuthenticated: !!token.get(),
  isLoading: false,

  // 密码登录
  loginByPassword: async (phone: string, password: string) => {
    set({ isLoading: true });
    try {
      const response = await authService.loginByPassword({ phone, password });
      const { user, token: tokenData } = response.data;
      token.set(tokenData.access_token);
      set({
        member: user,
        token: tokenData.access_token,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  // 验证码登录
  loginBySms: async (phone: string, code: string) => {
    set({ isLoading: true });
    try {
      const response = await authService.loginBySms({ phone, code });
      const { user, token: tokenData } = response.data;
      token.set(tokenData.access_token);
      set({
        member: user,
        token: tokenData.access_token,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  // 密码注册
  registerByPassword: async (phone: string, password: string, confirmPassword: string) => {
    set({ isLoading: true });
    try {
      const response = await authService.registerByPassword({ phone, password, confirmPassword });
      const { user, token: tokenData } = response.data;
      token.set(tokenData.access_token);
      set({
        member: user,
        token: tokenData.access_token,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  // 验证码注册
  registerBySms: async (phone: string, code: string) => {
    set({ isLoading: true });
    try {
      const response = await authService.registerBySms({ phone, code });
      const { user, token: tokenData } = response.data;
      token.set(tokenData.access_token);
      set({
        member: user,
        token: tokenData.access_token,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  // 登出
  logout: async () => {
    try {
      await authService.logout();
    } finally {
      token.remove();
      set({
        member: null,
        token: null,
        isAuthenticated: false,
      });
    }
  },

  // 初始化
  init: () => {
    const t = token.get();
    if (t) {
      set({ isAuthenticated: true, token: t });
    }
  },

  // 设置会员信息
  setMember: (member: Member | null) => {
    set({ member });
  },
}));
