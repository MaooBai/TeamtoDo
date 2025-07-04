import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryOptions,
  UseMutationOptions,
  QueryKey,
} from '@tanstack/react-query';
import { z } from 'zod';
import { enhancedApiClient } from '../utils/client';
import { ApiError, PaginationParams } from '../types/common';
import { ApiResponseHandler, paginationHelpers } from '../utils/helpers';

// 通用查询选项
interface BaseQueryOptions {
  enabled?: boolean;
  staleTime?: number;
  cacheTime?: number;
  refetchOnWindowFocus?: boolean;
  retry?: boolean | number;
}

// 分页查询选项
interface PaginatedQueryOptions extends BaseQueryOptions {
  pagination?: Partial<PaginationParams>;
}

// 通用查询Hook
export function useApiQuery<TData>(
  queryKey: QueryKey,
  queryFn: () => Promise<TData>,
  options?: BaseQueryOptions
) {
  return useQuery({
    queryKey,
    queryFn,
    staleTime: 5 * 60 * 1000, // 默认5分钟
    cacheTime: 10 * 60 * 1000, // 默认10分钟
    retry: (failureCount, error) => {
      // 先将 error 转换为 unknown 类型，再断言为 ApiError
      const apiError = (error as unknown) as ApiError;
      // 4xx错误通常不重试，5xx错误重试最多3次
      if (apiError.status >= 400 && apiError.status < 500) {
        return false;
      }
      return failureCount < 3;
    },
    ...options,
  });
}

// 分页查询Hook
export function usePaginatedQuery<TData>(
  baseQueryKey: QueryKey,
  endpoint: string,
  schema: z.ZodSchema<TData>,
  options?: PaginatedQueryOptions
) {
  const { pagination = {}, ...queryOptions } = options || {};
  const normalizedPagination = paginationHelpers.normalizePaginationParams(pagination);
  
  const queryKey = [...baseQueryKey, 'paginated', normalizedPagination];
  
  return useQuery({
    queryKey,
    queryFn: async () => {
      const response = await enhancedApiClient.get(endpoint, {
        params: normalizedPagination,
        useCache: true,
      });
      return ApiResponseHandler.parsePaginatedResponse(response, schema);
    },
    staleTime: 2 * 60 * 1000, // 分页数据2分钟过期
    ...queryOptions,
  });
}

// 通用变更Hook
export function useApiMutation<TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: {
    onSuccess?: (data: TData, variables: TVariables) => void;
    onError?: (error: ApiError, variables: TVariables) => void;
    invalidateQueries?: QueryKey[];
    updateQueries?: Array<{
      queryKey: QueryKey;
      updater: (oldData: any, newData: TData, variables: TVariables) => any;
    }>;
  }
) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn,
    onSuccess: (data, variables) => {
      // 执行自定义成功回调
      options?.onSuccess?.(data, variables);
      
      // 失效相关查询
      options?.invalidateQueries?.forEach(queryKey => {
        queryClient.invalidateQueries({ queryKey });
      });
      
      // 更新相关查询数据
      options?.updateQueries?.forEach(({ queryKey, updater }) => {
        queryClient.setQueryData(queryKey, (oldData: any) => 
          updater(oldData, data, variables)
        );
      });
    },
    onError: (error, variables) => {
      const apiError = ApiResponseHandler.handleApiError(error);
      options?.onError?.(apiError, variables);
    },
  });
}

// CRUD操作Hooks
export function useCrudOperations<TData, TCreateData, TUpdateData>(
  resourceName: string,
  endpoints: {
    list: string;
    get: (id: string) => string;
    create: string;
    update: (id: string) => string;
    delete: (id: string) => string;
  },
  schema: z.ZodSchema<TData>
) {
  const queryClient = useQueryClient();
  const baseQueryKey = [resourceName];
  
  // 列表查询
  const useList = (options?: PaginatedQueryOptions) => {
    return usePaginatedQuery(baseQueryKey, endpoints.list, schema, options);
  };
  
  // 详情查询
  const useGet = (id: string, options?: BaseQueryOptions) => {
    return useApiQuery(
      [...baseQueryKey, id],
      async () => {
        const response = await enhancedApiClient.get(endpoints.get(id), {
          useCache: true,
        });
        return ApiResponseHandler.parseDataResponse(response, schema);
      },
      options
    );
  };
  
  // 创建
  const useCreate = () => {
    return useApiMutation(
      async (data: TCreateData) => {
        const response = await enhancedApiClient.post(endpoints.create, data);
        return ApiResponseHandler.parseDataResponse(response, schema);
      },
      {
        invalidateQueries: [baseQueryKey],
        onSuccess: (data) => {
          // 可以添加成功提示
          console.log(`${resourceName} created successfully:`, data);
        },
      }
    );
  };
  
  // 更新
  const useUpdate = () => {
    return useApiMutation(
      async ({ id, data }: { id: string; data: TUpdateData }) => {
        const response = await enhancedApiClient.patch(endpoints.update(id), data);
        return ApiResponseHandler.parseDataResponse(response, schema);
      },
      {
        invalidateQueries: [baseQueryKey],
        updateQueries: [
          {
            queryKey: baseQueryKey,
            updater: (oldData: any, newData: TData, variables: { id: string; data: TUpdateData }) => {
              if (Array.isArray(oldData?.items)) {
                return {
                  ...oldData,
                  items: oldData.items.map((item: any) => 
                    item.id === variables.id ? newData : item
                  ),
                };
              }
              return oldData;
            },
          },
        ],
      }
    );
  };
  
  // 删除
  const useDelete = () => {
    return useApiMutation(
      async (id: string) => {
        await enhancedApiClient.delete(endpoints.delete(id));
        return id;
      },
      {
        invalidateQueries: [baseQueryKey],
        updateQueries: [
          {
            queryKey: baseQueryKey,
            updater: (oldData: any, deletedId: string) => {
              if (Array.isArray(oldData?.items)) {
                return {
                  ...oldData,
                  items: oldData.items.filter((item: any) => item.id !== deletedId),
                  total: oldData.total - 1,
                };
              }
              return oldData;
            },
          },
        ],
      }
    );
  };
  
  return {
    useList,
    useGet,
    useCreate,
    useUpdate,
    useDelete,
  };
}

// 文件上传Hook
export function useFileUpload() {
  return useApiMutation(
    async ({
      file,
      endpoint,
      onProgress,
    }: {
      file: any;
      endpoint: string;
      onProgress?: (progress: number) => void;
    }) => {
      return enhancedApiClient.upload(endpoint, file, { onProgress });
    },
    {
      onSuccess: (data) => {
        console.log('File uploaded successfully:', data);
      },
    }
  );
}

// 批量操作Hook
export function useBatchOperation<TData, TVariables>(
  operations: Array<(variables: TVariables) => Promise<TData>>
) {
  return useApiMutation(
    async (variables: TVariables) => {
      const results = await Promise.allSettled(
        operations.map(operation => operation(variables))
      );
      
      const successful = results
        .filter((result): result is PromiseFulfilledResult<Awaited<TData>> =>
          result.status === 'fulfilled'
        )
        .map(result => result.value);
      
      const failed = results
        .filter((result): result is PromiseRejectedResult => 
          result.status === 'rejected'
        )
        .map(result => result.reason);
      
      return { successful, failed };
    }
  );
}