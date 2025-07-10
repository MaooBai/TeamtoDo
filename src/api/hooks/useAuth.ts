import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiService from '../services/apiService';
import { LoginRequest, LoginResponse, LoginData, RegisterRequest, RegisterResponse } from '../types/auth';
import { ApiError } from '../types/common';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 存储键名
const STORAGE_KEYS = {
  USER_DATA: 'user_data',
  AUTH_TOKEN: 'auth_token',
}; 

// 登录Hook
export const useLogin = () => {
  const queryClient = useQueryClient();
  
  return useMutation<LoginResponse, ApiError, LoginRequest>({
    mutationFn: async (credentials: LoginRequest): Promise<LoginResponse> => {
      const response = await apiService.auth.login(credentials);
      
      // 检查登录是否成功
      if (response.code === 200 && response.token) {
        // 保存用户数据到本地存储
        await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, response.token);
      } else {
        // 登录失败，抛出错误
        throw new Error(response.msg || '登录失败');
      }
      
      return response;
    },
    onError: (error) => {
      console.error('登录失败:', error);
    },
  });
};

// 登出Hook
export const useLogout = () => {
  const queryClient = useQueryClient();
  
  return useMutation<void, ApiError, void>({
    mutationFn: async () => {
      // await apiService.auth.logout();
      
      // 清除本地存储
      await AsyncStorage.multiRemove([STORAGE_KEYS.USER_DATA, STORAGE_KEYS.AUTH_TOKEN]);
      
      // 清除所有查询缓存
      queryClient.clear();
    },
    onError: (error) => {
      console.error('登出失败:', error);
    },
  });
};

export const useRegister = () => {
  return useMutation<RegisterResponse, ApiError, RegisterRequest>({
    mutationFn: async (register: RegisterRequest): Promise<RegisterResponse> => {
      const response = await apiService.auth.register(register);
      
      if (response.code === 200) {
        // 注册成功，处理数据
        // 保存用户数据到本地存储
        await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, response.token ?? '');
        return response;
      } else if (response.code === 500) {
        // 注册失败，处理特定错误
        throw new Error('注册失败：用户名已存在');
      } else {
        // 其他未知错误
        throw new Error(response.msg || '注册失败');
      }
    },
    onError: (error) => {
      console.error('注册失败:', error);
    },
  });
}

// 获取当前用户Hook
export const useCurrentUser = () => {
  return useQuery<LoginData | null, ApiError>({
    queryKey: ['currentUser'],
    queryFn: async (): Promise<LoginData | null> => {
      try {
        const userData = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
        return userData ? JSON.parse(userData) : null;
      } catch (error) {
        console.error('获取用户数据失败:', error);
        return null;
      }
    },
    staleTime: Infinity, // 用户数据不会自动过期
  });
};

// 检查认证状态Hook
export const useAuthStatus = () => {
  const { data: user, isLoading } = useCurrentUser();
  
  return {
    isAuthenticated: !!user,
    user,
    isLoading,
  };
};

// 组合Hook，提供完整的认证功能
export const useAuth = () => {
  const loginMutation = useLogin();
  const logoutMutation = useLogout();
  const registerMutation = useRegister();
  const { isAuthenticated, user, isLoading } = useAuthStatus();
  
  return {
    // 状态
    isAuthenticated,
    user,
    isLoading,
    
    // 操作
    login: loginMutation.mutate,
    logout: logoutMutation.mutate,
    register: registerMutation.mutate,
    
    // 加载状态
    isLoggingIn: loginMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
    
    // 错误状态
    loginError: loginMutation.error,
    logoutError: logoutMutation.error,
    
    // 重置错误
    clearLoginError: loginMutation.reset,
    clearLogoutError: logoutMutation.reset,
  };
};