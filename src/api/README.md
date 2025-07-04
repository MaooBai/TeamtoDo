# TeamToDo API 通信框架

这是一个为 TeamToDo 项目设计的完整的后台接口通信框架，提供了类型安全、缓存管理、错误处理、重试机制等功能。

## 🚀 特性

- **类型安全**: 使用 TypeScript 和 Zod 确保类型安全
- **智能缓存**: 内置请求缓存和 React Query 集成
- **错误处理**: 统一的错误处理和用户友好的错误信息
- **重试机制**: 自动重试失败的请求（支持指数退避）
- **文件上传**: 支持文件上传和进度跟踪
- **分页支持**: 内置分页查询支持
- **请求拦截**: 自动添加认证头和请求ID
- **向后兼容**: 保持与现有API的兼容性

## 📁 项目结构

```
src/api/
├── config/
│   ├── config.ts          # API配置（环境、超时等）
│   └── endpoints.ts       # API端点定义
├── types/
│   ├── auth.ts            # 认证相关类型
│   └── common.ts          # 通用类型定义
├── utils/
│   ├── client.ts          # 增强的API客户端
│   ├── cache.ts           # 缓存管理
│   └── helpers.ts         # 工具函数
├── hooks/
│   ├── useApiQuery.ts     # 通用React Query hooks
│   ├── useAuth.ts         # 认证相关hooks
│   ├── useUser.ts         # 用户相关hooks
│   └── useMeeting.ts      # 会议相关hooks
├── api/
│   ├── auth.ts            # 认证API端点
│   ├── user.ts            # 用户API端点
│   └── meeting.ts         # 会议API端点
├── services/
│   └── service.ts         # 统一API服务类
├── client.ts              # 基础客户端（兼容性）
└── index.ts               # 统一导出
```

## 🛠️ 快速开始

### 1. 基础使用

```typescript
import { apiService } from '@/api';

// 用户登录
const loginResponse = await apiService.auth.login({
  username: 'admin',
  password: '123456'
});

if (loginResponse.code === 0) {
  console.log('登录成功:', loginResponse.data.userName);
  console.log('用户部门:', loginResponse.data.deptName);
} else {
  console.error('登录失败:', loginResponse.msg);
}

// 获取当前用户信息
const user = await apiService.users.getMe();

// 发送消息
const message = await apiService.messages.sendMessage({
  content: 'Hello, World!',
  conversationId: 'conv_123'
});

// 创建会议
const meeting = await apiService.meetings.createMeeting({
  title: '团队会议',
  startTime: '2024-01-15T10:00:00Z',
  duration: 60,
  participants: ['user1', 'user2']
});
```

### 2. 在React组件中使用

#### 登录组件

```typescript
import { useAuth } from '@/api';

function LoginScreen() {
  const { login, isLoggingIn, loginError } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    login({ username, password }, {
      onSuccess: (response) => {
        if (response.code === 0) {
          Alert.alert('成功', `欢迎 ${response.data.userName}!`);
          // 导航到主页
        } else {
          Alert.alert('登录失败', response.msg);
        }
      },
      onError: (error) => {
        Alert.alert('错误', '网络错误，请稍后重试');
      }
    });
  };

  return (
    <View>
      <TextInput 
        value={username}
        onChangeText={setUsername}
        placeholder="用户名"
      />
      <TextInput 
        value={password}
        onChangeText={setPassword}
        placeholder="密码"
        secureTextEntry
      />
      <TouchableOpacity onPress={handleLogin} disabled={isLoggingIn}>
        <Text>{isLoggingIn ? '登录中...' : '登录'}</Text>
      </TouchableOpacity>
      {loginError && <Text>错误: {loginError.message}</Text>}
    </View>
  );
}
```

#### 用户信息组件

```typescript
import { useCurrentUser, useUpdateCurrentUser } from '@/api';

function UserProfile() {
  const { data: user, isLoading, error } = useCurrentUser();
  const updateUser = useUpdateCurrentUser();

  const handleUpdate = async (data) => {
    try {
      await updateUser.mutateAsync(data);
      alert('更新成功!');
    } catch (error) {
      alert('更新失败: ' + error.message);
    }
  };

  if (isLoading) return <div>加载中...</div>;
  if (error) return <div>错误: {error.message}</div>;

  return (
    <div>
      <h1>{user.name}</h1>
      <p>{user.email}</p>
      {/* 更新表单 */}
    </div>
  );
}
```

### 3. 分页查询

```typescript
import { useUsersList } from '@/api';

function UserList() {
  const { data, isLoading } = useUsersList({
    search: 'john',
    department: 'engineering',
    pagination: {
      page: 1,
      pageSize: 20,
      sortBy: 'name',
      sortOrder: 'asc'
    }
  });

  return (
    <div>
      {data?.items.map(user => (
        <div key={user.id}>{user.name}</div>
      ))}
      <div>总计: {data?.total} 条记录</div>
    </div>
  );
}
```

### 4. 文件上传

```typescript
import { useFileUpload } from '@/api';

function FileUpload() {
  const uploadMutation = useFileUpload();
  const [progress, setProgress] = useState(0);

  const handleUpload = (file) => {
    uploadMutation.mutate({
      file,
      endpoint: '/api/v1/files/upload',
      onProgress: setProgress
    });
  };

  return (
    <div>
      <input type="file" onChange={(e) => handleUpload(e.target.files[0])} />
      {uploadMutation.isPending && (
        <div>上传进度: {progress}%</div>
      )}
    </div>
  );
}
```

## 🔧 配置

### 环境配置

框架支持多环境配置，在 `config/config.ts` 中定义：

```typescript
const environmentConfigs = {
  development: {
    baseURL: 'http://192.168.5.3',
    timeout: 15000,
    enableLogging: true,
  },
  production: {
    baseURL: 'https://api.teamtodo.com',
    timeout: 8000,
    enableLogging: false,
  },
};
```

### API端点配置

在 `config/endpoints.ts` 中定义所有API端点：

```typescript
export const API_ENDPOINTS = {
  USERS: {
    ME: '/users/me',
    LIST: '/users',
    GET: (id: string) => `/users/${id}`,
  },
  // ...
};
```

## 🎯 高级功能

### 1. 自定义Hook

```typescript
import { useApiQuery, enhancedApiClient } from '@/api';

function useCustomData(id: string) {
  return useApiQuery(
    ['custom', id],
    async () => {
      const response = await enhancedApiClient.get(`/custom/${id}`, {
        useCache: true,
        retries: 3
      });
      return response;
    },
    {
      staleTime: 5 * 60 * 1000,
      enabled: !!id
    }
  );
}
```

### 2. 批量操作

```typescript
import { useBatchOperation } from '@/api';

const batchUpdate = useBatchOperation([
  (data) => apiService.users.updateUser(data.id1, data.update1),
  (data) => apiService.users.updateUser(data.id2, data.update2),
]);

// 使用
batchUpdate.mutate({
  id1: 'user1',
  update1: { name: 'New Name 1' },
  id2: 'user2',
  update2: { name: 'New Name 2' },
});
```

### 3. CRUD操作

```typescript
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
```

## 🔒 错误处理

框架提供统一的错误处理：

```typescript
try {
  await apiService.users.getUser('invalid-id');
} catch (error) {
  console.log(error.status);   // HTTP状态码
  console.log(error.message);  // 用户友好的错误信息
  console.log(error.code);     // 错误代码
  console.log(error.details);  // 详细错误信息
}
```

## 💾 缓存管理

```typescript
// 清除所有缓存
apiService.utils.clearAllCache();

// 清除特定模式的缓存
apiService.utils.clearCacheByPattern('users');

// 检查网络连接
const isConnected = await apiService.utils.checkConnection();
```

## 🔄 迁移指南

### 从旧版API迁移

旧版本的API调用仍然可以正常工作：

```typescript
// 旧版本（仍然支持）
import { userApi, useUser } from '@/api';
const user = await userApi.getMe();
const { user, isLoading } = useUser();

// 新版本（推荐）
import { apiService, useCurrentUser } from '@/api';
const user = await apiService.users.getMe();
const { data: user, isLoading } = useCurrentUser();
```

### 逐步迁移建议

1. **第一阶段**: 在新功能中使用新API
2. **第二阶段**: 逐步迁移现有组件
3. **第三阶段**: 移除旧版API（可选）

## 📝 最佳实践

1. **使用TypeScript**: 充分利用类型安全
2. **合理使用缓存**: 根据数据更新频率设置缓存时间
3. **错误处理**: 始终处理API调用的错误情况
4. **分页查询**: 对大量数据使用分页
5. **文件上传**: 提供上传进度反馈
6. **网络状态**: 检查网络连接状态

## 🐛 调试

开发环境下，框架会自动记录请求和响应日志：

```typescript
// 在开发环境中，控制台会显示：
// [API Request] GET /api/v1/users/me
// [API Response] 200 { id: '123', name: 'John' }
// [API Error] 404 User not found
```

## 🤝 贡献

如需添加新的API端点或功能：

1. 在 `config/endpoints.ts` 中添加端点定义
2. 在 `services/service.ts` 中添加服务方法
3. 在 `api/` 文件夹中创建相应的API端点文件
4. 创建相应的 hooks（如需要）
5. 添加类型定义和验证
6. 更新文档和示例

## 📚 相关文档

- [React Query 文档](https://tanstack.com/query/latest)
- [Zod 文档](https://zod.dev/)
- [Axios 文档](https://axios-http.com/)
- [TypeScript 文档](https://www.typescriptlang.org/)