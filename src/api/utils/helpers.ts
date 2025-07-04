import { z } from 'zod';
import { ApiError, PaginationParams } from '../types/common';

// API响应数据验证和转换
export class ApiResponseHandler {
  // 验证并解析单个数据响应
  static parseDataResponse<T>(
    response: any,
    schema: z.ZodSchema<T>
  ): T {
    try {
      if (response?.data) {
        return schema.parse(response.data);
      }
      return schema.parse(response);
    } catch (error) {
      throw new Error(`数据解析失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  // 验证并解析分页数据响应
  static parsePaginatedResponse<T>(
    response: any,
    itemSchema: z.ZodSchema<T>
  ): {
    items: T[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  } {
    try {
      const data = response?.data || response;
      return {
        items: z.array(itemSchema).parse(data.items || data),
        total: data.total || 0,
        page: data.page || 1,
        pageSize: data.pageSize || 20,
        totalPages: data.totalPages || Math.ceil((data.total || 0) / (data.pageSize || 20)),
      };
    } catch (error) {
      throw new Error(`分页数据解析失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  // 处理API错误
  static handleApiError(error: any): ApiError {
    if (error.status && error.message && error.code) {
      return error as ApiError;
    }

    return {
      status: error.status || 500,
      message: error.message || '请求失败',
      code: error.code || 'UNKNOWN_ERROR',
      details: error,
    };
  }
}

// URL构建工具
export class UrlBuilder {
  private baseUrl: string;
  private pathSegments: string[] = [];
  private queryParams: Record<string, any> = {};

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  // 添加路径段
  path(segment: string | number): UrlBuilder {
    this.pathSegments.push(String(segment));
    return this;
  }

  // 添加查询参数
  query(key: string, value: any): UrlBuilder {
    if (value !== undefined && value !== null) {
      this.queryParams[key] = value;
    }
    return this;
  }

  // 批量添加查询参数
  queries(params: Record<string, any>): UrlBuilder {
    Object.entries(params).forEach(([key, value]) => {
      this.query(key, value);
    });
    return this;
  }

  // 构建最终URL
  build(): string {
    let url = this.baseUrl;
    
    if (this.pathSegments.length > 0) {
      url += '/' + this.pathSegments.join('/');
    }

    const queryString = this.buildQueryString();
    if (queryString) {
      url += '?' + queryString;
    }

    return url;
  }

  private buildQueryString(): string {
    const params = new URLSearchParams();
    
    Object.entries(this.queryParams).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach(item => params.append(key, String(item)));
      } else {
        params.append(key, String(value));
      }
    });

    return params.toString();
  }
}

// 分页参数处理
export const paginationHelpers = {
  // 标准化分页参数
  normalizePaginationParams(params: Partial<PaginationParams>): PaginationParams {
    return {
      page: Math.max(1, params.page || 1),
      pageSize: Math.min(100, Math.max(1, params.pageSize || 20)),
      sortBy: params.sortBy,
      sortOrder: params.sortOrder || 'desc',
    };
  },

  // 计算偏移量
  calculateOffset(page: number, pageSize: number): number {
    return (page - 1) * pageSize;
  },

  // 计算总页数
  calculateTotalPages(total: number, pageSize: number): number {
    return Math.ceil(total / pageSize);
  },
};

// 数据转换工具
export const dataTransformers = {
  // 将对象转换为FormData
  toFormData(obj: Record<string, any>): FormData {
    const formData = new FormData();
    
    Object.entries(obj).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (value instanceof File || value instanceof Blob) {
          formData.append(key, value);
        } else if (Array.isArray(value)) {
          value.forEach((item, index) => {
            formData.append(`${key}[${index}]`, String(item));
          });
        } else if (typeof value === 'object') {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, String(value));
        }
      }
    });
    
    return formData;
  },

  // 深度清理对象中的undefined和null值
  cleanObject<T extends Record<string, any>>(obj: T): Partial<T> {
    const cleaned: Partial<T> = {};
    
    Object.entries(obj).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (typeof value === 'object' && !Array.isArray(value)) {
          const cleanedNested = this.cleanObject(value);
          if (Object.keys(cleanedNested).length > 0) {
            cleaned[key as keyof T] = cleanedNested as T[keyof T];
          }
        } else {
          cleaned[key as keyof T] = value;
        }
      }
    });
    
    return cleaned;
  },

  // 将日期字符串转换为Date对象
  parseDates<T extends Record<string, any>>(
    obj: T,
    dateFields: (keyof T)[]
  ): T {
    const result = { ...obj };
    
    dateFields.forEach(field => {
      if (result[field] && typeof result[field] === 'string') {
        result[field] = new Date(result[field] as string) as T[keyof T];
      }
    });
    
    return result;
  },
};

// 请求重试工具
export const retryHelpers = {
  // 指数退避重试
  async withExponentialBackoff<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    let lastError: any;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        
        if (attempt === maxRetries) {
          break;
        }
        
        // 计算延迟时间（指数退避）
        const delay = baseDelay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError;
  },

  // 判断错误是否可重试
  isRetryableError(error: ApiError): boolean {
    // 网络错误或5xx服务器错误通常可以重试
    return (
      error.code === 'NETWORK_ERROR' ||
      error.status >= 500 ||
      error.status === 408 || // Request Timeout
      error.status === 429    // Too Many Requests
    );
  },
};

// 缓存工具
export class SimpleCache<T> {
  private cache = new Map<string, { data: T; timestamp: number; ttl: number }>();

  set(key: string, data: T, ttl: number = 5 * 60 * 1000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  get(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }
    
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  has(key: string): boolean {
    const item = this.cache.get(key);
    
    if (!item) {
      return false;
    }
    
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }
}