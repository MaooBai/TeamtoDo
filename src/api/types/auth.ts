import { Children } from 'react';
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
  nickName: z.string().nullable(),
  userName: z.string().nullable(),
  email: z.string().nullable(),
  phonenumber: z.string().nullable(),
  sex: z.string().nullable(),
  avatar: z.string().nullable(),
  deptId: z.number().nullable(),
  deptName: z.string().nullable()
});

export const DeptTreeDataSchema: z.ZodType<{
  id: number;
  label: string;
  disabled: boolean;
  children?: Array<{
    id: number;
    label: string;
    disabled: boolean;
    children?: any;
  }>;
}> = z.object({
  id: z.number(),
  label: z.string(),
  disabled: z.boolean(),
  children: z.array(z.lazy(() => DeptTreeDataSchema)).optional()
});

export const UsersataSchema = z.object(
  {
    userId: z.number(),
    nickName: z.string(),
    email: z.string(),
    phonenumber: z.string(),
    sex: z.string(),
    avatar: z.string(),
    deptId: z.number(),
  }
)

// 通讯录联系人类型
export const ContactSchema = z.object({
  id: z.number(),
  name: z.string(),
  phone: z.string(),
  email: z.string(),
  avatar: z.string(),
  deptId: z.number(),
  deptName: z.string(),
  position: z.string().optional(),
});

// 通讯录部门结构类型
export const ContactDeptSchema: z.ZodType<{
  id: number;
  name: string;
  contacts: Array<{
    id: number;
    name: string;
    phone: string;
    email: string;
    avatar: string;
    deptId: number;
    deptName: string;
    position?: string;
  }>;
  children?: Array<{
    id: number;
    name: string;
    contacts: any[];
    children?: any;
  }>;
}> = z.object({
  id: z.number(),
  name: z.string(),
  contacts: z.array(ContactSchema),
  children: z.array(z.lazy(() => ContactDeptSchema)).optional()
});

// 通讯录响应结构
export const ContactsResponseSchema = z.object({
  msg: z.string(),
  code: z.number(),
  departments: z.array(ContactDeptSchema),
});

export type LoginData = z.infer<typeof LoginDataSchema>;

export const UsersDataSchemaResponse = z.object({
  msg: z.string(),
  code: z.number(),
  data: z.array(UsersataSchema),
})

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

export const UserResponseSchemaSchema = z.object({
  msg: z.string(),
  code: z.number(),
  data: LoginDataSchema.optional(),
});

export const DeptTreeSchema = z.object({
  msg: z.string(),
  code: z.number(),
  depts: z.array(DeptTreeDataSchema).optional(),
})

export type LoginResponse = z.infer<typeof LoginResponseSchema>;
export type RegisterResponse = z.infer<typeof RegisterResponseSchema>;
export type UserResponse = z.infer<typeof UserResponseSchemaSchema>;
export type DeptTreeData = z.infer<typeof DeptTreeSchema>;
export type UsersDataResponse = z.infer<typeof UsersDataSchemaResponse>;
export type Contact = z.infer<typeof ContactSchema>;
export type ContactDept = z.infer<typeof ContactDeptSchema>;
export type ContactsResponse = z.infer<typeof ContactsResponseSchema>;

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


export const MessageRequestSchema = z.object({
  userId: z.string(),
  type: z.string(),
  content: z.string(),
  data: z.array(z.unknown()).optional(),
})

export type MessageRequest = z.infer<typeof MessageRequestSchema>;


