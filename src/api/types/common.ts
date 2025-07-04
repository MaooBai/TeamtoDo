import { z } from 'zod';

// 通用API响应结构
export const ApiResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  code: z.string().optional(),
  timestamp: z.string().optional(),
});

// 分页响应结构
export const PaginatedResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  ApiResponseSchema.extend({
    data: z.object({
      items: z.array(dataSchema),
      total: z.number(),
      page: z.number(),
      pageSize: z.number(),
      totalPages: z.number(),
    }),
  });

// 单个数据响应结构
export const DataResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  ApiResponseSchema.extend({
    data: dataSchema,
  });

// 分页请求参数
export const PaginationParamsSchema = z.object({
  page: z.number().min(1).default(1),
  pageSize: z.number().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type PaginationParams = z.infer<typeof PaginationParamsSchema>;

// 通用错误类型
export interface ApiError {
  status: number;
  message: string;
  code: string;
  details?: any;
}

// HTTP方法类型
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

// 请求配置类型
export interface RequestConfig {
  headers?: Record<string, string>;
  params?: Record<string, any>;
  timeout?: number;
  retries?: number;
}

// API端点配置
export interface ApiEndpoint {
  method: HttpMethod;
  url: string;
  config?: RequestConfig;
}