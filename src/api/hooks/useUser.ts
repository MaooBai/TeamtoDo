import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userApi } from '../endpoints/user';

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