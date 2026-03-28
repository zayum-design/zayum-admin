import request from './request';

export interface CreateSysUserPermissionDto {
  parent_id: number;
  name: string;
  code: string;
  type: 'menu' | 'button' | 'api';
  path?: string;
  icon?: string;
  component?: string;
  sort?: number;
  status?: string;
  description?: string;
}

export interface UpdateSysUserPermissionDto {
  parent_id?: number;
  name?: string;
  code?: string;
  type?: 'menu' | 'button' | 'api';
  path?: string;
  icon?: string;
  component?: string;
  sort?: number;
  status?: string;
  description?: string;
}

export interface QuerySysUserPermissionDto {
  page?: number;
  pageSize?: number;
}

export interface SysUserPermissionItem {
  id: number;
  parent_id: number;
  name: string;
  code: string;
  type: 'menu' | 'button' | 'api';
  path?: string;
  icon?: string;
  component?: string;
  sort: number;
  status: string;
  description?: string;
  created_at: string;
  updated_at: string;
  children?: SysUserPermissionItem[];
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
    list: SysUserPermissionItem[];
    pagination: Pagination;
  };
}

export interface TreeResponse {
  code: number;
  message: string;
  data: SysUserPermissionItem[];
}

export interface DetailResponse {
  code: number;
  message: string;
  data: SysUserPermissionItem;
}

export const userPermissionService = {
  getList: async (params: QuerySysUserPermissionDto) => {
    return request.get<any, ListResponse>('/api/admin/user/permission', { params });
  },

  getTree: async (status?: string, type?: string) => {
    const params: any = {};
    if (status) params.status = status;
    if (type) params.type = type;
    return request.get<any, TreeResponse>('/api/admin/user/permission/tree', { params });
  },

  getDetail: async (id: number) => {
    return request.get<any, DetailResponse>(`/api/admin/user/permission/${id}`);
  },

  create: async (data: CreateSysUserPermissionDto) => {
    return request.post<CreateSysUserPermissionDto, any>('/api/admin/user/permission', data);
  },

  update: async (id: number, data: UpdateSysUserPermissionDto) => {
    return request.put<UpdateSysUserPermissionDto, any>(`/api/admin/user/permission/${id}`, data);
  },

  delete: async (id: number) => {
    return request.delete<any, { code: number; message: string }>(`/api/admin/user/permission/${id}`);
  },
};
