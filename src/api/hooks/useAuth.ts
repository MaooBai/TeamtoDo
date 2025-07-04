import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi } from '../api/auth';
import { LoginRequest, LoginResponse, LoginData, RegisterRequest, RegisterResponse } from '../types/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 存储键名
const STORAGE_KEYS = {
  USER_DATA: 'user_data',
  AUTH_TOKEN: 'auth_token',
};

// 登录Hook
export const useLogin = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (credentials: LoginRequest): Promise<LoginResponse> => {
      const response = await authApi.login(credentials);
      
      // 检查登录是否成功
      if (response.code === 0 && response.data) {
        // 保存用户数据到本地存储
        await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(response.data));
        
        // 更新查询缓存
        queryClient.setQueryData(['currentUser'], response.data);
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
  
  return useMutation({
    mutationFn: async () => {
      await authApi.logout();
      
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
  return useMutation({
    mutationFn: async (register: RegisterRequest): Promise<RegisterResponse> => {
      console.log('=== useAuth Hook - 注册流程开始 ===');
      console.log('useAuth Hook - 接收到的register参数:', JSON.stringify(register, null, 2));
      console.log('useAuth Hook - register参数类型检查:', {
        type: typeof register,
        isObject: typeof register === 'object',
        hasUsername: 'username' in register,
        hasPassword: 'password' in register,
        hasEmail: 'email' in register,
        usernameValue: register.username,
        emailValue: register.email,
        passwordValue: register.password,
        usernameType: typeof register.username,
        emailType: typeof register.email,
        passwordType: typeof register.password
      });
      
      console.log('useAuth Hook - 调用authApi.register前的参数:', register);
      const response = await authApi.register(register);
      console.log('useAuth Hook - authApi.register返回的响应:', JSON.stringify(response, null, 2));
      
      if (response.code === 0) {
        // 注册成功，处理数据
        console.log('useAuth Hook - 注册成功');
        return response;
      } else {
        // 注册失败，抛出错误
        console.log('useAuth Hook - 注册失败，准备抛出错误');
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
  return useQuery({
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