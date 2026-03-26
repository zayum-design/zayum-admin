import request from './request';

export interface QueryAdminDTO {
  page?: number;
  pageSize?: number;
  username?: string;
  nickname?: string;
  email?: string;
  mobile?: string;
  group_id?: number;
  status?: string;
}

export interface CreateAdminDTO {
  username: string;
  nickname: string;
  password: string;
  email: string;
  mobile: string;
  group_id: number;
  avatar?: string;
  status?: string;
}

export interface UpdateAdminDTO {
  nickname?: string;
  password?: string;
  email?: string;
  mobile?: string;
  group_id?: number;
  avatar?: string;
  status?: string;
}

export interface AdminItem {
  id: number;
  username: string;
  nickname: string;
  email: string;
  mobile: string;
  avatar?: string;
  group_id: number;
  group_name: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface ListResponse {
  code: number;
  message: string;
  data: {
    list: AdminItem[];
    pagination: Pagination;
  };
}

export interface DetailResponse {
  code: number;
  message: string;
  data: AdminItem;
}

export interface AdminGroup {
  id: number;
  name: string;
}

export const adminService = {
  // 获取管理员列表
  getList: async (params: QueryAdminDTO) => {
    return request.get<any, ListResponse>('/api/admin/admins', { params });
  },

  // 获取管理员详情
  getDetail: async (id: number) => {
    return request.get<any, DetailResponse>(`/api/admin/admins/${id}`);
  },

  // 创建管理员
  create: async (data: CreateAdminDTO) => {
    return request.post<CreateAdminDTO, any>('/api/admin/admins', data);
  },

  // 更新管理员
  update: async (id: number, data: UpdateAdminDTO) => {
    return request.put<UpdateAdminDTO, any>(`/api/admin/admins/${id}`, data);
  },

  // 删除管理员
  delete: async (id: number) => {
    return request.delete<any, { code: number; message: string }>(`/api/admin/admins/${id}`);
  },

  // 修改状态
  updateStatus: async (id: number, status: string) => {
    return request.patch<{ status: string }, any>(`/api/admin/admins/${id}/status`, { status });
  },

  // 重置密码
  resetPassword: async (id: number, newPassword?: string) => {
    return request.post<{ new_password?: string }, any>(`/api/admin/admins/${id}/reset-password`, {
      new_password: newPassword,
    });
  },
};
