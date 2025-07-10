# Axios网络框架重构说明

## 概述

本项目已将网络框架重构为基于axios的简洁架构，移除了复杂的增强客户端，采用更直接和易维护的方式。

## 主要变更

### 1. 核心客户端 (`client.ts`)
- 使用原生axios创建实例
- 简化的请求/响应拦截器
- 统一的错误处理
- 自动token管理
- 请求日志记录

### 2. API服务类 (`services/apiService.ts`)
- 基于axios客户端的服务封装
- 按功能模块组织（auth, users, meetings, messages等）
- 简洁的方法调用
- 统一的参数处理

### 3. React Query Hooks (`hooks/useApi.ts`)
- `useApiQuery` - 通用查询hook
- `useApiMutation` - 通用变更hook
- `useFileUpload` - 文件上传hook
- `usePaginatedQuery` - 分页查询hook
- `useInfiniteApiQuery` - 无限滚动查询hook

### 4. 认证Hooks (`hooks/useAuthSimple.ts`)
- `useLogin` - 登录
- `useLogout` - 登出
- `useRegister` - 注册
- `useCurrentUser` - 获取当前用户
- `useAuthStatus` - 认证状态检查
- `useForgotPassword` - 忘记密码
- `useResetPassword` - 重置密码

## 使用方式

### 基础API调用
```typescript
import { apiService } from '@/api';

// 获取用户信息
const user = await apiService.users.getMe();

// 登录
const result = await apiService.auth.login({ email, password });

// 创建会议
const meeting = await apiService.meetings.createMeeting({
  title: '团队会议',
  startTime: '2024-01-01T10:00:00Z',
  duration: 60,
  participants: ['user1', 'user2']
});
```

### React Query Hooks
```typescript
import { useApiQuery, useLogin, useFileUpload } from '@/api';

// 查询数据
const { data: user, isLoading } = useApiQuery(
  ['user', 'me'],
  () => apiService.users.getMe()
);

// 登录
const loginMutation = useLogin();
loginMutation.mutate({ email, password });

// 文件上传
const uploadMutation = useFileUpload();
uploadMutation.mutate({
  endpoint: '/api/v1/files/upload',
  file: selectedFile,
  onProgress: (progress) => console.log(`${progress}%`)
});
```

### 直接使用axios客户端
```typescript
import { apiClient } from '@/api';

// GET请求
const response = await apiClient.get('/api/v1/users');

// POST请求
const result = await apiClient.post('/api/v1/data', payload);
```

## 配置

### 环境配置 (`config/config.ts`)
- 支持development、staging、production环境
- 可配置baseURL、timeout、重试次数等
- 统一的错误码和状态码定义

### API端点 (`config/endpoints.ts`)
- 集中管理所有API端点
- 支持动态参数
- 版本化支持

## 错误处理

```typescript
try {
  const result = await apiService.users.getMe();
} catch (error: ApiError) {
  console.error('API错误:', {
    status: error.status,
    message: error.message,
    code: error.code,
    details: error.details
  });
}
```

## 迁移指南

### 从旧的enhancedApiClient迁移

**旧方式：**
```typescript
import { enhancedApiClient } from '@/api';
const result = await enhancedApiClient.get('/users', { useCache: true });
```

**新方式：**
```typescript
import { apiService } from '@/api';
const result = await apiService.users.getUsers();

// 或直接使用axios客户端
import { apiClient } from '@/api';
const result = await apiClient.get('/api/v1/users');
```

### 缓存策略
新架构移除了内置缓存，推荐使用React Query的缓存机制：

```typescript
const { data } = useApiQuery(
  ['users', 'list'],
  () => apiService.users.getUsers(),
  {
    staleTime: 5 * 60 * 1000, // 5分钟
    cacheTime: 10 * 60 * 1000, // 10分钟
  }
);
```

## 优势

1. **简洁性** - 移除了复杂的增强功能，代码更易理解
2. **可维护性** - 基于标准axios，社区支持好
3. **性能** - 减少了不必要的抽象层
4. **灵活性** - 可以轻松扩展和自定义
5. **类型安全** - 完整的TypeScript支持

## 注意事项

1. 旧的`enhancedApiClient`已被移除，需要更新相关引用
2. 缓存功能现在通过React Query实现
3. 文件上传需要使用FormData格式
4. 错误处理统一使用ApiError类型
5. 认证token管理需要根据实际需求实现存储逻辑

## 后续优化

1. 实现token自动刷新机制
2. 添加请求重试逻辑
3. 完善离线支持
4. 添加请求取消功能
5. 优化错误提示用户体验