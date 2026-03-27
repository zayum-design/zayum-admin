import request from './request';
import axios from 'axios';

// 创建AI专用请求实例，超时时间更长（60秒）
const aiRequest = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  timeout: 60000,
});

// 复制请求拦截器
aiRequest.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 复制响应拦截器
aiRequest.interceptors.response.use(
  (response) => response.data,
  (error) => Promise.reject(error.response?.data || error)
);

export interface TableInfo {
  tableName: string;
  tableComment?: string;
}

export interface ColumnInfo {
  columnName: string;
  dataType: string;
  columnComment?: string;
  isNullable: boolean;
  columnDefault?: string;
  characterMaximumLength?: number;
  numericPrecision?: number;
  numericScale?: number;
  isPrimaryKey: boolean;
}

export interface GeneratedFile {
  name: string;
  path: string;
  language: string;
  code: string;
}

export interface GenerateCodeParams {
  tableName: string;
  columns: string[];
}

export interface DownloadCodeParams {
  tableName: string;
  columns: string[];
  writeFiles?: boolean;
}

export interface CreateMenuParams {
  tableName: string;
  menuName: string;
  parentCode?: string;
  sort?: number;
}

export interface DownloadCodeResponse {
  code: number;
  message: string;
  data: {
    files: string[];
    success: boolean;
    message: string;
  };
}

export interface CreateMenuResponse {
  code: number;
  message: string;
  data: {
    menuId: number;
    message: string;
  };
}

export interface CreateTableField {
  name: string;
  type: string;
  comment?: string;
  isNullable?: boolean;
  isPrimaryKey?: boolean;
}

export interface CreateTableParams {
  tableName: string;
  tableComment?: string;
  fields: CreateTableField[];
}

export interface CreateTableResponse {
  code: number;
  message: string;
  data: {
    tableName: string;
    message: string;
  };
}

export interface CheckTableResponse {
  code: number;
  message: string;
  data: {
    exists: boolean;
  };
}

export interface DeleteCodeParams {
  tableName: string;
}

export interface DeleteCodeResponse {
  code: number;
  message: string;
  data: {
    files: string[];
    success: boolean;
    message: string;
  };
}

export interface GeneratedField {
  name: string;
  type: string;
  comment?: string;
  isNullable?: boolean;
  isPrimaryKey?: boolean;
}

export interface GenerateFieldsParams {
  prompt: string;
  tableName?: string;
  tableComment?: string;
}

export interface GenerateFieldsResponse {
  code: number;
  message: string;
  data: {
    fields: GeneratedField[];
  };
}

export const codeGeneratorService = {
  // 获取所有表
  getTables: async (keyword?: string) => {
    return request.get<any, { code: number; message: string; data: TableInfo[] }>(
      '/api/admin/code-generator/tables',
      { params: { keyword } }
    );
  },

  // 获取表的列信息
  getColumns: async (tableName: string) => {
    return request.get<any, { code: number; message: string; data: ColumnInfo[] }>(
      `/api/admin/code-generator/columns/${tableName}`
    );
  },

  // 生成代码
  generateCode: async (params: GenerateCodeParams) => {
    return request.post<GenerateCodeParams, { code: number; message: string; data: GeneratedFile[] }>(
      '/api/admin/code-generator/generate',
      params
    );
  },

  // 下载代码（写入文件）
  downloadCode: async (params: DownloadCodeParams) => {
    return request.post<DownloadCodeParams, DownloadCodeResponse>(
      '/api/admin/code-generator/download',
      params
    );
  },

  // 创建菜单
  createMenu: async (params: CreateMenuParams) => {
    return request.post<CreateMenuParams, CreateMenuResponse>(
      '/api/admin/code-generator/create-menu',
      params
    );
  },

  // 检查表是否存在
  checkTableExists: async (tableName: string) => {
    return request.get<any, CheckTableResponse>(
      '/api/admin/code-generator/check-table',
      { params: { tableName } }
    );
  },

  // 创建数据表
  createTable: async (params: CreateTableParams) => {
    return request.post<CreateTableParams, CreateTableResponse>(
      '/api/admin/code-generator/create-table',
      params
    );
  },

  // 删除代码
  deleteCode: async (params: DeleteCodeParams) => {
    return request.post<DeleteCodeParams, DeleteCodeResponse>(
      '/api/admin/code-generator/delete-code',
      params
    );
  },

  // AI生成字段（使用更长超时）
  generateFields: async (params: GenerateFieldsParams) => {
    return aiRequest.post<GenerateFieldsParams, GenerateFieldsResponse>(
      '/api/admin/code-generator/generate-fields',
      params
    );
  },
};
