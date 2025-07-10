// 基于axios和React Query的API hooks
import { useQuery, useMutation, useQueryClient, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import apiClient from '../client';
import { ApiError } from '../types/common';

// 通用API查询hook
export function useApiQuery<T>(
  queryKey: (string | number)[],
  queryFn: () => Promise<T>,
  options?: Omit<UseQueryOptions<T, ApiError>, 'queryKey' | 'queryFn'>
) {
  return useQuery<T, ApiError>({
    queryKey,
    queryFn,
    ...options,
  });
}

// 通用API变更hook
export function useApiMutation<TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: UseMutationOptions<TData, ApiError, TVariables>
) {
  return useMutation<TData, ApiError, TVariables>({
    mutationFn,
    ...options,
  });
}

// 文件上传hook
export function useFileUpload() {
  const queryClient = useQueryClient();
  
  return useMutation<any, ApiError, {
    endpoint: string;
    file: File;
    onProgress?: (progress: number) => void;
  }>({
    mutationFn: async ({
      endpoint,
      file,
      onProgress,
    }) => {
      const formData = new FormData();
      formData.append('file', file);
      
      return apiClient.post(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const progress = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            onProgress(progress);
          }
        },
      });
    },
    onSuccess: () => {
      // 可以在这里刷新相关查询
      queryClient.invalidateQueries({ queryKey: ['files'] });
    },
  });
}

// 分页查询hook
export function usePaginatedQuery<T>(
  queryKey: (string | number)[],
  endpoint: string,
  params?: Record<string, any>,
  options?: Omit<UseQueryOptions<T, ApiError>, 'queryKey' | 'queryFn'>
) {
  return useQuery<T, ApiError>({
    queryKey: [...queryKey, params],
    queryFn: (): Promise<T> => apiClient.get(endpoint, { params }),
    ...options,
  });
}

// 无限查询hook（用于滚动加载）
export function useInfiniteApiQuery<T>(
  queryKey: (string | number)[],
  endpoint: string,
  options?: any
) {
  return useQuery<T, ApiError>({
    queryKey,
    queryFn: (): Promise<T> => {
      const pageParam = options?.pageParam || 1;
      return apiClient.get(endpoint, { 
        params: { page: pageParam, ...options?.params } 
      });
    },
    ...options,
  });
}