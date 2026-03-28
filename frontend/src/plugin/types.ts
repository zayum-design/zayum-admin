import { ComponentType, ReactNode } from 'react';

// 插件路由配置
export interface PluginRoute {
  path: string;
  component: ComponentType;
  exact?: boolean;
  children?: PluginRoute[];
  meta?: {
    title?: string;
    requireAuth?: boolean;
    permissions?: string[];
  };
}

// 插件菜单项
export interface PluginMenuItem {
  key: string;
  label: string;
  icon?: ReactNode | string;
  path?: string;
  children?: PluginMenuItem[];
  order?: number;
  permissions?: string[];
}

// 登录钩子
export interface LoginHook {
  extendForm?: () => ReactNode;
  beforeLogin?: (values: any) => Promise<boolean | string>;
  afterLogin?: (user: any) => Promise<void>;
}

// 注册钩子
export interface RegisterHook {
  extendForm?: () => ReactNode;
  beforeRegister?: (values: any) => Promise<boolean | string>;
  afterRegister?: (user: any) => Promise<void>;
}

// 前端插件定义
export interface FrontendPlugin {
  name: string;
  version: string;
  displayName: string;
  routes?: PluginRoute[];
  menuItems?: PluginMenuItem[];
  hooks?: {
    login?: LoginHook;
    register?: RegisterHook;
  };
  init?: () => Promise<void>;
  destroy?: () => Promise<void>;
}

// 从后端获取的插件信息
export interface PluginInfo {
  name: string;
  version: string;
  displayName: string;
  manifest: {
    frontend?: {
      entry: string;
      routes?: boolean;
      menu?: boolean;
      hooks?: {
        login?: boolean;
        register?: boolean;
      };
    };
  };
}

// 插件加载选项
export interface PluginLoadOptions {
  apiBaseUrl?: string;
  pluginsDir?: string;
}
