import { create } from 'zustand';
import { notificationService } from '../services/notification.service';
import type { SysNotification } from '../types/entities';

interface NotificationState {
  unreadCount: number;
  latestNotifications: SysNotification[];
  notifications: SysNotification[];
  loading: boolean;
  fetchUnreadCount: () => Promise<void>;
  fetchLatestNotifications: (limit?: number) => Promise<void>;
  fetchNotifications: (params?: any) => Promise<void>;
  markAsRead: (id: number) => Promise<void>;
  decrementUnreadCount: () => void;
  setNotifications: (notifications: SysNotification[]) => void;
  setUnreadCount: (count: number) => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  unreadCount: 0,
  latestNotifications: [],
  notifications: [],
  loading: false,

  fetchUnreadCount: async () => {
    try {
      const response = await notificationService.getUnreadCount();
      set({ unreadCount: response.data.unreadCount });
    } catch (error) {
      console.error('获取未读数量失败:', error);
    }
  },

  fetchLatestNotifications: async (limit: number = 5) => {
    try {
      const response = await notificationService.getLatest(limit);
      set({ latestNotifications: response.data });
    } catch (error) {
      console.error('获取最新通知失败:', error);
    }
  },

  fetchNotifications: async (params?: any) => {
    set({ loading: true });
    try {
      const response = await notificationService.list(params);
      set({
        notifications: response.data.list,
        unreadCount: response.data.unreadCount,
        loading: false,
      });
    } catch (error) {
      console.error('获取通知列表失败:', error);
      set({ loading: false });
    }
  },

  markAsRead: async (id: number) => {
    try {
      await notificationService.markAsRead(id);
      const { notifications, unreadCount } = get();
      const updatedNotifications = notifications.map((n) =>
        n.id === id ? { ...n, isRead: true } : n,
      );
      set({
        notifications: updatedNotifications,
        unreadCount: Math.max(0, unreadCount - 1),
      });
    } catch (error) {
      console.error('标记已读失败:', error);
    }
  },

  decrementUnreadCount: () => {
    const { unreadCount } = get();
    set({ unreadCount: Math.max(0, unreadCount - 1) });
  },

  setNotifications: (notifications: SysNotification[]) => {
    set({ notifications });
  },

  setUnreadCount: (count: number) => {
    set({ unreadCount: count });
  },
}));
