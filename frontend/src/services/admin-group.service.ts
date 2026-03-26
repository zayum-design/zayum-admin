import request from './request';

export interface QueryAdminGroupDTO {
  page?: number;
  pageSize?: number;
  name?: string;
  status?: string;
}

export interface CreateAdminGroupDTO {
  name: string;
  description?: string;
  status?: string;
}

export interface UpdateAdminGroupDTO {
  name?: string;
  description?: string;
  status?: string;
}

export interface Permission {
  id: number;
  name: string;
  code: string;
  type?: string;
}

export interface AdminGroupItem {
  id: number;
  name: string;
  description?: string;
  status: string;
  admin_count?: number;
  permissions?: Permission[];
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
    list: AdminGroupItem[];
    pagination: Pagination;
  };
}

export interface DetailResponse {
  code: number;
  message: string;
  data: AdminGroupItem;
}

export interface PermissionResponse {
  code: number;
  message: string;
  data: {
    permission_ids: number[];
    permissions: Permission[];
  };
}

export const adminGroupService = {
  // 获取管理员组列表
  getList: async (params: QueryAdminGroupDTO) => {
    return request.get<any, ListResponse>('/api/admin/admin-groups', { params });
  },

  // 获取管理员组详情
  getDetail: async (id: number) => {
    return request.get<any, DetailResponse>(`/api/admin/admin-groups/${id}`);
  },

  // 创建管理员组
  create: async (data: CreateAdminGroupDTO) => {
    return request.post<CreateAdminGroupDTO, any>('/api/admin/admin-groups', data);
  },

  // 更新管理员组
  update: async (id: number, data: UpdateAdminGroupDTO) => {
    return request.put<UpdateAdminGroupDTO, any>(`/api/admin/admin-groups/${id}`, data);
  },

  // 删除管理员组
  delete: async (id: number) => {
    return request.delete<any, { code: number; message: string }>(`/api/admin/admin-groups/${id}`);
  },

  // 获取管理员组权限
  getPermissions: async (id: number) => {
    return request.get<any, PermissionResponse>(`/api/admin/admin-groups/${id}/permissions`);
  },

  // 分配权限
  assignPermissions: async (id: number, permissionIds: number[]) => {
    return request.post<{ permission_ids: number[] }, any>(`/api/admin/admin-groups/${id}/permissions`, {
      permission_ids: permissionIds,
    });
  },

  // 获取管理员组下的管理员
  getGroupAdmins: async (id: number, params?: { page?: number; pageSize?: number }) => {
    return request.get<any, ListResponse>(`/api/admin/admin-groups/${id}/admins`, { params });
  },
};
