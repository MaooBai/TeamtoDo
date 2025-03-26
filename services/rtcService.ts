import { createAgoraRtcEngine, IRtcEngine } from 'react-native-agora';
import { agoraConfig } from '../config';

class RTCService {
  private engine: IRtcEngine | null = null;
  private channelId: string | null = null;

  // 初始化RTC引擎
  async initialize() {
    this.engine = await createAgoraRtcEngine();
    await this.engine.initialize({
      appId: agoraConfig.appId,
    });
    
    // 启用音视频模块
    await this.engine.enableVideo();
    await this.engine.enableAudio();
    
    // 设置事件监听
    this.engine.registerEventHandler({
      onJoinChannelSuccess: (connection, elapsed) => {
        console.log(`加入频道成功: ${connection.channelId}`);
      },
      onUserJoined: (connection, remoteUid, elapsed) => {
        console.log(`用户加入: ${remoteUid}`);
      },
    });
  }

  // 加入频道
  async joinChannel(token: string, channelId: string, uid?: number) {
    if (!this.engine) return;
    
    this.channelId = channelId;
    await this.engine.joinChannel(
      token,
      channelId,
      uid ?? 0,
      {
        autoSubscribeAudio: true,
        autoSubscribeVideo: true,
      }
    );
  }

  // 离开频道
  async leaveChannel() {
    if (this.engine && this.channelId) {
      await this.engine.leaveChannel();
      this.channelId = null;
    }
  }

  // 开启/关闭本地视频
  async toggleLocalVideo(enabled: boolean) {
    if (!this.engine) return;
    
    if (enabled) {
      await this.engine.startPreview();
      await this.engine.enableLocalVideo(true);
    } else {
      await this.engine.stopPreview();
      await this.engine.enableLocalVideo(false);
    }
  }

  // 开启/关闭本地音频
  async toggleLocalAudio(enabled: boolean) {
    if (!this.engine) return;
    await this.engine.enableLocalAudio(enabled);
  }

  // 销毁引擎
  async destroy() {
    await this.leaveChannel();
    this.engine?.release();
    this.engine = null;
  }
}

export const rtcService = new RTCService();