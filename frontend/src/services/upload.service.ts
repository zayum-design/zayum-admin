import type { SysUpload } from '../types/entities';
import request from './request';

export interface QueryUploadDto {
  page?: number;
  pageSize?: number;
  userType?: 'admin' | 'user';
  userId?: number;
  category?: string;
  extension?: string;
  filename?: string;
}

export interface UploadListResponse {
  code: number;
  message: string;
  data: {
    list: SysUpload[];
    pagination: {
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
    };
  };
}

export const uploadService = {
  // 上传文件
  async upload(file: File, category: string = 'attachment'): Promise<{ code: number; message: string; data: SysUpload }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', category);

    return request.post<any, { code: number; message: string; data: SysUpload }>('/api/admin/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // 获取文件列表
  async list(params: QueryUploadDto): Promise<UploadListResponse> {
    return request.get<QueryUploadDto, UploadListResponse>('/api/admin/uploads', { params });
  },

  // 获取文件详情
  async getById(id: number): Promise<{ code: number; message: string; data: SysUpload }> {
    return request.get<any, { code: number; message: string; data: SysUpload }>(`/api/admin/uploads/${id}`);
  },

  // 删除文件
  async remove(id: number): Promise<void> {
    await request.delete(`/api/admin/uploads/${id}`);
  },

  // 批量删除文件
  async batchRemove(ids: number[]): Promise<void> {
    await request.delete('/api/admin/uploads/batch', {
      data: { ids },
    });
  },
};
