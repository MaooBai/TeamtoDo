import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { ApiError, RequestConfig } from '../types/common';
import { apiConfig } from '../config/config';

// 扩展的API客户端类
class EnhancedApiClient {
  private client: AxiosInstance;
  private baseURL: string;
  private defaultTimeout: number;
  private requestCache: Map<string, { data: any; timestamp: number }> = new Map();
  private cacheTimeout = 5 * 60 * 1000; // 5分钟缓存

  constructor(baseURL: string, timeout: number = 10000) {
    this.baseURL = baseURL;
    this.defaultTimeout = timeout;
    
    this.client = axios.create({
      baseURL,
      timeout,
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // 请求拦截器
    this.client.interceptors.request.use(
      async (config) => {
        // 为注册和登录请求添加详细日志
        if (config.url?.includes('/api/login') || config.url?.includes('/api/register')) {
          console.log('=== enhancedApiClient - 请求拦截器开始 ===');
          console.log('请求拦截器 - 完整URL:', `${config.baseURL || this.baseURL}${config.url}`);
          console.log('请求拦截器 - HTTP方法:', config.method?.toUpperCase());
          console.log('请求拦截器 - 原始请求数据:', JSON.stringify(config.data, null, 2));
          console.log('请求拦截器 - 数据详细分析:', {
            dataType: typeof config.data,
            isNull: config.data === null,
            isUndefined: config.data === undefined,
            isString: typeof config.data === 'string',
            isObject: typeof config.data === 'object',
            dataKeys: config.data && typeof config.data === 'object' ? Object.keys(config.data) : 'N/A',
            dataLength: config.data && typeof config.data === 'string' ? config.data.length : 'N/A'
          });
        }
        
        // 设置Content-Type
        if (config.url?.includes('/api/login') || config.url?.includes('/api/register')) {
          config.headers['Content-Type'] = 'application/x-www-form-urlencoded';
          
          // 将JSON数据转换为form-urlencoded格式
          if (config.data && typeof config.data === 'object') {
            const formData = new URLSearchParams();
            Object.keys(config.data).forEach(key => {
              formData.append(key, config.data[key]);
            });
            config.data = formData.toString();
            if (config.url?.includes('/api/login') || config.url?.includes('/api/register')) {
              console.log('请求拦截器 - 转换为form-urlencoded:', config.data);
            }
          }
        } else {
          config.headers['Content-Type'] = 'application/json';
        }
        
        // 添加认证token（如果存在）
        const token = await this.getAuthToken();
        if (token) {
          config.headers['Authorization'] = `Bearer ${token}`;
        }

        // 添加请求ID用于追踪
        config.headers['X-Request-ID'] = this.generateRequestId();
        
        // 为注册和登录请求添加最终数据日志
        if (config.url?.includes('/api/login') || config.url?.includes('/api/register')) {
          console.log('请求拦截器 - 最终数据验证:', {
            type: typeof config.data,
            isString: typeof config.data === 'string',
            isObject: typeof config.data === 'object',
            isNull: config.data === null,
            contentType: config.headers['Content-Type'],
            dataContent: config.data
          });
          console.log('请求拦截器 - 最终发送数据:', JSON.stringify(config.data, null, 2));
          console.log('请求拦截器 - 完整请求头:', JSON.stringify(config.headers, null, 2));
          console.log('请求拦截器 - 最终config对象:', {
            url: config.url,
            method: config.method,
            baseURL: config.baseURL,
            timeout: config.timeout,
            dataPresent: !!config.data,
            headersCount: Object.keys(config.headers || {}).length
          });
          console.log('=== enhancedApiClient - 请求拦截器结束，发送HTTP请求 ===');
        }
        
        return config;
      },
      (error) => Promise.reject(error)
    );

    // 响应拦截器
    this.client.interceptors.response.use(
      (response) => {
        // 为注册和登录请求添加响应日志
        if (response.config.url?.includes('/api/login') || response.config.url?.includes('/api/register')) {
          console.log('=== enhancedApiClient - 响应拦截器开始 ===');
          console.log('响应拦截器 - HTTP状态码:', response.status);
          console.log('响应拦截器 - 响应头:', JSON.stringify(response.headers, null, 2));
          console.log('响应拦截器 - 原始响应数据:', JSON.stringify(response.data, null, 2));
          console.log('响应拦截器 - 响应数据分析:', {
            dataType: typeof response.data,
            isNull: response.data === null,
            isUndefined: response.data === undefined,
            isObject: typeof response.data === 'object',
            hasCode: response.data && 'code' in response.data,
            hasMsg: response.data && 'msg' in response.data,
            hasData: response.data && 'data' in response.data,
            codeValue: response.data?.code,
            msgValue: response.data?.msg
          });
          console.log('=== enhancedApiClient - 响应拦截器结束，返回数据 ===');
        }
        
        // 统一处理成功响应
        return response.data;
      },
      async (error) => {
        // 统一错误处理
        const apiError = this.handleError(error);
        
        // 如果是401错误，尝试刷新token
        if (apiError.status === 401) {
          const refreshed = await this.refreshToken();
          if (refreshed && error.config) {
            // 重试原请求
            return this.client.request(error.config);
          }
        }
        
        return Promise.reject(apiError);
      }
    );
  }

  // 获取认证token
  private async getAuthToken(): Promise<string | null> {
    // 这里可以从AsyncStorage或其他存储中获取token
    // 暂时返回null，后续可以根据实际需求实现
    return null;
  }

  // 刷新token
  private async refreshToken(): Promise<boolean> {
    try {
      // 实现token刷新逻辑
      // 暂时返回false，后续可以根据实际需求实现
      return false;
    } catch {
      return false;
    }
  }

  // 生成请求ID
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // 错误处理
  private handleError(error: any): ApiError {
    if (error.response) {
      const { status, data } = error.response;
      return {
        status,
        message: data?.message || this.getDefaultErrorMessage(status),
        code: data?.code || `HTTP_${status}`,
        details: data,
      };
    }
    
    if (error.request) {
      return {
        status: 0,
        message: '网络连接错误',
        code: 'NETWORK_ERROR',
      };
    }
    
    return {
      status: 500,
      message: error.message || '未知错误',
      code: 'UNKNOWN_ERROR',
    };
  }

  // 获取默认错误消息
  private getDefaultErrorMessage(status: number): string {
    const messages: Record<number, string> = {
      400: '请求参数错误',
      401: '未授权访问',
      403: '禁止访问',
      404: '资源不存在',
      500: '服务器内部错误',
      502: '网关错误',
      503: '服务不可用',
    };
    return messages[status] || '请求失败';
  }

  // 生成缓存键
  private getCacheKey(method: string, url: string, params?: any): string {
    const paramStr = params ? JSON.stringify(params) : '';
    return `${method}_${url}_${paramStr}`;
  }

  // 检查缓存
  private getFromCache(cacheKey: string): any | null {
    const cached = this.requestCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    return null;
  }

  // 设置缓存
  private setCache(cacheKey: string, data: any): void {
    this.requestCache.set(cacheKey, {
      data,
      timestamp: Date.now(),
    });
  }

  // 清除缓存
  public clearCache(pattern?: string): void {
    if (pattern) {
      for (const key of this.requestCache.keys()) {
        if (key.includes(pattern)) {
          this.requestCache.delete(key);
        }
      }
    } else {
      this.requestCache.clear();
    }
  }

  // 带重试的请求方法
  private async requestWithRetry<T>(
    config: AxiosRequestConfig,
    retries: number = 3
  ): Promise<T> {
    for (let i = 0; i <= retries; i++) {
      try {
        const response = await this.client.request<T>(config);
        return response as T;
      } catch (error) {
        if (i === retries) {
          throw error;
        }
        // 等待一段时间后重试
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
      }
    }
    throw new Error('Max retries exceeded');
  }

  // GET请求
  async get<T>(
    url: string,
    config?: RequestConfig & { useCache?: boolean }
  ): Promise<T> {
    const { useCache = false, ...requestConfig } = config || {};
    
    if (useCache) {
      const cacheKey = this.getCacheKey('GET', url, requestConfig.params);
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        return cached;
      }
    }

    const response = await this.requestWithRetry<T>({
      method: 'GET',
      url,
      ...requestConfig,
    }, config?.retries);

    if (useCache) {
      const cacheKey = this.getCacheKey('GET', url, requestConfig.params);
      this.setCache(cacheKey, response);
    }

    return response;
  }

  // POST请求
  async post<T>(url: string, data?: any, config?: RequestConfig): Promise<T> {
    return this.requestWithRetry<T>({
      method: 'POST',
      url,
      data,
      ...config,
    }, config?.retries);
  }

  // PUT请求
  async put<T>(url: string, data?: any, config?: RequestConfig): Promise<T> {
    return this.requestWithRetry<T>({
      method: 'PUT',
      url,
      data,
      ...config,
    }, config?.retries);
  }

  // PATCH请求
  async patch<T>(url: string, data?: any, config?: RequestConfig): Promise<T> {
    return this.requestWithRetry<T>({
      method: 'PATCH',
      url,
      data,
      ...config,
    }, config?.retries);
  }

  // DELETE请求
  async delete<T>(url: string, config?: RequestConfig): Promise<T> {
    return this.requestWithRetry<T>({
      method: 'DELETE',
      url,
      ...config,
    }, config?.retries);
  }

  // 上传文件
  async upload<T>(
    url: string,
    file: any,
    config?: RequestConfig & { onProgress?: (progress: number) => void }
  ): Promise<T> {
    const formData = new FormData();
    formData.append('file', file);

    return this.requestWithRetry<T>({
      method: 'POST',
      url,
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
        ...config?.headers,
      },
      onUploadProgress: (progressEvent) => {
        if (config?.onProgress && progressEvent.total) {
          const progress = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          config.onProgress(progress);
        }
      },
      ...config,
    }, config?.retries);
  }
}

// 创建默认实例
export const enhancedApiClient = new EnhancedApiClient(apiConfig.baseURL, apiConfig.timeout);

// 导出类以便创建其他实例
export { EnhancedApiClient };