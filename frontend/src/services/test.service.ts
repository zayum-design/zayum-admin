import request from './request';

export interface CreateSysTestDto {
  // TODO: 添加创建字段
}

export interface UpdateSysTestDto {
  // TODO: 添加更新字段
}

export interface QuerySysTestDto {
  page?: number;
  pageSize?: number;
}

export interface SysTestItem {
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
    list: SysTestItem[];
    pagination: Pagination;
  };
}

export interface DetailResponse {
  code: number;
  message: string;
  data: SysTestItem;
}

export const testService = {
  getList: async (params: QuerySysTestDto) => {
    return request.get<any, ListResponse>('/api/admin/test', { params });
  },

  getDetail: async (id: number) => {
    return request.get<any, DetailResponse>(`/api/admin/test/${id}`);
  },

  create: async (data: CreateSysTestDto) => {
    return request.post<CreateSysTestDto, any>('/api/admin/test', data);
  },

  update: async (id: number, data: UpdateSysTestDto) => {
    return request.put<UpdateSysTestDto, any>(`/api/admin/test/${id}`, data);
  },

  delete: async (id: number) => {
    return request.delete<any, { code: number; message: string }>(`/api/admin/test/${id}`);
  },
};