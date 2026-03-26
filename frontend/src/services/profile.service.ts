import type { SysLoginLog, SysOperationLog } from '../types/entities';
import request from './request';

export interface ProfileResponse {
  id: number;
  username: string;
  nickname: string;
  email?: string;
  mobile?: string;
  avatar?: string;
  gender: 'male' | 'female' | 'unknown';
  birthday?: string;
  groupId: number;
  groupName: string;
  status: string;
  loginAt?: string;
  loginIp?: string;
  createdAt: string;
  userType: 'admin' | 'user';
}

export interface UpdateProfileDto {
  nickname?: string;
  avatar?: string;
  email?: string;
  mobile?: string;
  gender?: 'male' | 'female' | 'unknown';
  birthday?: string;
}

export interface ChangePasswordDto {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface LoginLogListResponse {
  list: SysLoginLog[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface OperationLogListResponse {
  list: SysOperationLog[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export const profileService = {
  // 获取个人信息
  async getProfile(): Promise<ProfileResponse> {
    const response = await request.get<any, { code: number; message: string; data: ProfileResponse }>('/api/admin/profile');
    return response.data;
  },

  // 更新个人信息
  async updateProfile(data: UpdateProfileDto): Promise<ProfileResponse> {
    const response = await request.put<UpdateProfileDto, { code: number; message: string; data: ProfileResponse }>(
      '/api/admin/profile',
      data,
    );
    return response.data;
  },

  // 修改密码
  async changePassword(data: ChangePasswordDto): Promise<{ message: string }> {
    const response = await request.post<ChangePasswordDto, { code: number; message: string }>(
      '/api/admin/profile/change-password',
      data,
    );
    return { message: response.message };
  },

  // 获取登录日志
  async getLoginLogs(page: number = 1, pageSize: number = 10): Promise<LoginLogListResponse> {
    const response = await request.get<any, { code: number; message: string; data: LoginLogListResponse }>(
      '/api/admin/profile/login-logs',
      { params: { page, pageSize } },
    );
    return response.data;
  },

  // 获取操作日志
  async getOperationLogs(page: number = 1, pageSize: number = 10): Promise<OperationLogListResponse> {
    const response = await request.get<any, { code: number; message: string; data: OperationLogListResponse }>(
      '/api/admin/profile/operation-logs',
      { params: { page, pageSize } },
    );
    return response.data;
  },
};
