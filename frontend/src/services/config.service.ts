import request from './request';

export interface QueryConfigDTO {
  page?: number;
  pageSize?: number;
  category?: string;
  key?: string;
  is_public?: string;
}

export interface CreateConfigDTO {
  category: string;
  key: string;
  value: string;
  description?: string;
  type?: string;
  is_public?: boolean;
  sort?: number;
}

export interface UpdateConfigDTO {
  value?: string;
  description?: string;
  type?: string;
  is_public?: boolean;
  sort?: number;
}

export interface ConfigItem {
  id: number;
  category: string;
  configKey: string;
  configValue: string;
  description?: string;
  type: string;
  isPublic: boolean;
  sort: number;
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
    list: ConfigItem[];
    pagination: Pagination;
  };
}

export interface DetailResponse {
  code: number;
  message: string;
  data: ConfigItem;
}

export interface CategoryItem {
  category: string;
  count: number;
}

export const configService = {
  getList: async (params: QueryConfigDTO) => {
    return request.get<any, ListResponse>('/api/admin/configs', { params });
  },

  getDetail: async (id: number) => {
    return request.get<any, DetailResponse>(`/api/admin/configs/${id}`);
  },

  getByKey: async (key: string) => {
    return request.get<any, any>(`/api/admin/configs/by-key/${key}`);
  },

  getPublicConfigs: async () => {
    return request.get<any, any>('/api/admin/configs/public');
  },

  getCategories: async () => {
    return request.get<any, { code: number; data: CategoryItem[] }>('/api/admin/configs/categories');
  },

  create: async (data: CreateConfigDTO) => {
    return request.post<CreateConfigDTO, any>('/api/admin/configs', data);
  },

  update: async (id: number, data: UpdateConfigDTO) => {
    return request.put<UpdateConfigDTO, any>(`/api/admin/configs/${id}`, data);
  },

  batchUpdate: async (configs: { key: string; value: string }[]) => {
    return request.put<{ configs: { key: string; value: string }[] }, any>('/api/admin/configs/batch', { configs });
  },

  delete: async (id: number) => {
    return request.delete<any, { code: number; message: string }>(`/api/admin/configs/${id}`);
  },
};
