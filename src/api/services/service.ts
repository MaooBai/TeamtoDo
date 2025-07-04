import { EnhancedApiClient } from '../utils/client';
import { apiConfig } from '../config/config';
import { VERSIONED_ENDPOINTS } from '../config/endpoints';
import { ApiResponseHandler, UrlBuilder } from '../utils/helpers';
import { z } from 'zod';
import { ApiError, PaginationParams } from '../types/common';
import { authApi } from '../api/auth';
import { LoginRequest, LoginResponse } from '../types/auth';

// API服务类
export class ApiService {
  private client: EnhancedApiClient;
  private endpoints = VERSIONED_ENDPOINTS;

  constructor() {
    this.client = new EnhancedApiClient(apiConfig.baseURL, apiConfig.timeout);
  }

  // 获取客户端实例（用于直接访问）
  getClient(): EnhancedApiClient {
    return this.client;
  }

  // 认证服务
  auth = {
    login: async (credentials: LoginRequest): Promise<LoginResponse> => {
      return authApi.login(credentials);
    },

    logout: async (): Promise<void> => {
      return authApi.logout();
    },

    checkAuthStatus: async (): Promise<boolean> => {
      return authApi.checkAuthStatus();
    },

    register: async (userData: {
      name: string;
      email: string;
      password: string;
      confirmPassword: string;
    }) => {
      return this.client.post(this.endpoints.AUTH.REGISTER, userData);
    },

    forgotPassword: async (email: string) => {
      return this.client.post(this.endpoints.AUTH.FORGOT_PASSWORD, { email });
    },

    resetPassword: async (token: string, newPassword: string) => {
      return this.client.post(this.endpoints.AUTH.RESET_PASSWORD, {
        token,
        password: newPassword,
      });
    },

    refreshToken: async () => {
      return this.client.post(this.endpoints.AUTH.REFRESH);
    },
  };

  // 用户服务
  users = {
    getMe: async () => {
      return this.client.get(this.endpoints.USERS.ME, { useCache: true });
    },

    updateMe: async (data: { name?: string; avatar?: string }) => {
      const result = await this.client.patch(this.endpoints.USERS.ME, data);
      // 清除相关缓存
      this.client.clearCache('users/me');
      return result;
    },

    getUsers: async (params?: {
      department?: string;
      search?: string;
      pagination?: Partial<PaginationParams>;
    }) => {
      const url = new UrlBuilder(this.endpoints.USERS.LIST)
        .query('department', params?.department)
        .query('search', params?.search)
        .queries(params?.pagination || {})
        .build();
      
      return this.client.get(url, { useCache: true });
    },

    getUser: async (id: string) => {
      return this.client.get(this.endpoints.USERS.GET(id), { useCache: true });
    },

    updateUser: async (id: string, data: { name?: string; email?: string }) => {
      const result = await this.client.patch(this.endpoints.USERS.UPDATE(id), data);
      this.client.clearCache(`users/${id}`);
      return result;
    },

    deleteUser: async (id: string) => {
      const result = await this.client.delete(this.endpoints.USERS.DELETE(id));
      this.client.clearCache('users');
      return result;
    },

    uploadAvatar: async (id: string, file: any, onProgress?: (progress: number) => void) => {
      return this.client.upload(this.endpoints.USERS.AVATAR(id), file, { onProgress });
    },

    changePassword: async (data: {
      currentPassword: string;
      newPassword: string;
      confirmPassword: string;
    }) => {
      return this.client.post(this.endpoints.USERS.CHANGE_PASSWORD, data);
    },
  };

  // 会议服务
  meetings = {
    getMeetings: async (params?: {
      status?: 'scheduled' | 'ongoing' | 'ended' | 'canceled';
      pagination?: Partial<PaginationParams>;
    }) => {
      const url = new UrlBuilder(this.endpoints.MEETINGS.LIST)
        .query('status', params?.status)
        .queries(params?.pagination || {})
        .build();
      
      return this.client.get(url, { useCache: true });
    },

    getMeeting: async (id: string) => {
      return this.client.get(this.endpoints.MEETINGS.GET(id), { useCache: true });
    },

    createMeeting: async (data: {
      title: string;
      startTime: string;
      duration: number;
      participants: string[];
    }) => {
      const result = await this.client.post(this.endpoints.MEETINGS.CREATE, data);
      this.client.clearCache('meetings');
      return result;
    },

    updateMeeting: async (id: string, data: {
      title?: string;
      startTime?: string;
      duration?: number;
      participants?: string[];
    }) => {
      const result = await this.client.patch(this.endpoints.MEETINGS.UPDATE(id), data);
      this.client.clearCache(`meetings/${id}`);
      this.client.clearCache('meetings');
      return result;
    },

    deleteMeeting: async (id: string) => {
      const result = await this.client.delete(this.endpoints.MEETINGS.DELETE(id));
      this.client.clearCache('meetings');
      return result;
    },

    joinMeeting: async (id: string) => {
      return this.client.post(this.endpoints.MEETINGS.JOIN(id));
    },

    leaveMeeting: async (id: string) => {
      return this.client.post(this.endpoints.MEETINGS.LEAVE(id));
    },

    endMeeting: async (id: string) => {
      const result = await this.client.post(this.endpoints.MEETINGS.END(id));
      this.client.clearCache(`meetings/${id}`);
      return result;
    },
  };

  // 消息服务
  messages = {
    getMessages: async (params?: {
      conversationId?: string;
      pagination?: Partial<PaginationParams>;
    }) => {
      const url = new UrlBuilder(this.endpoints.MESSAGES.LIST)
        .query('conversationId', params?.conversationId)
        .queries(params?.pagination || {})
        .build();
      
      return this.client.get(url, { useCache: true });
    },

    sendMessage: async (data: {
      content: string;
      conversationId: string;
      type?: 'text' | 'image' | 'file';
      attachments?: string[];
    }) => {
      const result = await this.client.post(this.endpoints.MESSAGES.SEND, data);
      this.client.clearCache('messages');
      return result;
    },

    getMessage: async (id: string) => {
      return this.client.get(this.endpoints.MESSAGES.GET(id));
    },

    updateMessage: async (id: string, data: { content: string }) => {
      const result = await this.client.patch(this.endpoints.MESSAGES.UPDATE(id), data);
      this.client.clearCache(`messages/${id}`);
      return result;
    },

    deleteMessage: async (id: string) => {
      const result = await this.client.delete(this.endpoints.MESSAGES.DELETE(id));
      this.client.clearCache('messages');
      return result;
    },

    markAsRead: async (id: string) => {
      return this.client.post(this.endpoints.MESSAGES.MARK_READ(id));
    },

    uploadAttachment: async (file: any, onProgress?: (progress: number) => void) => {
      return this.client.upload(this.endpoints.MESSAGES.ATTACHMENTS, file, { onProgress });
    },
  };

  // 联系人服务
  contacts = {
    getContacts: async (params?: {
      search?: string;
      groupId?: string;
      pagination?: Partial<PaginationParams>;
    }) => {
      const url = new UrlBuilder(this.endpoints.CONTACTS.LIST)
        .query('search', params?.search)
        .query('groupId', params?.groupId)
        .queries(params?.pagination || {})
        .build();
      
      return this.client.get(url, { useCache: true });
    },

    addContact: async (data: {
      name: string;
      email?: string;
      phone?: string;
      department?: string;
    }) => {
      const result = await this.client.post(this.endpoints.CONTACTS.ADD, data);
      this.client.clearCache('contacts');
      return result;
    },

    getContact: async (id: string) => {
      return this.client.get(this.endpoints.CONTACTS.GET(id), { useCache: true });
    },

    updateContact: async (id: string, data: {
      name?: string;
      email?: string;
      phone?: string;
      department?: string;
    }) => {
      const result = await this.client.patch(this.endpoints.CONTACTS.UPDATE(id), data);
      this.client.clearCache(`contacts/${id}`);
      this.client.clearCache('contacts');
      return result;
    },

    deleteContact: async (id: string) => {
      const result = await this.client.delete(this.endpoints.CONTACTS.DELETE(id));
      this.client.clearCache('contacts');
      return result;
    },

    searchContacts: async (query: string) => {
      const url = new UrlBuilder(this.endpoints.CONTACTS.SEARCH)
        .query('q', query)
        .build();
      
      return this.client.get(url);
    },
  };

  // 文件服务
  files = {
    upload: async (file: any, onProgress?: (progress: number) => void) => {
      return this.client.upload(this.endpoints.FILES.UPLOAD, file, { onProgress });
    },

    download: async (id: string) => {
      return this.client.get(this.endpoints.FILES.DOWNLOAD(id));
    },

    getFileInfo: async (id: string) => {
      return this.client.get(this.endpoints.FILES.GET_INFO(id), { useCache: true });
    },

    deleteFile: async (id: string) => {
      const result = await this.client.delete(this.endpoints.FILES.DELETE(id));
      this.client.clearCache(`files/${id}`);
      return result;
    },

    getFiles: async (params?: {
      type?: string;
      pagination?: Partial<PaginationParams>;
    }) => {
      const url = new UrlBuilder(this.endpoints.FILES.LIST)
        .query('type', params?.type)
        .queries(params?.pagination || {})
        .build();
      
      return this.client.get(url, { useCache: true });
    },
  };

  // 通知服务
  notifications = {
    getNotifications: async (params?: {
      unreadOnly?: boolean;
      pagination?: Partial<PaginationParams>;
    }) => {
      const url = new UrlBuilder(this.endpoints.NOTIFICATIONS.LIST)
        .query('unreadOnly', params?.unreadOnly)
        .queries(params?.pagination || {})
        .build();
      
      return this.client.get(url, { useCache: true });
    },

    markAsRead: async (id: string) => {
      const result = await this.client.post(this.endpoints.NOTIFICATIONS.MARK_READ(id));
      this.client.clearCache('notifications');
      return result;
    },

    markAllAsRead: async () => {
      const result = await this.client.post(this.endpoints.NOTIFICATIONS.MARK_ALL_READ);
      this.client.clearCache('notifications');
      return result;
    },

    deleteNotification: async (id: string) => {
      const result = await this.client.delete(this.endpoints.NOTIFICATIONS.DELETE(id));
      this.client.clearCache('notifications');
      return result;
    },

    getSettings: async () => {
      return this.client.get(this.endpoints.NOTIFICATIONS.SETTINGS, { useCache: true });
    },

    updateSettings: async (settings: {
      emailNotifications?: boolean;
      pushNotifications?: boolean;
      meetingReminders?: boolean;
    }) => {
      const result = await this.client.patch(this.endpoints.NOTIFICATIONS.SETTINGS, settings);
      this.client.clearCache('notifications/settings');
      return result;
    },
  };

  // 系统服务
  system = {
    getHealth: async () => {
      return this.client.get(this.endpoints.SYSTEM.HEALTH);
    },

    getVersion: async () => {
      return this.client.get(this.endpoints.SYSTEM.VERSION, { useCache: true });
    },

    getConfig: async () => {
      return this.client.get(this.endpoints.SYSTEM.CONFIG, { useCache: true });
    },
  };

  // 工具方法
  utils = {
    // 清除所有缓存
    clearAllCache: () => {
      this.client.clearCache();
    },

    // 清除特定模式的缓存
    clearCacheByPattern: (pattern: string) => {
      this.client.clearCache(pattern);
    },

    // 检查网络连接
    checkConnection: async () => {
      try {
        await this.system.getHealth();
        return true;
      } catch {
        return false;
      }
    },
  };
}

// 创建默认实例
export const apiService = new ApiService();

// 导出类型
export type { ApiError, PaginationParams };