// 声网配置文件
// 请在声网控制台获取以下信息并替换相应的值
import { apiService } from '../api/services/apiService';

export const agoraConfig = {
  // 声网App ID - 请替换为你的App ID
  appId: '7e4dc9f1f6994e9bac77943dadd0a275',
  
  // 临时Token - 请替换为你的Token（24小时有效）
  // 生产环境中应该从服务器动态获取
  token: '007eJxTYJDWebPJ4FrA2pn7tsqmPrF8rLe2ce7M63sjM3tUFXp3v5FVYDBPNUlJtkwzTDOztDRJtUxKTDY3tzQxTklMSTFINDI3TbjUmNEQyMjQMWEqIyMDBIL4zAyGRsYMDACP/R/4',
  
  // 默认频道名称
  defaultChannelName: '123',
  
  // 本地用户ID（0表示由声网自动分配）
  uid: 0,
};

export const getTokenByChannel = async (channelName: string) => {
  try {
    const response = await apiService.agora.getTokenByChannel({
      channelName,
    });
    return response.data;
  } catch (error) {
    console.error('获取RTC Token失败:', error);
    return null;
  }
};

// 从服务器获取RTC Token
export const getRtcTokenFromServer = async (channelName: string, uid: number | string = 0): Promise<string> => {
  try {
    const response = await apiService.agora.getRtcToken({
      channelName,
      uid,
      role: 'publisher',
      tokenExpireSeconds: 3600 // 1小时过期
    });
    
    // 根据实际接口返回结构调整
    console.log('API Response:', response);   
    // 检查接口返回的数据结构
    if (response && response.data) {
      // 如果response.data是字符串类型，直接作为token返回
      if (typeof response.data === 'string') {
        console.log('直接使用字符串类型的response.data作为token');
        return response.data;
      }else {
        throw new Error(`获取Token失败: ${response.data.msg || '未知错误'}`);
      }
    } else {
      throw new Error('获取Token失败: 接口返回数据结构异常');
    }
  } catch (error) {
    console.error('获取RTC Token失败:', error);
    // 失败时返回配置中的静态Token作为备选
    return agoraConfig.token;
  }
};

// 声网服务配置
export const agoraServiceConfig = {
  // 频道配置类型
  channelProfile: 'ChannelProfileCommunication', // 通信模式，适用于1对1或小群组通话
  
  // 用户角色
  clientRole: 'ClientRoleBroadcaster', // 主播角色，可以发送和接收音视频
  
  // 音频配置
  audioConfig: {
    enableAudio: true,
    enableSpeakerphone: true, // 默认使用扬声器
  },
  
  // 视频配置
  videoConfig: {
    enableVideo: true,
    enableLocalVideo: true,
  },
};

// 获取动态频道名称（基于用户ID或房间ID）
export const generateChannelName = (userId1: number, userId2: number): string => {
  // 确保频道名称的一致性，较小的ID在前
  const sortedIds = [userId1, userId2].sort((a, b) => a - b);
  return `call_${sortedIds[0]}_${sortedIds[1]}`;
};

// 验证配置是否完整
export const validateAgoraConfig = (): boolean => {
  if (agoraConfig.appId === 'YOUR_APP_ID') {
    console.warn('请在 agoraConfig.ts 中配置正确的 App ID');
    return false;
  }
  
  if (agoraConfig.token === 'YOUR_TOKEN') {
    console.warn('请在 agoraConfig.ts 中配置正确的 Token');
    return false;
  }
  
  return true;
};