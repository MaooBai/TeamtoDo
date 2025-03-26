import { z } from 'zod';
import apiClient from '../client';

// 使用Zod定义响应数据结构
const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  avatar: z.string().url().optional(),
});

export type User = z.infer<typeof UserSchema>;

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