import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { meetingApi } from '../endpoints/meeting';
import { rtcService } from '../../../services/rtcService';

export const useMeetings = (meetingId: any) => {
  const queryClient = useQueryClient();

  // 获取会议列表
  const meetingsQuery = useQuery({
    queryKey: ['meetings'],
    queryFn: () => meetingApi.getMeetings(),
    staleTime: 60 * 1000, // 1分钟缓存
  });

  // 创建会议
  const createMeetingMutation = useMutation({
    mutationFn: meetingApi.createMeeting,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
    },
  });

  return {
    meetings: meetingsQuery.data,
    isLoading: meetingsQuery.isLoading,
    createMeeting: createMeetingMutation.mutateAsync,
    isCreating: createMeetingMutation.isPending,
  };
};

export const useMeetingRoom = (meetingId: string) => {
  // 加入会议
  const joinMeetingMutation = useMutation({
    mutationFn: () => meetingApi.joinMeeting(meetingId),
    onSuccess: async (data) => {
      await rtcService.initialize();
      // 假设返回数据结构为 { data: { token: string; rtcConfig: any; } }
      await rtcService.joinChannel(data.data.token, meetingId);
    },
  });

  // 离开会议
  const leaveMeeting = async () => {
    await rtcService.leaveChannel();
    await rtcService.destroy();
  };

  return {
    joinMeeting: joinMeetingMutation.mutateAsync,
    isJoining: joinMeetingMutation.isPending,
    leaveMeeting,
  };
};