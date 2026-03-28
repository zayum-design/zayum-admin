// 管理员相关类型
export interface SysAdmin {
  id: number;
  groupId: number;
  username: string;
  nickname: string;
  password?: string;
  avatar?: string;
  email?: string;
  mobile?: string;
  loginFailure: number;
  loginAt?: string;
  loginIp?: string;
  token?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  group?: SysAdminGroup;
}

export interface SysAdminGroup {
  id: number;
  name: string;
  description?: string;
  permissions?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  admins?: SysAdmin[];
}

// 用户相关类型
export interface SysUser {
  id: number;
  groupId: number;
  username: string;
  nickname: string;
  password?: string;
  avatar?: string;
  email?: string;
  mobile?: string;
  gender: string;
  birthday?: string;
  status: string;
  score: number;
  balance: number;
  createdAt: string;
  updatedAt: string;
  group?: SysUserGroup;
}

export interface SysUserGroup {
  id: number;
  name: string;
  description?: string;
  permissions?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

// 管理员权限相关类型
export interface SysAdminPermission {
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
  createdAt: string;
  updatedAt: string;
}

export interface SysAdminRolePermission {
  id: number;
  roleType: 'admin_group' | 'user_group';
  roleId: number;
  permissionId: number;
  createdAt: string;
}

// 日志相关类型
export interface SysOperationLog {
  id: number;
  userType: 'admin' | 'user';
  userId: number;
  username: string;
  module: string;
  action: string;
  method: string;
  url: string;
  params?: string;
  ip?: string;
  userAgent?: string;
  status: 'success' | 'failure';
  errorMsg?: string;
  duration?: number;
  createdAt: string;
}

export interface SysLoginLog {
  id: number;
  userType: 'admin' | 'user';
  userId?: number;
  username: string;
  ip: string;
  location?: string;
  browser?: string;
  os?: string;
  status: 'success' | 'failure';
  message?: string;
  createdAt: string;
}

// 配置相关类型
export interface SysConfig {
  id: number;
  category: string;
  configKey: string;
  configValue: string;
  description?: string;
  type: 'string' | 'number' | 'boolean' | 'json';
  isPublic: boolean;
  sort: number;
  createdAt: string;
  updatedAt: string;
}

// 文件上传相关类型
export interface SysUpload {
  id: number;
  userType: 'admin' | 'user';
  userId?: number;
  category: string;
  filename: string;
  filepath: string;
  filesize: number;
  mimetype: string;
  fileExt: string;
  url: string;
  createdAt: string;
}

// 消息通知相关类型
export interface SysNotification {
  id: number;
  userType: 'admin' | 'user';
  userId: number;
  type: 'system' | 'message' | 'email';
  title: string;
  content: string;
  link?: string;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

// 公共类型
export interface PageResult<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
}

export interface LoginDTO {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  admin: SysAdmin;
}
