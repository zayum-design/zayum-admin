import { SysUser } from '../../../entities/sys-user.entity';

// 认证钩子
export interface AuthHooks {
  beforeLogin?: (credentials: any) => Promise<boolean | { message: string }>;
  afterLogin?: (user: SysUser, token: string) => Promise<void>;
  beforeRegister?: (data: any) => Promise<boolean | { message: string }>;
  afterRegister?: (user: SysUser) => Promise<void>;
}

// API 扩展钩子
export interface ApiExtension {
  controllers?: any[];
  providers?: any[];
  exports?: any[];
}

// 插件模块接口
export interface PluginModule {
  onInstall?: () => Promise<void>;
  onUninstall?: () => Promise<void>;
  onEnable?: () => Promise<void>;
  onDisable?: () => Promise<void>;
  getAuthHooks?: () => AuthHooks;
  getApiExtension?: () => ApiExtension;
}
