import { create } from 'zustand';
import request from '../services/request';

interface Permission {
  id: number;
  parentId: number;
  name: string;
  code: string;
  type: 'menu' | 'button' | 'api';
  path?: string;
  icon?: string;
  component?: string;
  sort: number;
  status: string;
  children?: Permission[];
}

interface PermissionState {
  permissions: Permission[];
  menus: Permission[];
  codes: string[];
  isLoading: boolean;
  fetchPermissions: () => Promise<void>;
  fetchMenus: () => Promise<void>;
  hasPermission: (code: string) => boolean;
  hasAnyPermission: (codes: string[]) => boolean;
}

export const usePermissionStore = create<PermissionState>((set, get) => ({
  permissions: [],
  menus: [],
  codes: [],
  isLoading: false,

  fetchPermissions: async () => {
    set({ isLoading: true });
    try {
      console.log('Fetching permissions...');
      const response = await request.get<any>('/api/admin/auth/permissions');
      console.log('Permissions response:', response);
      set({
        permissions: response.data?.permissions || [],
        codes: response.data?.codes || [],
        isLoading: false,
      });
    } catch (error) {
      console.error('Fetch permissions error:', error);
      set({ isLoading: false });
    }
  },

  fetchMenus: async () => {
    set({ isLoading: true });
    try {
      console.log('Fetching menus...');
      const response = await request.get<any>('/api/admin/auth/menus');
      console.log('Menus response:', response);
      set({
        menus: response.data || [],
        isLoading: false,
      });
    } catch (error) {
      console.error('Fetch menus error:', error);
      set({ isLoading: false });
    }
  },

  hasPermission: (code: string) => {
    const { codes } = get();
    // 超级管理员有所有权限
    return codes.includes('*') || codes.includes(code);
  },

  hasAnyPermission: (codes: string[]) => {
    const { hasPermission } = get();
    return codes.some((code) => hasPermission(code));
  },
}));
