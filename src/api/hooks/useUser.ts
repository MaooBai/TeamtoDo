import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userApi, userApiV2, User } from '../api/user';
import { useApiQuery, useApiMutation, usePaginatedQuery } from './useApiQuery';
import { PaginationParams } from '../types/common';

// 兼容旧版本的hook（保持向后兼容）
export const useUser = () => {
  const queryClient = useQueryClient();

  // 获取当前用户
  const getMeQuery = useQuery({
    queryKey: ['user', 'me'],
    queryFn: userApi.getMe,
    staleTime: 5 * 60 * 1000, // 5分钟缓存
  });

  // 更新用户信息
  const updateMeMutation = useMutation({
    mutationFn: userApi.updateMe,
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(['user', 'me'], updatedUser);
    },
  });

  return {
    user: getMeQuery.data,
    isLoading: getMeQuery.isLoading,
    isError: getMeQuery.isError,
    updateUser: updateMeMutation.mutateAsync,
    isUpdating: updateMeMutation.isPending,
  };
};

// 新版本的用户hooks（推荐使用）
export const useUserV2 = () => {
  // 获取当前用户信息
  const useMe = () => {
    return useApiQuery(
      ['user', 'me'],
      userApiV2.getMe,
      {
        staleTime: 5 * 60 * 1000,
        cacheTime: 10 * 60 * 1000,
      }
    );
  };

  // 更新当前用户信息
  const useUpdateMe = () => {
    return useApiMutation(
      userApiV2.updateMe,
      {
        invalidateQueries: [['user', 'me']],
        onSuccess: (data) => {
          console.log('用户信息更新成功:', data);
        },
      }
    );
  };

  // 获取单个用户信息
  const useGetUser = (id: string, enabled: boolean = true) => {
    return useApiQuery(
      ['user', id],
      () => userApiV2.getUser(id),
      {
        enabled: enabled && !!id,
        staleTime: 5 * 60 * 1000,
      }
    );
  };

  // 更新用户信息（管理员）
  const useUpdateUser = () => {
    return useApiMutation(
      ({ id, data }: { id: string; data: Partial<User> }) => 
        userApiV2.updateUser(id, data),
      {
        invalidateQueries: [['users'], ['user']],
        onSuccess: (data, variables) => {
          console.log(`用户 ${variables.id} 更新成功:`, data);
        },
      }
    );
  };

  // 删除用户（管理员）
  const useDeleteUser = () => {
    return useApiMutation(
      userApiV2.deleteUser,
      {
        invalidateQueries: [['users']],
        onSuccess: (data) => {
          console.log(`用户 ${data.id} 删除成功`);
        },
      }
    );
  };

  // 上传头像
  const useUploadAvatar = () => {
    return useApiMutation(
      ({ file, onProgress }: { file: any; onProgress?: (progress: number) => void }) =>
        userApiV2.uploadAvatar(file, onProgress),
      {
        invalidateQueries: [['user', 'me']],
        onSuccess: (data) => {
          console.log('头像上传成功:', data.avatarUrl);
        },
      }
    );
  };

  // 修改密码
  const useChangePassword = () => {
    return useApiMutation(
      userApiV2.changePassword,
      {
        onSuccess: (data) => {
          console.log('密码修改成功:', data.message);
        },
      }
    );
  };

  return {
    useMe,
    useUpdateMe,
    useGetUser,
    useUpdateUser,
    useDeleteUser,
    useUploadAvatar,
    useChangePassword,
  };
};

// 导出便捷的hooks
export const useCurrentUser = () => {
  const { useMe } = useUserV2();
  return useMe();
};

export const useUpdateCurrentUser = () => {
  const { useUpdateMe } = useUserV2();
  return useUpdateMe();
};
