// 统一导出API相关模块

// 核心服务
export { apiService, ApiService } from './services/service';
export { enhancedApiClient, EnhancedApiClient } from './utils/client';

// 配置
export { apiConfig, getApiConfig } from './config/config';
export { API_ENDPOINTS, VERSIONED_ENDPOINTS, buildApiUrl } from './config/endpoints';

// 类型定义
export type {
  ApiError,
  PaginationParams,
  HttpMethod,
  RequestConfig,
  ApiEndpoint,
} from './types/common';

// 认证类型
export type {
  LoginRequest,
  LoginResponse,
  LoginData,
  AuthState,
  AuthAction,
} from './types/auth';

// 工具函数
export {
  ApiResponseHandler,
  UrlBuilder,
  paginationHelpers,
  dataTransformers,
  retryHelpers,
  SimpleCache,
} from './utils/helpers';

// React Query Hooks
export {
  useApiQuery,
  usePaginatedQuery,
  useApiMutation,
  useCrudOperations,
  useFileUpload,
  useBatchOperation,
} from './hooks/useApiQuery';

// 现有的hooks（保持向后兼容）
export { useUser } from './hooks/useUser';

// 认证hooks
export {
  useAuth,
  useLogin,
  useLogout,
  useCurrentUser,
  useAuthStatus,
} from './hooks/useAuth';

// API端点（保持向后兼容）
export { userApi } from './api/user';
export { meetingApi } from './api/meeting';
export { authApi } from './api/auth';

// 现有的client（保持向后兼容）
export { default as apiClient } from './client';

// 常量
export {
  HTTP_STATUS,
  ERROR_CODES,
  REQUEST_HEADERS,
  CONTENT_TYPES,
  CACHE_STRATEGIES,
  REACT_QUERY_CONFIG,
  LOGGING_CONFIG,
} from './config/config';

// 快速使用示例
/*
使用示例：

1. 基础使用（推荐）：
import { apiService } from '@/api';

// 获取用户信息
const user = await apiService.users.getMe();

// 发送消息
const message = await apiService.messages.sendMessage({
  content: 'Hello',
  conversationId: '123'
});

2. 使用React Query Hooks：
import { useApiQuery, usePaginatedQuery } from '@/api';

// 获取用户信息
const { data: user, isLoading } = useApiQuery(
  ['user', 'me'],
  () => apiService.users.getMe()
);

// 分页获取会议列表
const { data: meetings } = usePaginatedQuery(
  ['meetings'],
  '/api/v1/meetings',
  MeetingSchema,
  { pagination: { page: 1, pageSize: 20 } }
);

3. 使用CRUD操作：
import { useCrudOperations } from '@/api';

const {
  useList,
  useGet,
  useCreate,
  useUpdate,
  useDelete
} = useCrudOperations('users', {
  list: '/api/v1/users',
  get: (id) => `/api/v1/users/${id}`,
  create: '/api/v1/users',
  update: (id) => `/api/v1/users/${id}`,
  delete: (id) => `/api/v1/users/${id}`,
}, UserSchema);

4. 直接使用增强客户端：
import { enhancedApiClient } from '@/api';

const response = await enhancedApiClient.get('/api/v1/users', {
  useCache: true,
  retries: 3
});

5. 文件上传：
import { useFileUpload } from '@/api';

const uploadMutation = useFileUpload();

uploadMutation.mutate({
  file: selectedFile,
  endpoint: '/api/v1/files/upload',
  onProgress: (progress) => console.log(`上传进度: ${progress}%`)
});
*/