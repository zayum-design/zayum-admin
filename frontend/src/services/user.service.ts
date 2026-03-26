import request from './request';

export interface QueryUserDTO {
  page?: number;
  pageSize?: number;
  username?: string;
  nickname?: string;
  email?: string;
  mobile?: string;
  group_id?: number;
  gender?: string;
  status?: string;
  created_at_start?: string;
  created_at_end?: string;
}

export interface CreateUserDTO {
  username: string;
  nickname: string;
  password: string;
  email: string;
  mobile: string;
  group_id: number;
  avatar?: string;
  gender?: string;
  birthday?: string;
  status?: string;
}

export interface UpdateUserDTO {
  nickname?: string;
  password?: string;
  email?: string;
  mobile?: string;
  group_id?: number;
  avatar?: string;
  gender?: string;
  birthday?: string;
  status?: string;
}

export interface UserItem {
  id: number;
  username: string;
  nickname: string;
  email: string;
  mobile: string;
  avatar?: string;
  gender: string;
  birthday?: string;
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
    list: UserItem[];
    pagination: Pagination;
  };
}

export interface DetailResponse {
  code: number;
  message: string;
  data: UserItem;
}

export const userService = {
  // 获取用户列表
  getList: async (params: QueryUserDTO) => {
    return request.get<any, ListResponse>('/api/admin/users', { params });
  },

  // 获取用户详情
  getDetail: async (id: number) => {
    return request.get<any, DetailResponse>(`/api/admin/users/${id}`);
  },

  // 创建用户
  create: async (data: CreateUserDTO) => {
    return request.post<CreateUserDTO, any>('/api/admin/users', data);
  },

  // 更新用户
  update: async (id: number, data: UpdateUserDTO) => {
    return request.put<UpdateUserDTO, any>(`/api/admin/users/${id}`, data);
  },

  // 删除用户
  delete: async (id: number) => {
    return request.delete<any, { code: number; message: string }>(`/api/admin/users/${id}`);
  },

  // 批量删除用户
  batchDelete: async (ids: number[]) => {
    return request.post<{ ids: number[] }, any>('/api/admin/users/batch', { ids });
  },

  // 修改状态
  updateStatus: async (id: number, status: string) => {
    return request.patch<{ status: string }, any>(`/api/admin/users/${id}/status`, { status });
  },

  // 重置密码
  resetPassword: async (id: number, newPassword?: string) => {
    return request.post<{ new_password?: string }, any>(`/api/admin/users/${id}/reset-password`, {
      new_password: newPassword,
    });
  },
};
