// 简化的认证hooks
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiService from '../services/apiService';
import { LoginRequest, LoginResponse } from '../types/auth';

// 登录hook
export function useLogin() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (credentials: LoginRequest) => apiService.auth.login(credentials),
    onSuccess: (data: LoginResponse) => {
      // 登录成功后可以存储token等操作
      queryClient.setQueryData(['auth', 'user'], data.token);
      queryClient.invalidateQueries({ queryKey: ['auth'] });
    },
  });
}

// 登出hook
export function useLogout() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: () => apiService.auth.logout(),
    onSuccess: () => {
      // 清除所有缓存
      queryClient.clear();
    },
  });
}

// 获取当前用户hook
export function useCurrentUser() {
  return useQuery({
    queryKey: ['auth', 'user'],
    queryFn: () => apiService.users.getMe(),
    retry: false,
  });
}

// 检查认证状态hook
export function useAuthStatus() {
  return useQuery({
    queryKey: ['auth', 'status'],
    queryFn: () => apiService.auth.refreshToken(),
    retry: false,
  });
}

// // 注册hook
// export function useRegister() {
//   const queryClient = useQueryClient();
  
//   return useMutation({
//     mutationFn: (userData: {
//       name: string;
//       email: string;
//       password: string;
//     }) => apiService.auth.register({
//       register: RegisterRequest
//     }),
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: ['auth'] });
//     },
//   });
// }

// 忘记密码hook
export function useForgotPassword() {
  return useMutation({
    mutationFn: (email: string) => apiService.auth.forgotPassword(email),
  });
}

// 重置密码hook
export function useResetPassword() {
  return useMutation({
    mutationFn: ({ token, newPassword }: { token: string; newPassword: string }) => 
      apiService.auth.resetPassword(token, newPassword),
  });
}