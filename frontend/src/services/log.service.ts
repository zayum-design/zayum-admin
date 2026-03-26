import request from './request';

export interface QueryOperationLogDTO {
  page?: number;
  pageSize?: number;
  user_type?: string;
  user_id?: number;
  username?: string;
  module?: string;
  action?: string;
  method?: string;
  status?: string;
  ip?: string;
  created_at_start?: string;
  created_at_end?: string;
}

export interface QueryLoginLogDTO {
  page?: number;
  pageSize?: number;
  user_type?: string;
  user_id?: number;
  username?: string;
  ip?: string;
  location?: string;
  status?: string;
  created_at_start?: string;
  created_at_end?: string;
}

export interface OperationLogItem {
  id: number;
  userType: string;
  userId: number;
  username: string;
  module: string;
  action: string;
  method: string;
  url: string;
  params: string;
  ip: string;
  userAgent?: string;
  status: string;
  errorMsg?: string;
  duration?: number;
  createdAt: string;
}

export interface LoginLogItem {
  id: number;
  userType: string;
  userId: number;
  username: string;
  ip: string;
  location?: string;
  browser?: string;
  os?: string;
  status: string;
  message?: string;
  createdAt: string;
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
    list: OperationLogItem[] | LoginLogItem[];
    pagination: Pagination;
  };
}

export interface DetailResponse {
  code: number;
  message: string;
  data: OperationLogItem | LoginLogItem;
}

export interface StatisticsResponse {
  code: number;
  message: string;
  data: any;
}

export const logService = {
  // 操作日志
  getOperationLogList: async (params: QueryOperationLogDTO) => {
    return request.get<any, ListResponse>('/api/admin/logs/operations', { params });
  },

  getOperationLogDetail: async (id: number) => {
    return request.get<any, DetailResponse>(`/api/admin/logs/operations/${id}`);
  },

  getOperationLogStatistics: async (params?: { start_date?: string; end_date?: string; dimension?: string }) => {
    return request.get<any, StatisticsResponse>('/api/admin/logs/operations/statistics', { params });
  },

  // 登录日志
  getLoginLogList: async (params: QueryLoginLogDTO) => {
    return request.get<any, ListResponse>('/api/admin/logs/logins', { params });
  },

  getLoginLogDetail: async (id: number) => {
    return request.get<any, DetailResponse>(`/api/admin/logs/logins/${id}`);
  },

  getLoginLogStatistics: async (params?: { start_date?: string; end_date?: string; dimension?: string }) => {
    return request.get<any, StatisticsResponse>('/api/admin/logs/logins/statistics', { params });
  },
};
