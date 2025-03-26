import { z } from 'zod';
import apiClient from '../client';

// 会议数据结构验证
const MeetingSchema = z.object({
  id: z.string(),
  title: z.string(),
  startTime: z.string().datetime(),
  duration: z.number().positive(),
  participants: z.array(z.string()), // 用户ID数组
  organizer: z.string(), // 组织者ID
  status: z.enum(['scheduled', 'ongoing', 'ended', 'canceled']),
  roomId: z.string(), // 会议室ID
});

export type Meeting = z.infer<typeof MeetingSchema>;

export const meetingApi = {
  // 创建会议
  createMeeting: (data: {
    title: string;
    startTime: string;
    duration: number;
    participants: string[];
  }) => apiClient.post<Meeting>('/meetings', data).then(res => MeetingSchema.parse(res)),

  // 获取会议列表
  getMeetings: (params?: { status?: Meeting['status'] }) =>
    apiClient.get<Meeting[]>('/meetings', { params })
      .then(res => z.array(MeetingSchema).parse(res)),

  // 获取单个会议详情
  getMeeting: (id: string) =>
    apiClient.get<Meeting>(`/meetings/${id}`).then(res => MeetingSchema.parse(res)),

  // 加入会议
  joinMeeting: (meetingId: string) =>
    apiClient.post<{ token: string; rtcConfig: any }>(
      `/meetings/${meetingId}/join`
    ),

  // 结束会议 (仅组织者)
  endMeeting: (meetingId: string) =>
    apiClient.post(`/meetings/${meetingId}/end`),
};