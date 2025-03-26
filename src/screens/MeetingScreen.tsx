import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { RenderModeType, RtcSurfaceView, RtcTextureView } from 'react-native-agora';
import { useMeetings } from '../api/hooks/useMeeting';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { rtcService } from '../../services/rtcService';

// 为 route 参数添加类型定义，避免隐式的 any 类型
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

// 假设路由参数类型
type RootStackParamList = {
  MeetingScreen: { meetingId: string };
};

type MeetingScreenRouteProp = RouteProp<RootStackParamList, 'MeetingScreen'>;

const MeetingScreen = ({ route }: { route: MeetingScreenRouteProp }) => {
  const { meetingId } = route.params;

// 假设加入会议的逻辑
const joinMeeting = () => {
  // 实现加入会议的具体逻辑
  console.log('加入会议', meetingId);
};

// 假设是否正在加入会议的状态
const [isJoining] = useState(false);

// 假设离开会议的逻辑
const leaveMeeting = () => {
  // 实现离开会议的具体逻辑
  console.log('离开会议', meetingId);
};
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [remoteUids] = useState<number[]>([]);

  useEffect(() => {
    // 加入会议
    joinMeeting();
    
    return () => {
      // 离开会议
      leaveMeeting();
    };
  }, []);

  const toggleVideo = () => {
    rtcService.toggleLocalVideo(!isVideoOn);
    setIsVideoOn(!isVideoOn);
  };

  const toggleAudio = () => {
    rtcService.toggleLocalAudio(!isAudioOn);
    setIsAudioOn(!isAudioOn);
  };

  return (
    <View style={styles.container}>
      {/* 远程用户视频 */}
      <View style={styles.remoteContainer}>
        {remoteUids.map(uid => (
          <RtcTextureView
            key={uid}
            style={styles.remoteVideo}
            canvas={{
              uid: uid,
              renderMode: 'HIDDEN' as unknown as RenderModeType,
            }}
          />
        ))}
      </View>
      
      {/* 本地用户视频 */}
      <View style={styles.localVideoContainer}>
        <RtcSurfaceView
          style={styles.localVideo}
          canvas={{
            uid: 0, // 0表示本地视图
            renderMode: 'HIDDEN' as unknown as RenderModeType,
          }}
        />
      </View>
      
      {/* 控制工具栏 */}
      <View style={styles.controlBar}>
        <TouchableOpacity style={styles.controlButton} onPress={toggleAudio}>
          <Ionicons 
            name={isAudioOn ? "mic" : "mic-off"} 
            size={24} 
            color="#fff" 
          />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.controlButton} onPress={toggleVideo}>
          <Ionicons 
            name={isVideoOn ? "videocam" : "videocam-off"} 
            size={24} 
            color="#fff" 
          />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.controlButton, styles.endButton]}
          onPress={leaveMeeting}
        >
          <Ionicons name="call" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
      
      {isJoining && (
        <View style={styles.loadingOverlay}>
          <Text style={styles.loadingText}>正在加入会议...</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  remoteContainer: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  remoteVideo: {
    width: '50%',
    height: '50%',
  },
  localVideoContainer: {
    position: 'absolute',
    bottom: 80,
    right: 20,
    width: 120,
    height: 160,
    borderRadius: 8,
    overflow: 'hidden',
  },
  localVideo: {
    flex: 1,
  },
  controlBar: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
  },
  controlButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 10,
  },
  endButton: {
    backgroundColor: '#ff3b30',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 10,
  },
});

export default MeetingScreen;