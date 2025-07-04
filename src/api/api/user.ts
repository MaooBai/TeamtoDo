import { z } from 'zod';
import apiClient from '../client';
import { enhancedApiClient } from '../utils/client';
import { ApiResponseHandler } from '../utils/helpers';
import { VERSIONED_ENDPOINTS } from '../config/endpoints';

// 使用Zod定义响应数据结构
export const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  avatar: z.string().url().optional(),
  department: z.string().optional(),
  phone: z.string().optional(),
  role: z.enum(['admin', 'user', 'manager']).default('user'),
  status: z.enum(['active', 'inactive', 'pending']).default('active'),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type User = z.infer<typeof UserSchema>;

// 兼容旧版本的API（保持向后兼容）
export const userApi = {
  // 获取当前用户信息
  getMe: () => apiClient.get<User>('/users/me').then(res => UserSchema.parse(res)),

  // 更新用户信息
  updateMe: (data: Partial<Pick<User, 'name' | 'avatar'>>) => 
    apiClient.patch<User>('/users/me', data).then(res => UserSchema.parse(res)),

  // 获取用户列表
  getUsers: (params?: { department?: string }) =>
    apiClient.get<User[]>('/users', { params }).then(res => z.array(UserSchema).parse(res)),
};

// 新版本的API（推荐使用）
export const userApiV2 = {
  // 获取当前用户信息
  getMe: async () => {
    const response = await enhancedApiClient.get(VERSIONED_ENDPOINTS.USERS.ME, {
      useCache: true,
    });
    return ApiResponseHandler.parseDataResponse(response, UserSchema);
  },

  // 更新用户信息
  updateMe: async (data: Partial<Pick<User, 'name' | 'avatar' | 'phone' | 'department'>>) => {
    const response = await enhancedApiClient.patch(VERSIONED_ENDPOINTS.USERS.ME, data);
    return ApiResponseHandler.parseDataResponse(response, UserSchema);
  },

  // 获取用户列表（支持分页）
  getUsers: async (params?: {
    department?: string;
    search?: string;
    status?: User['status'];
    page?: number;
    pageSize?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) => {
    const response = await enhancedApiClient.get(VERSIONED_ENDPOINTS.USERS.LIST, {
      params,
      useCache: true,
    });
    return ApiResponseHandler.parsePaginatedResponse(response, UserSchema);
  },

  // 获取单个用户信息
  getUser: async (id: string) => {
    const response = await enhancedApiClient.get(VERSIONED_ENDPOINTS.USERS.GET(id), {
      useCache: true,
    });
    return ApiResponseHandler.parseDataResponse(response, UserSchema);
  },

  // 更新用户信息（管理员）
  updateUser: async (id: string, data: Partial<Omit<User, 'id' | 'createdAt' | 'updatedAt'>>) => {
    const response = await enhancedApiClient.patch(VERSIONED_ENDPOINTS.USERS.UPDATE(id), data);
    return ApiResponseHandler.parseDataResponse(response, UserSchema);
  },

  // 删除用户（管理员）
  deleteUser: async (id: string) => {
    await enhancedApiClient.delete(VERSIONED_ENDPOINTS.USERS.DELETE(id));
    return { success: true, id };
  },

  // 上传头像
  uploadAvatar: async (file: any, onProgress?: (progress: number) => void) => {
    const response = await enhancedApiClient.upload(
      VERSIONED_ENDPOINTS.USERS.AVATAR('me'),
      file,
      { onProgress }
    );
    return ApiResponseHandler.parseDataResponse(response, z.object({
      avatarUrl: z.string().url(),
    }));
  },

  // 修改密码
  changePassword: async (data: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }) => {
    const response = await enhancedApiClient.post(
      VERSIONED_ENDPOINTS.USERS.CHANGE_PASSWORD,
      data
    );
    return ApiResponseHandler.parseDataResponse(response, z.object({
      success: z.boolean(),
      message: z.string(),
    }));
  },
};