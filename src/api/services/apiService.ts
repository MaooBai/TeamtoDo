// 基于axios的API服务类
import apiClient from '../client';
import { API_ENDPOINTS } from '../config/endpoints';
import { PaginationParams } from '../types/common';
import { LoginRequest, LoginResponse, RegisterResponse, RegisterRequest, UserResponse, DeptTreeData, UsersDataResponse,MessageRequestSchema, MessageRequest } from '../types/auth';

// API服务类
class ApiService {
  // 认证服务
  auth = {
    login: async (credentials: LoginRequest): Promise<LoginResponse> => {
      return apiClient.get(API_ENDPOINTS.AUTH.LOGIN, { params: credentials });
    },

    // logout: async (): Promise<void> => {
    //   return apiClient.post(API_ENDPOINTS.AUTH.LOGOUT);
    // },

    register: async (register: RegisterRequest): Promise<RegisterResponse> => {
      return apiClient.post(API_ENDPOINTS.AUTH.REGISTER, {
        username: register.username,
        password: register.password,
        email: register.email
      });
    },

    forgotPassword: async (email: string): Promise<void> => {
      return apiClient.post(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, { email });
    },

    resetPassword: async (token: string, newPassword: string) => {
      return apiClient.post(API_ENDPOINTS.AUTH.RESET_PASSWORD, {
        token,
        password: newPassword,
      });
    },

    refreshToken: async () => {
      return apiClient.post(API_ENDPOINTS.AUTH.REFRESH);
    },
  };

  // 用户服务
  users = {
    getMe: async () : Promise<UserResponse> => {
      return apiClient.get(API_ENDPOINTS.USERS.ME);
    },

    updateMe: async (data: { name?: string; avatar?: string }) => {
      return apiClient.patch(API_ENDPOINTS.USERS.ME, data);
    },

    getUsers: async (): Promise<UsersDataResponse> => {
      return apiClient.get(API_ENDPOINTS.USERS.LIST);
    },

    getUser: async (id: string) => {
      return apiClient.get(API_ENDPOINTS.USERS.GET(id));
    },

    updateUser: async (id: string, data: { name?: string; email?: string }) => {
      return apiClient.patch(API_ENDPOINTS.USERS.UPDATE(id), data);
    },

    deleteUser: async (id: string) => {
      return apiClient.delete(API_ENDPOINTS.USERS.DELETE(id));
    },

    uploadAvatar: async (id: string, file: FormData) => {
      return apiClient.post(API_ENDPOINTS.USERS.AVATAR(id), file, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    },

    changePassword: async (data: {
      currentPassword: string;
      newPassword: string;
      confirmPassword: string;
    }) => {
      return apiClient.post(API_ENDPOINTS.USERS.CHANGE_PASSWORD, data);
    },
  };

  // 会议服务
  meetings = {
    getMeetings: async (params?: {
      status?: 'scheduled' | 'ongoing' | 'ended' | 'canceled';
      pagination?: Partial<PaginationParams>;
    }) => {
      return apiClient.get(API_ENDPOINTS.MEETINGS.LIST, { params });
    },

    getMeeting: async (id: string) => {
      return apiClient.get(API_ENDPOINTS.MEETINGS.GET(id));
    },

    createMeeting: async (data: {
      title: string;
      startTime: string;
      duration: number;
      participants: string[];
    }) => {
      return apiClient.post(API_ENDPOINTS.MEETINGS.CREATE, data);
    },

    updateMeeting: async (id: string, data: {
      title?: string;
      startTime?: string;
      duration?: number;
      participants?: string[];
    }) => {
      return apiClient.patch(API_ENDPOINTS.MEETINGS.UPDATE(id), data);
    },

    deleteMeeting: async (id: string) => {
      return apiClient.delete(API_ENDPOINTS.MEETINGS.DELETE(id));
    },

    joinMeeting: async (id: string) => {
      return apiClient.post(API_ENDPOINTS.MEETINGS.JOIN(id));
    },

    leaveMeeting: async (id: string) => {
      return apiClient.post(API_ENDPOINTS.MEETINGS.LEAVE(id));
    },

    endMeeting: async (id: string) => {
      return apiClient.post(API_ENDPOINTS.MEETINGS.END(id));
    },
  };

  // 消息服务
  messages = {
    getMessages: async (params?: {
      conversationId?: string;
      pagination?: Partial<PaginationParams>;
    }) => {
      return apiClient.get(API_ENDPOINTS.MESSAGES.LIST, { params });
    },

    sendMessage: async (data : MessageRequest) => {
      return apiClient.post(API_ENDPOINTS.MESSAGES.SEND, {
         content : data.content,
         userId : data.userId,
         type : data.type,
         data : data.data});
    },

    getMessage: async (id: string) => {
      return apiClient.get(API_ENDPOINTS.MESSAGES.GET(id));
    },

    updateMessage: async (id: string, data: { content: string }) => {
      return apiClient.patch(API_ENDPOINTS.MESSAGES.UPDATE(id), data);
    },

    deleteMessage: async (id: string) => {
      return apiClient.delete(API_ENDPOINTS.MESSAGES.DELETE(id));
    },

    markAsRead: async (id: string) => {
      return apiClient.post(API_ENDPOINTS.MESSAGES.MARK_READ(id));
    },

    uploadAttachment: async (file: FormData) => {
      return apiClient.post(API_ENDPOINTS.MESSAGES.ATTACHMENTS, file, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    },
  };

  // 联系人服务
  contacts = {
    // 获取部门树
    getContacts: async (): Promise<DeptTreeData> => {
      return apiClient.get(API_ENDPOINTS.CONTACTS.DEPT_TREE);
    },

    addContact: async (data: {
      name: string;
      email?: string;
      phone?: string;
      department?: string;
    }) => {
      return apiClient.post(API_ENDPOINTS.CONTACTS.ADD, data);
    },

    getContact: async (id: string) => {
      return apiClient.get(API_ENDPOINTS.CONTACTS.GET(id));
    },

    updateContact: async (id: string, data: {
      name?: string;
      email?: string;
      phone?: string;
      department?: string;
    }) => {
      return apiClient.patch(API_ENDPOINTS.CONTACTS.UPDATE(id), data);
    },

    deleteContact: async (id: string) => {
      return apiClient.delete(API_ENDPOINTS.CONTACTS.DELETE(id));
    },

    searchContacts: async (query: string) => {
      return apiClient.get(API_ENDPOINTS.CONTACTS.SEARCH, {
        params: { q: query },
      });
    },
  };

  // 文件服务
  files = {
    upload: async (file: FormData) => {
      return apiClient.post(API_ENDPOINTS.FILES.UPLOAD, file, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    },

    download: async (id: string) => {
      return apiClient.get(API_ENDPOINTS.FILES.DOWNLOAD(id), {
        responseType: 'blob',
      });
    },

    getFileInfo: async (id: string) => {
      return apiClient.get(API_ENDPOINTS.FILES.GET_INFO(id));
    },

    deleteFile: async (id: string) => {
      return apiClient.delete(API_ENDPOINTS.FILES.DELETE(id));
    },

    getFiles: async (params?: {
      type?: string;
      pagination?: Partial<PaginationParams>;
    }) => {
      return apiClient.get(API_ENDPOINTS.FILES.LIST, { params });
    },
  };

  // 通知服务
  notifications = {
    getNotifications: async (params?: {
      unreadOnly?: boolean;
      pagination?: Partial<PaginationParams>;
    }) => {
      return apiClient.get(API_ENDPOINTS.NOTIFICATIONS.LIST, { params });
    },

    markAsRead: async (id: string) => {
      return apiClient.post(API_ENDPOINTS.NOTIFICATIONS.MARK_READ(id));
    },

    markAllAsRead: async () => {
      return apiClient.post(API_ENDPOINTS.NOTIFICATIONS.MARK_ALL_READ);
    },

    deleteNotification: async (id: string) => {
      return apiClient.delete(API_ENDPOINTS.NOTIFICATIONS.DELETE(id));
    },

    getSettings: async () => {
      return apiClient.get(API_ENDPOINTS.NOTIFICATIONS.SETTINGS);
    },

    updateSettings: async (settings: {
      emailNotifications?: boolean;
      pushNotifications?: boolean;
      meetingReminders?: boolean;
    }) => {
      return apiClient.patch(API_ENDPOINTS.NOTIFICATIONS.SETTINGS, settings);
    },
  };

  // 系统服务
  system = {
    getHealth: async () => {
      return apiClient.get(API_ENDPOINTS.SYSTEM.HEALTH);
    },

    getVersion: async () => {
      return apiClient.get(API_ENDPOINTS.SYSTEM.VERSION);
    },

    getConfig: async () => {
      return apiClient.get(API_ENDPOINTS.SYSTEM.CONFIG);
    },
  };
}

// 创建并导出API服务实例
export const apiService = new ApiService();
export default apiService;

// 导出类型
export type { PaginationParams };