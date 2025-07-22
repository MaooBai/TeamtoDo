# 用户数据获取优化说明

## 📋 优化概述

本次优化主要解决了用户数据获取的效率问题，通过在登录/注册成功后立即获取并存储用户数据，避免了在个人页面重复调用API的问题。

## 🔧 主要改动

### 1. 修改登录逻辑 (`useLogin` Hook)

- **位置**: `src/api/hooks/useAuth.ts`
- **改动**: 在登录成功后立即调用 `apiService.users.getMe()` 获取用户数据
- **存储**: 将用户数据以JSON格式存储到 `AsyncStorage` 中

```typescript
// 登录成功后立即获取用户数据
try {
  const userResponse = await apiService.users.getMe();
  if (userResponse.code === 200 && userResponse.data) {
    // 保存用户数据到本地存储
    await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userResponse.data));
    console.log('用户数据已保存到本地存储');
  }
} catch (error) {
  console.error('获取用户数据失败:', error);
  // 即使获取用户数据失败，登录仍然成功
}
```

### 2. 修改注册逻辑 (`useRegister` Hook)

- **位置**: `src/api/hooks/useAuth.ts`
- **改动**: 在注册成功后也立即获取并存储用户数据
- **目的**: 保持登录和注册流程的一致性

### 3. 新增用户数据管理 Hooks

#### `useStoredUserData`
- **功能**: 从本地存储获取用户数据
- **特点**: 使用 `useQuery` 实现，支持缓存和自动更新
- **配置**: `staleTime: Infinity` 和 `cacheTime: Infinity`，因为是本地存储数据

#### `useUpdateStoredUserData`
- **功能**: 更新本地存储的用户数据
- **特点**: 使用 `useMutation` 实现，更新后自动刷新查询缓存

### 4. 优化个人页面 (`ProfileScreen.tsx`)

- **移除**: 不再使用 `useCurrentUser` 和 `useFocusEffect`
- **替换**: 使用 `useStoredUserData` 直接从本地存储获取数据
- **简化**: 移除了复杂的状态管理和API调用逻辑

```typescript
// 优化前
const currentUserMutation = useCurrentUser();
useFocusEffect(() => {
  if (!currentUserMutation.data && !currentUserMutation.isPending) {
    currentUserMutation.mutate();
  }
});

// 优化后
const { data: storedUserData, isLoading: isLoadingStoredData } = useStoredUserData();
const userData = storedUserData ? {
  name: storedUserData.nickName || defaultUserData.name,
  // ... 其他字段映射
} : defaultUserData;
```

## 🚀 性能提升

### 优化前
1. 用户登录成功 → 导航到主页
2. 用户点击个人页面 → 调用API获取用户数据 → 渲染页面
3. 每次进入个人页面都需要重新调用API

### 优化后
1. 用户登录成功 → 立即获取用户数据并存储 → 导航到主页
2. 用户点击个人页面 → 直接从本地存储读取数据 → 立即渲染页面
3. 无需重复API调用，响应速度更快

## 📊 优势

1. **减少API调用**: 避免每次进入个人页面都调用API
2. **提升响应速度**: 本地存储读取速度远快于网络请求
3. **改善用户体验**: 个人页面加载更快，无需等待网络请求
4. **离线支持**: 即使网络不佳，也能显示用户基本信息
5. **数据一致性**: 登录和注册后都会立即获取最新用户数据

## 🔄 数据同步

- **登录时**: 自动获取并更新本地用户数据
- **注册时**: 自动获取并存储用户数据
- **登出时**: 清除本地存储的用户数据
- **手动更新**: 可通过 `useUpdateStoredUserData` Hook 手动更新

## 🛠️ 使用方法

### 在组件中获取用户数据

```typescript
import { useStoredUserData } from '../api/hooks/useAuth';

const MyComponent = () => {
  const { data: userData, isLoading } = useStoredUserData();
  
  if (isLoading) {
    return <LoadingComponent />;
  }
  
  return (
    <View>
      <Text>{userData?.nickName || '未知用户'}</Text>
      <Text>{userData?.email || '未知邮箱'}</Text>
    </View>
  );
};
```

### 更新用户数据

```typescript
import { useUpdateStoredUserData } from '../api/hooks/useAuth';

const EditProfileComponent = () => {
  const updateUserData = useUpdateStoredUserData();
  
  const handleSave = (newData) => {
    updateUserData.mutate(newData);
  };
  
  return (
    // 编辑表单组件
  );
};
```

## 📝 注意事项

1. **数据格式**: 本地存储的数据格式与API返回的 `data` 字段一致
2. **错误处理**: 即使获取用户数据失败，登录/注册仍会成功
3. **缓存管理**: 使用React Query的缓存机制，数据永不过期
4. **存储键**: 使用 `STORAGE_KEYS.USER_DATA` 作为存储键名

## 🔮 未来扩展

1. **数据刷新**: 可添加定期刷新机制
2. **数据验证**: 可添加数据有效性检查
3. **多用户支持**: 可扩展支持多用户数据存储
4. **数据加密**: 可对敏感数据进行加密存储