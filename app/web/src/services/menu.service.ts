import request from './request';
import type { ApiResponse } from '../types';

// 菜单项类型
export interface MenuItem {
  id: number;
  name: string;
  code: string;
  path: string | null;
  icon: string | null;
  parentId: number;
  sort: number;
  children?: MenuItem[];
}

export const menuService = {
  // 获取用户菜单树
  getUserMenus(): Promise<ApiResponse<MenuItem[]>> {
    return request.get('/member/menus');
  },
};
