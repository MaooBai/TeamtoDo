import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  StatusBar,
  Dimensions,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import {
  createAgoraRtcEngine,
  ChannelProfileType,
  ClientRoleType,
  IRtcEngine,
  RtcSurfaceView,
  VideoSourceType,
} from 'react-native-agora';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { agoraConfig, agoraServiceConfig, generateChannelName, validateAgoraConfig } from '../config/agoraConfig';

const { width, height } = Dimensions.get('window');

type RootStackParamList = {
  VideoCall: {
    contactName: string;
    contactId: number;
    isIncoming?: boolean;
  };
};

type VideoCallScreenNavigationProp = StackNavigationProp<RootStackParamList, 'VideoCall'>;
type VideoCallScreenRouteProp = RouteProp<RootStackParamList, 'VideoCall'>;

interface Props {
  navigation: VideoCallScreenNavigationProp;
  route: VideoCallScreenRouteProp;
}

const VideoCallScreen: React.FC<Props> = ({ navigation, route }) => {
  const { contactName, contactId, isIncoming = false } = route.params;
  
  const agoraEngineRef = useRef<IRtcEngine | null>(null);
  const [isJoined, setIsJoined] = useState(false);
  const [remoteUid, setRemoteUid] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isSpeakerEnabled, setIsSpeakerEnabled] = useState(true);
  const [callDuration, setCallDuration] = useState(0);
  const [isConnecting, setIsConnecting] = useState(false);
  
  const callTimerRef = useRef<NodeJS.Timeout | undefined>(undefined);

  useEffect(() => {
    setupVideoSDK();
    return () => {
      leave();
    };
  }, []);

  // 格式化通话时长
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 开始计时
  const startCallTimer = () => {
    callTimerRef.current = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
  };

  // 停止计时
  const stopCallTimer = () => {
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
      callTimerRef.current = undefined;
    }
  };

  // 获取设备权限
  const getPermission = async (): Promise<boolean> => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          PermissionsAndroid.PERMISSIONS.CAMERA,
        ]);
        
        const audioGranted = granted[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO] === PermissionsAndroid.RESULTS.GRANTED;
        const cameraGranted = granted[PermissionsAndroid.PERMISSIONS.CAMERA] === PermissionsAndroid.RESULTS.GRANTED;
        
        if (!audioGranted || !cameraGranted) {
          Alert.alert('权限错误', '需要麦克风和摄像头权限才能进行视频通话');
          return false;
        }
        return true;
      } catch (err) {
        console.warn('权限请求失败:', err);
        return false;
      }
    }
    return true;
  };

  // 初始化声网SDK
  const setupVideoSDK = async () => {
    try {
      // 验证配置
      if (!validateAgoraConfig()) {
        Alert.alert('配置错误', '请先配置声网App ID和Token');
        navigation.goBack();
        return;
      }

      // 检查权限
      const hasPermission = await getPermission();
      if (!hasPermission) {
        navigation.goBack();
        return;
      }

      // 创建RTC引擎
      agoraEngineRef.current = createAgoraRtcEngine();
      const agoraEngine = agoraEngineRef.current;

      // 注册事件监听器
      agoraEngine.registerEventHandler({
        onJoinChannelSuccess: () => {
          console.log('成功加入频道');
          setIsJoined(true);
          setIsConnecting(false);
          startCallTimer();
        },
        onUserJoined: (_connection, uid) => {
          setIsVideoEnabled(false);   
          // 延迟启动本地视频预览，确保设备准备就绪
          setTimeout(() => {
            if (agoraEngineRef.current) {
              agoraEngineRef.current.startPreview();
              setIsVideoEnabled(true);
              console.log('本地视频预览已启动');
            }
          }, 100);
          console.log('远端用户加入:', uid);
          setRemoteUid(uid);
        },
        onUserOffline: (_connection, uid) => {
          console.log('远端用户离开:', uid);
          setRemoteUid(0);
        },
        onLeaveChannel: () => {
          console.log('离开频道');
          setIsJoined(false);
          setRemoteUid(0);
          stopCallTimer();
        }
      });

      // 初始化引擎
      agoraEngine.initialize({
        appId: agoraConfig.appId,
        channelProfile: ChannelProfileType.ChannelProfileCommunication,
      });

      // 启用视频
      agoraEngine.enableVideo();
      agoraEngine.enableAudio();
      
      // 设置扬声器模式
      agoraEngine.setDefaultAudioRouteToSpeakerphone(true);
      agoraEngine.stopPreview();
      setIsVideoEnabled(false);   
      // 延迟启动本地视频预览，确保设备准备就绪
      setTimeout(() => {
        if (agoraEngineRef.current) {
          agoraEngineRef.current.startPreview();
          setIsVideoEnabled(true);
          console.log('本地视频预览已启动');
        }
      }, 300);

    } catch (error) {
      console.error('初始化SDK失败:', error);
      Alert.alert('初始化失败', '无法初始化视频通话功能');
      navigation.goBack();
    }
  };

  // 加入频道
  const join = async () => {
    if (isJoined) {
      return;
    }
    
    try {
      setIsConnecting(true);
      const agoraEngine = agoraEngineRef.current;
      if (!agoraEngine) {
        throw new Error('引擎未初始化');
      }

      // 设置用户角色为主播
      agoraEngine.setClientRole(ClientRoleType.ClientRoleBroadcaster);
      
      // 加入频道
      await agoraEngine.joinChannel(agoraConfig.token, agoraConfig.defaultChannelName, agoraConfig.uid, {
        clientRoleType: ClientRoleType.ClientRoleBroadcaster,
      });
      
    } catch (error) {
      console.error('加入频道失败:', error);
      setIsConnecting(false);
      Alert.alert('连接失败', '无法连接到视频通话');
    }
  };

  // 离开频道
  const leave = async () => {
    try {
      const agoraEngine = agoraEngineRef.current;
      if (agoraEngine) {
        agoraEngine.stopPreview();
        await agoraEngine.leaveChannel();
        agoraEngine.release();
      }
      stopCallTimer();
      setIsJoined(false);
      setRemoteUid(0);
      setCallDuration(0);
    } catch (error) {
      console.error('离开频道失败:', error);
    }
  };

  // 切换静音
  const toggleMute = () => {
    const agoraEngine = agoraEngineRef.current;
    if (agoraEngine) {
      agoraEngine.muteLocalAudioStream(!isMuted);
      setIsMuted(!isMuted);
    }
  };

  // 切换摄像头
  const toggleCamera = () => {
    const agoraEngine = agoraEngineRef.current;
    if (agoraEngine) {
      if (isVideoEnabled) {
        // 关闭视频
        agoraEngine.muteLocalVideoStream(true);
        agoraEngine.stopPreview();
        setIsVideoEnabled(false);
      } else {
        // 开启视频
        agoraEngine.enableVideo();
        agoraEngine.muteLocalVideoStream(false);
        setIsVideoEnabled(true);
        // 延迟启动预览，确保设备准备就绪
        setTimeout(() => {
          if (agoraEngine) {
            agoraEngine.startPreview();
            console.log('重新启动本地视频预览');
          }
        }, 300);
      }
    }
  };

  // 切换扬声器
  const toggleSpeaker = () => {
    const agoraEngine = agoraEngineRef.current;
    if (agoraEngine) {
      agoraEngine.setEnableSpeakerphone(!isSpeakerEnabled);
      setIsSpeakerEnabled(!isSpeakerEnabled);
    }
  };

  // 切换前后摄像头
  const switchCamera = () => {
    const agoraEngine = agoraEngineRef.current;
    if (agoraEngine) {
      agoraEngine.switchCamera();
    }
  };

  // 挂断通话
  const endCall = async () => {
    await leave();
    navigation.goBack();
  };

  // 接听通话
  const answerCall = () => {
    join();
  };

  // 拒接通话
  const rejectCall = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      {/* 视频区域 */}
      <View style={styles.videoContainer}>
        {/* 远端视频 */}
        {isJoined && remoteUid !== 0 ? (
          <RtcSurfaceView
            canvas={{ uid: remoteUid, sourceType: VideoSourceType.VideoSourceRemote }}
            style={styles.remoteVideo}
          />
        ) : (
          <View style={styles.waitingContainer}>
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>{contactName.charAt(0).toUpperCase()}</Text>
            </View>
            <Text style={styles.contactName}>{contactName}</Text>
            <Text style={styles.statusText}>
              {isConnecting ? '连接中...' : isJoined ? '等待对方接听...' : '准备通话'}
            </Text>
          </View>
        )}
        
        {/* 本地视频（小窗口） */}
        {isVideoEnabled && (
          <View style={styles.localVideoContainer}>
            <RtcSurfaceView
              canvas={{ uid: 0, sourceType: VideoSourceType.VideoSourceCamera }}
              style={styles.localVideo}
            />
          </View>
        )}
        
        {/* 通话信息 */}
        <View style={styles.callInfoContainer}>
          {isJoined && (
            <Text style={styles.durationText}>{formatDuration(callDuration)}</Text>
          )}
        </View>
      </View>
      
      {/* 控制按钮 */}
      <View style={styles.controlsContainer}>
        {isIncoming && !isJoined ? (
          // 来电界面
          <View style={styles.incomingControls}>
            <TouchableOpacity style={styles.rejectButton} onPress={rejectCall}>
              <Ionicons name="call" size={30} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.answerButton} onPress={answerCall}>
              <Ionicons name="call" size={30} color="#fff" />
            </TouchableOpacity>
          </View>
        ) : (
          // 通话控制界面
          <View style={styles.callControls}>
            <View style={styles.controlRow}>
              <TouchableOpacity 
                style={[styles.controlButton, isMuted && styles.activeControlButton]} 
                onPress={toggleMute}
              >
                <Ionicons 
                  name={isMuted ? "mic-off" : "mic"} 
                  size={24} 
                  color={isMuted ? "#fff" : "#333"} 
                />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.controlButton, !isVideoEnabled && styles.activeControlButton]} 
                onPress={toggleCamera}
              >
                <Ionicons 
                  name={isVideoEnabled ? "videocam" : "videocam-off"} 
                  size={24} 
                  color={!isVideoEnabled ? "#fff" : "#333"} 
                />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.controlButton, isSpeakerEnabled && styles.activeControlButton]} 
                onPress={toggleSpeaker}
              >
                <Ionicons 
                  name={isSpeakerEnabled ? "volume-high" : "volume-low"} 
                  size={24} 
                  color={isSpeakerEnabled ? "#fff" : "#333"} 
                />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.controlButton} onPress={switchCamera}>
                <Ionicons name="camera-reverse" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.actionRow}>
              {!isJoined ? (
                <TouchableOpacity style={styles.callButton} onPress={join}>
                  <Ionicons name="call" size={30} color="#fff" />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={styles.endCallButton} onPress={endCall}>
                  <Ionicons name="call" size={30} color="#fff" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  videoContainer: {
    flex: 1,
    position: 'relative',
  },
  remoteVideo: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  waitingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#4285F4',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
  },
  contactName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  statusText: {
    fontSize: 16,
    color: '#ccc',
  },
  localVideoContainer: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 120,
    height: 160,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#fff',
  },
  localVideo: {
    width: '100%',
    height: '100%',
  },
  callInfoContainer: {
    position: 'absolute',
    top: 50,
    left: 20,
  },
  durationText: {
    fontSize: 16,
    color: '#fff',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  controlsContainer: {
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  incomingControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  rejectButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#ff4444',
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ rotate: '135deg' }],
  },
  answerButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  callControls: {
    alignItems: 'center',
  },
  controlRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 30,
  },
  controlButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeControlButton: {
    backgroundColor: '#ff4444',
  },
  actionRow: {
    alignItems: 'center',
  },
  callButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  endCallButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#ff4444',
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ rotate: '135deg' }],
  },
});

export default VideoCallScreen;