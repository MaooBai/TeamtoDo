import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';

// 创建持久化存储
export const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: 'QUERY_CACHE',
});

// 缓存配置
export const queryClientConfig = {
  defaultOptions: {
    queries: {
      gcTime: 24 * 60 * 60 * 1000, // 24小时缓存
      retry: (failureCount: number, error: { status: number; }) => {
        if (error.status === 401) return false; // 认证错误不重试
        return failureCount < 3; // 其他错误最多重试3次
      },
    },
  },
};