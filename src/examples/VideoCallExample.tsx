/**
 * 视频会议功能使用示例
 * 
 * 这个文件展示了如何在不同场景下使用视频会议功能
 */

import React from 'react';
import { Alert } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';

// 导航类型定义
type RootStackParamList = {
  VideoCall: {
    contactName: string;
    contactId: number;
    isIncoming?: boolean;
  };
};

type NavigationProp = StackNavigationProp<RootStackParamList>;

/**
 * 视频会议功能使用示例类
 */
export class VideoCallExample {
  private navigation: NavigationProp;

  constructor(navigation: NavigationProp) {
    this.navigation = navigation;
  }

  /**
   * 示例1: 发起1对1视频通话
   */
  startOneOnOneCall = (contactName: string, contactId: number) => {
    this.navigation.navigate('VideoCall', {
      contactName,
      contactId,
      isIncoming: false
    });
  };

  /**
   * 示例2: 模拟接收来电
   */
  simulateIncomingCall = (contactName: string, contactId: number) => {
    this.navigation.navigate('VideoCall', {
      contactName,
      contactId,
      isIncoming: true
    });
  };

  /**
   * 示例3: 发起群组视频会议
   */
  startGroupCall = (groupName: string, groupId: number) => {
    this.navigation.navigate('VideoCall', {
      contactName: `群组: ${groupName}`,
      contactId: groupId,
      isIncoming: false
    });
  };

  /**
   * 示例4: 带确认对话框的视频通话
   */
  startCallWithConfirmation = (contactName: string, contactId: number) => {
    Alert.alert(
      '发起视频通话',
      `确定要与 ${contactName} 进行视频通话吗？`,
      [
        {
          text: '取消',
          style: 'cancel'
        },
        {
          text: '确定',
          onPress: () => this.startOneOnOneCall(contactName, contactId)
        }
      ]
    );
  };
}

/**
 * React组件中的使用示例
 */
export const VideoCallUsageExample: React.FC<{navigation: NavigationProp}> = ({ navigation }) => {
  const videoCallExample = new VideoCallExample(navigation);

  // 在按钮点击事件中使用
  const handleVideoCallPress = () => {
    videoCallExample.startOneOnOneCall('张三', 123);
  };

  const handleIncomingCallPress = () => {
    videoCallExample.simulateIncomingCall('李四', 456);
  };

  const handleGroupCallPress = () => {
    videoCallExample.startGroupCall('开发团队', 789);
  };

  const handleCallWithConfirmationPress = () => {
    videoCallExample.startCallWithConfirmation('王五', 101);
  };

  return null; // 这只是一个示例，不渲染UI
};

/**
 * 在MessageScreen中的集成示例
 */
export const MessageScreenIntegration = {
  // 在消息列表项中添加视频通话按钮
  addVideoCallButton: (navigation: NavigationProp, contactName: string, contactId: number) => {
    const videoCallExample = new VideoCallExample(navigation);
    return () => videoCallExample.startOneOnOneCall(contactName, contactId);
  },

  // 在聊天界面添加视频通话功能
  addChatVideoCall: (navigation: NavigationProp, contactName: string, contactId: number) => {
    const videoCallExample = new VideoCallExample(navigation);
    return () => videoCallExample.startCallWithConfirmation(contactName, contactId);
  }
};

/**
 * 常用的视频通话工具函数
 */
export const VideoCallUtils = {
  /**
   * 检查是否支持视频通话
   */
  isVideoCallSupported: (): boolean => {
    // 这里可以添加设备兼容性检查
    return true;
  },

  /**
   * 格式化通话时长
   */
  formatCallDuration: (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  },

  /**
   * 生成通话记录
   */
  createCallRecord: (contactName: string, contactId: number, duration: number, isIncoming: boolean) => {
    return {
      id: Date.now().toString(),
      contactName,
      contactId,
      duration,
      isIncoming,
      timestamp: new Date(),
      type: 'video' as const
    };
  }
};

/**
 * 使用说明和最佳实践
 */
export const VideoCallBestPractices = {
  tips: [
    '在发起视频通话前，确保用户已授权摄像头和麦克风权限',
    '为视频通话添加网络状态检查，避免在网络不佳时发起通话',
    '提供通话质量反馈机制，帮助用户了解通话状态',
    '实现通话记录功能，方便用户查看历史通话',
    '添加通话中的网络质量指示器',
    '支持通话中的消息发送功能',
    '实现通话录制功能（需要额外权限）',
    '添加通话结束后的评价功能'
  ],

  commonIssues: [
    '权限被拒绝：引导用户到设置中手动开启权限',
    '网络连接失败：检查网络状态并提供重试选项',
    'Token过期：实现Token自动刷新机制',
    '设备兼容性：添加设备兼容性检查',
    '音频问题：检查音频设备占用情况'
  ]
};