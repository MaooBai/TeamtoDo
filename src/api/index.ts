// 统一导出API相关模块

// 核心服务
export { default as apiService } from './services/apiService';
export { default as apiClient } from './client';

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

// 工具函数（需要根据实际情况更新）
// export {
//   ApiResponseHandler,
//   UrlBuilder,
//   paginationHelpers,
//   dataTransformers,
//   retryHelpers,
//   SimpleCache,
// } from './utils/helpers';

// React Query Hook

// 认证hooks
export {
  useLogin,
  useLogout,
  useCurrentUser,
  useAuthStatus,
  // useRegister,
  useForgotPassword,
  useResetPassword,
} from './hooks/useAuthSimple';

// API端点（保持向后兼容）
// 注意：这些模块需要根据实际情况进行更新或移除
// export { userApi } from './api/user';
// export { meetingApi } from './api/meeting';
// export { authApi } from './api/auth';

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
基于axios的网络框架使用示例：

1. 基础API服务使用（推荐）：
import { apiService } from '@/api';

// 用户相关操作
const user = await apiService.users.getMe();
const users = await apiService.users.getUsers({ search: 'john' });

// 认证操作
const loginResult = await apiService.auth.login({ email, password });
await apiService.auth.logout();

// 会议操作
const meetings = await apiService.meetings.getMeetings();
const newMeeting = await apiService.meetings.createMeeting({
  title: '团队会议',
  startTime: '2024-01-01T10:00:00Z',
  duration: 60,
  participants: ['user1', 'user2']
});

2. 使用React Query Hooks：
import { useApiQuery, useApiMutation, useLogin } from '@/api';

// 查询数据
const { data: user, isLoading, error } = useApiQuery(
  ['user', 'me'],
  () => apiService.users.getMe()
);

// 分页查询
const { data: meetings } = usePaginatedQuery(
  ['meetings'],
  '/api/v1/meetings',
  { status: 'scheduled', page: 1, pageSize: 20 }
);

// 认证hooks
const loginMutation = useLogin();
const handleLogin = () => {
  loginMutation.mutate({ email, password });
};

3. 直接使用axios客户端：
import { apiClient } from '@/api';

// GET请求
const response = await apiClient.get('/api/v1/users');

// POST请求
const result = await apiClient.post('/api/v1/meetings', meetingData);

// 文件上传
const formData = new FormData();
formData.append('file', file);
const uploadResult = await apiClient.post('/api/v1/files/upload', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});

4. 文件上传Hook：
import { useFileUpload } from '@/api';

const uploadMutation = useFileUpload();

const handleUpload = (file: File) => {
  uploadMutation.mutate({
    endpoint: '/api/v1/files/upload',
    file,
    onProgress: (progress) => console.log(`上传进度: ${progress}%`)
  });
};

5. 错误处理：
try {
  const result = await apiService.users.getMe();
} catch (error: ApiError) {
  console.error('API错误:', error.message, error.status);
}
*/