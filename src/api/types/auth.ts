import { z } from 'zod';

// 登录请求参数
export const LoginRequestSchema = z.object({
  username: z.string(),
  password: z.string(),
});

//注册请求参数
export const RegisterRequestSchema = z.object({
  username: z.string(),
  email: z.string(),
  password: z.string(),
});

export type LoginRequest = z.infer<typeof LoginRequestSchema>;
export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;

// 登录响应数据
export const LoginDataSchema = z.object({
  userId: z.number().nullable(),
  loginName: z.string().nullable(),
  userName: z.string().nullable(),
  email: z.string().nullable(),
  phonenumber: z.string().nullable(),
  sex: z.string().nullable(),
  avatar: z.string().nullable(),
  status: z.string().nullable(),
  loginIp: z.string().nullable(),
  loginDate: z.string().nullable(),
  deptId: z.number().nullable(),
  deptName: z.string().nullable(),
  roleIds: z.array(z.number()).nullable(),
});

export type LoginData = z.infer<typeof LoginDataSchema>;

// 登录响应结构
export const LoginResponseSchema = z.object({
  msg: z.string(),
  code: z.number(),
  token: z.string().optional(), // 将data设为可选，以处理登录失败的情况
});

export const RegisterResponseSchema = z.object({
  msg: z.string(),
  code: z.number(),
  token: z.string().optional(),
});

export type LoginResponse = z.infer<typeof LoginResponseSchema>;
export type RegisterResponse = z.infer<typeof RegisterResponseSchema>;

// 认证状态
export interface AuthState {
  isAuthenticated: boolean;
  user: LoginData | null;
  token: string | null;
  loading: boolean;
  error: string | null;
}

// 认证操作类型
export type AuthAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: { user: LoginData; token?: string } }
  | { type: 'LOGIN_FAILURE'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'CLEAR_ERROR' };