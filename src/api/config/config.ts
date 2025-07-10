// API配置类型定义
export interface ApiConfig {
  baseURL: string;
  timeout: number;
  retries: number;
  retryDelay: number;
  cacheTimeout: number;
  enableLogging: boolean;
  enableCache: boolean;
  headers: Record<string, string>;
}

// 环境类型
export type Environment = 'development' | 'staging' | 'production';

// 不同环境的配置
const environmentConfigs: Record<Environment, Partial<ApiConfig>> = {
  development: {
    baseURL: 'http://192.168.5.2:9090',
    timeout: 15000,
    retries: 3,
    retryDelay: 1000,
    enableLogging: true,
    enableCache: true,
  },
  staging: {
    baseURL: 'https://staging-api.teamtodo.com',
    timeout: 10000,
    retries: 3,
    retryDelay: 1000,
    enableLogging: true,
    enableCache: true,
  },
  production: {
    baseURL: 'https://api.teamtodo.com',
    timeout: 8000,
    retries: 2,
    retryDelay: 2000,
    enableLogging: false,
    enableCache: true,
  },
};

// 默认配置
const defaultConfig: ApiConfig = {
  baseURL: 'http://localhost:3000',
  timeout: 10000,
  retries: 3,
  retryDelay: 1000,
  cacheTimeout: 5 * 60 * 1000, // 5分钟
  enableLogging: true,
  enableCache: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
};

// 获取当前环境
function getCurrentEnvironment(): Environment {
  // 在React Native中，可以通过__DEV__判断开发环境
  if (__DEV__) {
    return 'development';
  }
  
  // 可以通过环境变量或其他方式判断
  // 这里简化处理，实际项目中可能需要更复杂的逻辑
  return 'production';
}

// 合并配置
function mergeConfigs(base: ApiConfig, override: Partial<ApiConfig>): ApiConfig {
  return {
    ...base,
    ...override,
    headers: {
      ...base.headers,
      ...override.headers,
    },
  };
}

// 获取API配置
export function getApiConfig(environment?: Environment): ApiConfig {
  const env = environment || getCurrentEnvironment();
  const envConfig = environmentConfigs[env] || {};
  return mergeConfigs(defaultConfig, envConfig);
}

// 导出当前环境的配置
export const apiConfig = getApiConfig();

// HTTP状态码常量
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
} as const;

// 错误代码常量
export const ERROR_CODES = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const;

// 请求头常量
export const REQUEST_HEADERS = {
  AUTHORIZATION: 'Authorization',
  CONTENT_TYPE: 'Content-Type',
  ACCEPT: 'Accept',
  USER_AGENT: 'User-Agent',
  X_REQUEST_ID: 'X-Request-ID',
  X_API_VERSION: 'X-API-Version',
} as const;

// 内容类型常量
export const CONTENT_TYPES = {
  JSON: 'application/json',
  FORM_DATA: 'multipart/form-data',
  URL_ENCODED: 'application/x-www-form-urlencoded',
  TEXT: 'text/plain',
} as const;

// 缓存策略配置
export const CACHE_STRATEGIES = {
  NO_CACHE: 'no-cache',
  CACHE_FIRST: 'cache-first',
  NETWORK_FIRST: 'network-first',
  CACHE_ONLY: 'cache-only',
  NETWORK_ONLY: 'network-only',
} as const;

// React Query配置
export const REACT_QUERY_CONFIG = {
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5分钟
      cacheTime: 10 * 60 * 1000, // 10分钟
      retry: (failureCount: number, error: any) => {
        // 4xx错误不重试，5xx错误重试最多3次
        if (error?.status >= 400 && error?.status < 500) {
          return false;
        }
        return failureCount < 3;
      },
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
    },
  },
};

// 日志配置
export const LOGGING_CONFIG = {
  enableRequestLogging: apiConfig.enableLogging,
  enableResponseLogging: apiConfig.enableLogging,
  enableErrorLogging: true,
  logLevel: __DEV__ ? 'debug' : 'error',
};