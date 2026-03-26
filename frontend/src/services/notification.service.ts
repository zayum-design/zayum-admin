import type { SysNotification } from '../types/entities';
import request from './request';

export interface QueryNotificationDto {
  page?: number;
  pageSize?: number;
  userType?: 'admin' | 'user';
  userId?: string;
  type?: 'system' | 'message' | 'email';
  isRead?: string;
  createdAtStart?: string;
  createdAtEnd?: string;
}

export interface CreateNotificationDto {
  userId: number;
  userType?: 'admin' | 'user';
  type?: 'system' | 'message' | 'email';
  title: string;
  content: string;
  link?: string;
}

export interface SendEmailDto {
  to: string;
  subject: string;
  content: string;
  attachments?: string;
}

export interface NotificationListResponse {
  code: number;
  message: string;
  data: {
    list: SysNotification[];
    pagination: {
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
    };
    unreadCount: number;
  };
}

export interface UnreadCountResponse {
  code: number;
  message: string;
  data: {
    unreadCount: number;
  };
}

export const notificationService = {
  // 获取通知列表
  async list(params: QueryNotificationDto): Promise<NotificationListResponse> {
    return request.get<QueryNotificationDto, NotificationListResponse>('/api/admin/notifications', { params });
  },

  // 获取未读数量
  async getUnreadCount(): Promise<UnreadCountResponse> {
    return request.get<any, UnreadCountResponse>('/api/admin/notifications/unread-count');
  },

  // 获取最新通知
  async getLatest(limit: number = 5): Promise<{ code: number; message: string; data: SysNotification[] }> {
    return request.get<any, { code: number; message: string; data: SysNotification[] }>('/api/admin/notifications/latest', {
      params: { limit },
    });
  },

  // 获取通知详情
  async getById(id: number): Promise<{ code: number; message: string; data: SysNotification }> {
    return request.get<any, { code: number; message: string; data: SysNotification }>(`/api/admin/notifications/${id}`);
  },

  // 创建通知
  async create(data: CreateNotificationDto): Promise<{ code: number; message: string; data: SysNotification }> {
    return request.post<CreateNotificationDto, { code: number; message: string; data: SysNotification }>('/api/admin/notifications', data);
  },

  // 批量创建通知
  async batchCreate(
    userIds: number[],
    userType: 'admin' | 'user',
    title: string,
    content: string,
    link?: string,
    type?: 'system' | 'message',
  ): Promise<void> {
    await request.post('/api/admin/notifications/batch', {
      userIds,
      userType,
      title,
      content,
      link,
      type,
    });
  },

  // 标记已读
  async markAsRead(id: number): Promise<void> {
    await request.patch(`/api/admin/notifications/${id}/read`);
  },

  // 批量标记已读
  async batchMarkAsRead(ids?: number[]): Promise<void> {
    await request.post('/api/admin/notifications/mark-read', { ids });
  },

  // 删除通知
  async remove(id: number): Promise<void> {
    await request.delete(`/api/admin/notifications/${id}`);
  },

  // 批量删除通知
  async batchRemove(ids: number[]): Promise<void> {
    await request.delete('/api/admin/notifications/batch', {
      data: { ids },
    });
  },

  // 发送邮件
  async sendEmail(data: SendEmailDto): Promise<void> {
    await request.post('/api/admin/notifications/send-email', data);
  },

  // 测试邮件
  async testEmail(to: string): Promise<void> {
    await request.post('/api/admin/notifications/test-email', { to });
  },
};
