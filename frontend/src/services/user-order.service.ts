import request from './request';

export interface CreateSysUserOrderDto {
  // TODO: 添加创建字段
}

export interface UpdateSysUserOrderDto {
  // TODO: 添加更新字段
}

export interface QuerySysUserOrderDto {
  page?: number;
  pageSize?: number;
}

export interface SysUserOrderItem {
  id: number;
  // TODO: 添加其他字段
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
    list: SysUserOrderItem[];
    pagination: Pagination;
  };
}

export interface DetailResponse {
  code: number;
  message: string;
  data: SysUserOrderItem;
}

export const userOrderService = {
  getList: async (params: QuerySysUserOrderDto) => {
    return request.get<any, ListResponse>('/api/admin/user/order', { params });
  },

  getDetail: async (id: number) => {
    return request.get<any, DetailResponse>(`/api/admin/user/order/${id}`);
  },

  create: async (data: CreateSysUserOrderDto) => {
    return request.post<CreateSysUserOrderDto, any>('/api/admin/user/order', data);
  },

  update: async (id: number, data: UpdateSysUserOrderDto) => {
    return request.put<UpdateSysUserOrderDto, any>(`/api/admin/user/order/${id}`, data);
  },

  delete: async (id: number) => {
    return request.delete<any, { code: number; message: string }>(`/api/admin/user/order/${id}`);
  },
};