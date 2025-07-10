// 基于axios的API客户端
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { apiConfig } from './config/config';
import { ApiError, RequestConfig } from './types/common';

// 创建axios实例
const createAxiosInstance = (): AxiosInstance => {
  const instance = axios.create({
    baseURL: apiConfig.baseURL,
    timeout: apiConfig.timeout,
    headers: apiConfig.headers,
  });

  // 请求拦截器
  instance.interceptors.request.use(
    async (config) => {
      // 添加认证token
      const token = await getAuthToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      // 添加请求ID
      config.headers['X-Request-ID'] = generateRequestId();

      // 日志记录
      if (apiConfig.enableLogging) {
        console.log('API Request:', {
          method: config.method?.toUpperCase(),
          url: config.url,
          data: config.data,
        });
      }

      return config;
    },
    (error) => Promise.reject(error)
  );

  // 响应拦截器
  instance.interceptors.response.use(
    (response: AxiosResponse) => {
      // 日志记录
      if (apiConfig.enableLogging) {
        console.log('API Response:', {
          status: response.status,
          data: response.data,
        });
      }

      return response.data;
    },
    async (error: AxiosError) => {
      const apiError = handleError(error);
      
      // 401错误处理
      if (apiError.status === 401) {
        await handleUnauthorized();
      }

      return Promise.reject(apiError);
    }
  );

  return instance;
};

// 获取认证token
const getAuthToken = async (): Promise<string | null> => {
  // TODO: 从存储中获取token
  return null;
};

// 处理未授权错误
const handleUnauthorized = async (): Promise<void> => {
  // TODO: 清除token，跳转到登录页
  console.log('Unauthorized access, redirecting to login...');
};

// 生成请求ID
const generateRequestId = (): string => {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// 错误处理
const handleError = (error: AxiosError): ApiError => {
  if (error.response) {
    const { status, data } = error.response;
    return {
      status,
      message: (data as any)?.message || getDefaultErrorMessage(status),
      code: (data as any)?.code || `HTTP_${status}`,
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
};

// 获取默认错误消息
const getDefaultErrorMessage = (status: number): string => {
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
};

// 创建API客户端实例
const apiClient = createAxiosInstance();

// 导出API客户端
export default apiClient;

// 导出类型
export type { ApiError, RequestConfig };