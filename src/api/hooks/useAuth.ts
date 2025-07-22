import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiService from '../services/apiService';
import { LoginRequest, LoginResponse, UserResponse, RegisterRequest, RegisterResponse, LoginDataSchema, DeptTreeData, UsersDataResponse } from '../types/auth';
import { ApiError } from '../types/common';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiConfig } from '../config/config';
import { clearCurrentUserMessages } from '../utils/storage';
// WebSocket管理器
class WebSocketManager {
  private static instance: WebSocketManager;
  private ws: WebSocket | null = null;

  static getInstance(): WebSocketManager {
    if (!WebSocketManager.instance) {
      WebSocketManager.instance = new WebSocketManager();
    }
    return WebSocketManager.instance;
  }

  connect(token: string): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.log('WebSocket已连接，无需重复连接');
      return;
    }

    this.ws = new WebSocket(apiConfig.websocketBaseURL + `/websocket?token=${token}`);
    
    this.ws.onopen = () => {
      console.log('WebSocket连接已建立');
      this.ws?.send('something'); // send a message
    };

    this.ws.onclose = () => {
      console.log('WebSocket连接已关闭');
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket连接错误:', error);
    };
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      console.log('WebSocket连接已断开');
    }
  }

  getConnection(): WebSocket | null {
    return this.ws;
  }
}

const wsManager = WebSocketManager.getInstance();

// 导出WebSocket管理器供其他组件使用
export { wsManager };

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
        // 保存认证token到本地存储
        await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, response.token);
        
        // 登录成功后立即获取用户数据
        try {
          const userResponse = await apiService.users.getMe();
          if (userResponse.code === 200 && userResponse.data) {
            // 保存用户数据到本地存储
            await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userResponse.data));
            console.log('用户数据已保存到本地存储');
            
            // 立即更新查询缓存
            queryClient.setQueryData(['storedUserData'], userResponse.data);
            console.log('查询缓存已更新');
          }
        } catch (error) {
          console.error('获取用户数据失败:', error);
          // 即使获取用户数据失败，登录仍然成功
        }
        
        // 建立WebSocket连接
        wsManager.connect(response.token);
        // 登录成功后，使用户查询缓存失效，触发重新获取
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
      //  await apiService.auth.logout();
      
      // 断开WebSocket连接
      wsManager.disconnect();
      
      // 清除当前用户的所有消息
      // await clearCurrentUserMessages();
      
      // 清除本地存储的用户数据和认证token
      await AsyncStorage.multiRemove([STORAGE_KEYS.USER_DATA, STORAGE_KEYS.AUTH_TOKEN]);
      
      // 清除所有查询缓存，包括用户数据缓存
      queryClient.clear();
      
      // 特别清除用户数据查询缓存
      queryClient.removeQueries({ queryKey: ['storedUserData'] });
      
      console.log('用户数据、认证信息和消息已清除');
    },
    onError: (error) => {
      console.error('登出失败:', error);
    },
  });
};

export const useRegister = () => {
  const queryClient = useQueryClient();
  
  return useMutation<RegisterResponse, ApiError, RegisterRequest>({
    mutationFn: async (register: RegisterRequest): Promise<RegisterResponse> => {
      const response = await apiService.auth.register(register);
      
      if (response.code === 200) {
        // 注册成功，处理数据
        // 保存认证token到本地存储
        await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, response.token ?? '');
        
        // 注册成功后立即获取用户数据
        if (response.token) {
          try {
            const userResponse = await apiService.users.getMe();
            if (userResponse.code === 200 && userResponse.data) {
              // 保存用户数据到本地存储
              await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userResponse.data));
              console.log('注册后用户数据已保存到本地存储');
              
              // 立即更新查询缓存
              queryClient.setQueryData(['storedUserData'], userResponse.data);
              console.log('注册后查询缓存已更新');
            }
          } catch (error) {
            console.error('注册后获取用户数据失败:', error);
            // 即使获取用户数据失败，注册仍然成功
          }
        }
        
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

export const useDeptTree = () =>{
  return useMutation<DeptTreeData,ApiError>({
    mutationFn: async(): Promise<DeptTreeData> => {
      return await apiService.contacts.getContacts();
    },
    onError:(error)=>{
      console.error('获取用户列表失败:', error);
    }
  })
}

// 获取用户列表Hook
export const useUsers = () =>{
  return useMutation<UsersDataResponse,ApiError>({
    mutationFn: async(): Promise<UsersDataResponse> => {
      return await apiService.users.getUsers();
    },
    onError: (error) => {
      console.error('获取用户列表失败:', error);
    },
  })
}


// 获取当前用户Hook
export const useCurrentUser = () => {
  return useMutation<UserResponse, ApiError>({
    mutationFn: async(): Promise<UserResponse> => {
      return await apiService.users.getMe();
    },
    onError: (error) => {
      console.error('获取当前用户失败:', error);
    },
  })
};

// 从本地存储获取用户数据Hook
export const useStoredUserData = () => {
  return useQuery({
    queryKey: ['storedUserData'],
    queryFn: async () => {
      try {
        console.log('正在从本地存储获取用户数据...');
        const userData = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
        console.log('本地存储原始数据:', userData);
        if (userData) {
          const parsedData = JSON.parse(userData);
          console.log('解析后的用户数据:', parsedData);
          return parsedData;
        }
        console.log('本地存储中没有用户数据');
        return null;
      } catch (error) {
        console.error('获取本地用户数据失败:', error);
        return null;
      }
    },
    staleTime: Infinity, // 数据永不过期，因为是本地存储
    retry: false, // 不重试，因为是本地存储
  });
};

// 更新本地存储的用户数据
export const useUpdateStoredUserData = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (userData: any) => {
      await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
      return userData;
    },
    onSuccess: (userData) => {
      // 更新查询缓存
      queryClient.setQueryData(['storedUserData'], userData);
    },
    onError: (error) => {
      console.error('更新本地用户数据失败:', error);
    },
  });
};

//通讯录Hook
export const ContactsAuthStatus = () =>{
  const getDeptTree = useDeptTree();
  const getUsersData = useUsers();
  return {
    useUsers: getUsersData.mutate,
    deptTree: getDeptTree.mutate,
    isLoading: getUsersData.isPending,
    isError: getUsersData.isError,
    isdeptTreeLoading: getDeptTree.isPending,
    isdeptTreeError: getDeptTree.isError,
  }
}


// 检查认证状态Hook
export const useAuthStatus = () => {
  const CurrentUser = useCurrentUser();
  return{
    useCurrentUser: CurrentUser.mutate,
    isLoading: CurrentUser.isPending,
    isError: CurrentUser.isError,
  }
};

// 组合Hook，提供完整的认证功能
export const useAuth = () => {
  const loginMutation = useLogin();
  const logoutMutation = useLogout();
  const registerMutation = useRegister();
  return {
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