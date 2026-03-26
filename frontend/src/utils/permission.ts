import { usePermissionStore } from '../store/permission.store';

export const checkPermission = (code: string): boolean => {
  return usePermissionStore.getState().hasPermission(code);
};

export const checkAnyPermission = (codes: string[]): boolean => {
  return usePermissionStore.getState().hasAnyPermission(codes);
};

export const filterMenusByPermission = (
  menus: any[],
  codes: string[]
): any[] => {
  return menus.filter((menu) => {
    // 如果是超级管理员或有这个权限
    if (codes.includes('*') || codes.includes(menu.code)) {
      // 如果有子菜单，递归过滤
      if (menu.children && menu.children.length > 0) {
        menu.children = filterMenusByPermission(menu.children, codes);
      }
      return true;
    }
    // 如果有子菜单且子菜单中有符合条件的，也返回 true
    if (menu.children && menu.children.length > 0) {
      const filteredChildren = filterMenusByPermission(menu.children, codes);
      if (filteredChildren.length > 0) {
        menu.children = filteredChildren;
        return true;
      }
    }
    return false;
  });
};
