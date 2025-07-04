# TeamToDo 网络框架架构介绍

## 📋 概述

TeamToDo 项目采用了现代化的网络通信框架，基于 TypeScript、Axios、React Query 和 Zod 构建，提供类型安全、高性能的 API 通信解决方案。

## 🏗️ 架构设计

### 核心组件

```
src/api/
├── config/
│   ├── config.ts          # API配置（环境、超时等）
│   └── endpoints.ts       # API端点定义
├── types/
│   ├── common.ts          # 通用类型定义
│   └── auth.ts            # 认证相关类型
├── utils/
│   ├── apiClient.ts       # 增强的API客户端
│   └── helpers.ts         # 工具函数
├── hooks/
│   └── useAuth.ts         # React Query hooks
├── endpoints/
│   └── auth.ts            # API端点实现
├── services/
│   └── ApiService.ts      # 统一API服务
└── index.ts               # 统一导出
```

### 1. 增强的 API 客户端 (EnhancedApiClient)

**位置**: `src/api/utils/apiClient.ts`

**核心功能**:
- **智能请求拦截**: 自动处理不同Content-Type（JSON/form-urlencoded）
- **认证管理**: 自动添加Authorization头和请求ID
- **错误处理**: 统一的错误格式化和处理
- **缓存机制**: 内置5分钟请求缓存
- **重试机制**: 支持指数退避的自动重试
- **文件上传**: 支持文件上传和进度跟踪

**关键特性**:
```typescript
// 自动格式转换
if (config.url?.includes('/api/login')) {
  config.headers['Content-Type'] = 'application/x-www-form-urlencoded';
  // 自动转换为form-urlencoded格式
} else {
  config.headers['Content-Type'] = 'application/json';
}
```

### 2. 统一 API 服务 (ApiService)

**位置**: `src/api/services/ApiService.ts`

**功能模块**:
- **认证服务**: 登录、登出、注册、密码重置
- **用户管理**: 用户信息CRUD、头像上传
- **会议管理**: 会议创建、加入、结束
- **消息服务**: 消息发送、接收、附件处理
- **联系人管理**: 联系人增删改查
- **文件服务**: 文件上传、下载、管理
- **通知系统**: 通知获取、标记已读
- **系统服务**: 健康检查、版本信息

### 3. React Query 集成

**位置**: `src/api/hooks/useAuth.ts`

**提供的 Hooks**:
- `useLogin()`: 登录状态管理
- `useLogout()`: 登出处理
- `useCurrentUser()`: 当前用户信息
- `useAuthStatus()`: 认证状态检查
- `useAuth()`: 完整认证功能组合

**特性**:
- 自动缓存管理
- 乐观更新
- 错误重试
- 加载状态管理

### 4. 类型安全 (Zod + TypeScript)

**位置**: `src/api/types/`

**验证机制**:
```typescript
// 请求参数验证
const validatedCredentials = LoginRequestSchema.parse(credentials);

// 响应数据验证
const validatedResponse = LoginResponseSchema.parse(response);
```

## 🔧 配置管理

### API 端点配置

**位置**: `src/api/config/endpoints.ts`

```typescript
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/login',
    LOGOUT: '/auth/logout',
    REGISTER: '/auth/register',
    // ...
  },
  USERS: {
    ME: '/users/me',
    LIST: '/users',
    GET: (id: string) => `/users/${id}`,
    // ...
  },
  // ...
};
```

### 版本管理

```typescript
// 支持API版本控制
export const API_VERSIONS = {
  V1: '/api/v1',
  V2: '/api/v2',
};

// 自动构建版本化端点
export const VERSIONED_ENDPOINTS = getVersionedEndpoints();
```

## 🚀 使用示例

### 1. 基础 API 调用

```typescript
import { apiService } from '@/api';

// 获取用户信息
const user = await apiService.users.getMe();

// 创建会议
const meeting = await apiService.meetings.createMeeting({
  title: '项目讨论',
  startTime: '2024-01-01T10:00:00Z',
  duration: 60,
  participants: ['user1', 'user2']
});
```

### 2. React Hook 使用

```typescript
import { useAuth } from '@/api/hooks/useAuth';

function LoginComponent() {
  const { login, isLoggingIn, loginError } = useAuth();
  
  const handleLogin = () => {
    login({ username: 'user', password: 'pass' });
  };
  
  return (
    <button onClick={handleLogin} disabled={isLoggingIn}>
      {isLoggingIn ? '登录中...' : '登录'}
    </button>
  );
}
```

### 3. 文件上传

```typescript
// 带进度的文件上传
const result = await apiService.files.upload(file, (progress) => {
  console.log(`上传进度: ${progress}%`);
});
```

## 🔍 优化改进

### 已完成的优化

1. **代码清理**:
   - 移除了冗余的调试日志
   - 删除了重复的 `client.ts` 文件
   - 简化了错误处理逻辑

2. **性能优化**:
   - 智能缓存机制
   - 请求去重
   - 自动重试机制

3. **类型安全**:
   - 完整的 TypeScript 类型定义
   - Zod 运行时验证
   - 编译时类型检查

4. **开发体验**:
   - 统一的错误处理
   - 清晰的代码结构
   - 完善的文档

### 架构优势

1. **模块化设计**: 清晰的职责分离，易于维护和扩展
2. **类型安全**: 编译时和运行时双重类型保障
3. **性能优化**: 智能缓存和请求优化
4. **开发友好**: 丰富的 Hook 和工具函数
5. **错误处理**: 统一的错误格式和处理机制
6. **可扩展性**: 支持版本控制和功能扩展

## 📚 最佳实践

1. **使用 TypeScript**: 充分利用类型安全特性
2. **合理使用缓存**: 根据数据更新频率设置缓存策略
3. **错误处理**: 始终处理 API 调用的错误情况
4. **Hook 优先**: 在 React 组件中优先使用提供的 Hook
5. **类型验证**: 对关键数据进行 Zod 验证
6. **性能监控**: 关注网络请求性能和错误率

## 🔮 未来规划

1. **WebSocket 集成**: 实时通信支持
2. **离线支持**: 离线数据同步机制
3. **性能监控**: 请求性能分析和优化
4. **自动化测试**: API 测试覆盖
5. **文档生成**: 自动 API 文档生成

---

这个网络框架为 TeamToDo 项目提供了稳定、高效、类型安全的 API 通信基础，支持项目的快速开发和长期维护。