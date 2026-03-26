import request from './request';

export interface QueryUserGroupDTO {
  page?: number;
  pageSize?: number;
  name?: string;
  status?: string;
}

export interface CreateUserGroupDTO {
  name: string;
  description?: string;
  status?: string;
}

export interface UpdateUserGroupDTO {
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

export interface UserGroupItem {
  id: number;
  name: string;
  description?: string;
  status: string;
  user_count?: number;
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
    list: UserGroupItem[];
    pagination: Pagination;
  };
}

export interface DetailResponse {
  code: number;
  message: string;
  data: UserGroupItem;
}

export interface PermissionResponse {
  code: number;
  message: string;
  data: {
    permission_ids: number[];
    permissions: Permission[];
  };
}

export const userGroupService = {
  getList: async (params: QueryUserGroupDTO) => {
    return request.get<any, ListResponse>('/api/admin/user-groups', { params });
  },

  getDetail: async (id: number) => {
    return request.get<any, DetailResponse>(`/api/admin/user-groups/${id}`);
  },

  create: async (data: CreateUserGroupDTO) => {
    return request.post<CreateUserGroupDTO, any>('/api/admin/user-groups', data);
  },

  update: async (id: number, data: UpdateUserGroupDTO) => {
    return request.put<UpdateUserGroupDTO, any>(`/api/admin/user-groups/${id}`, data);
  },

  delete: async (id: number) => {
    return request.delete<any, { code: number; message: string }>(`/api/admin/user-groups/${id}`);
  },

  getPermissions: async (id: number) => {
    return request.get<any, PermissionResponse>(`/api/admin/user-groups/${id}/permissions`);
  },

  assignPermissions: async (id: number, permissionIds: number[]) => {
    return request.post<{ permission_ids: number[] }, any>(`/api/admin/user-groups/${id}/permissions`, {
      permission_ids: permissionIds,
    });
  },

  getGroupUsers: async (id: number, params?: { page?: number; pageSize?: number }) => {
    return request.get<any, ListResponse>(`/api/admin/user-groups/${id}/users`, { params });
  },
};
