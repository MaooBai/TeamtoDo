import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { agoraConfig, getRtcTokenFromServer, getTokenByChannel } from '../config/agoraConfig';

// 定义导航参数类型
type RootStackParamList = {
  CreateMeeting: undefined;
  VideoCall: {
    contactName: string;
    contactId: number;
    isIncoming?: boolean;
    meetingName?: string;
  };
};

type CreateMeetingScreenNavigationProp = StackNavigationProp<RootStackParamList, 'CreateMeeting'>;

interface Props {
  navigation: CreateMeetingScreenNavigationProp;
}

const CreateMeetingScreen: React.FC<Props> = ({ navigation }) => {
  const [meetingName, setMeetingName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // 处理创建会议
  const handleCreateMeeting = async () => {
    if (!meetingName.trim()) {
      Alert.alert('提示', '请输入会议名称');
      return;
    }

    setIsCreating(true);
    
    try {
      // 预先获取RTC Token
      console.log('正在获取RTC Token，频道名称:', meetingName);
      agoraConfig.defaultChannelName = meetingName;
      agoraConfig.token = await getRtcTokenFromServer(meetingName, 0);
      console.log('RTC Token获取成功');
      
      // 导航到视频通话界面，并传递会议名称
      navigation.navigate('VideoCall', {
        contactName: meetingName,
        contactId: 0, // 使用0表示这是一个会议而不是联系人
        isIncoming: false,
        meetingName: meetingName
      });
    } catch (error) {
      console.error('获取RTC Token失败:', error);
      Alert.alert('提示', '创建会议失败，请稍后重试');
    } finally {
      setIsCreating(false);
    }
  };

  // 处理加入会议
  const handleJoinMeeting = async () => {
    if (!meetingName.trim()) {
      Alert.alert('提示', '请输入会议名称');
      return;
    }

    setIsCreating(true);
    
    try {
      // 预先获取RTC Token
      console.log('正在获取RTC Token，频道名称:', meetingName);
      agoraConfig.token = await getTokenByChannel(meetingName);
      console.log('RTC Token获取成功');
      
      // 导航到视频通话界面，并传递会议名称
      navigation.navigate('VideoCall', {
        contactName: meetingName,
        contactId: 0, // 使用0表示这是一个会议而不是联系人
        isIncoming: false,
        meetingName: meetingName
      });
    } catch (error) {
      console.error('获取RTC Token失败:', error);
      Alert.alert('提示', '加入会议失败，请稍后重试');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color="#000" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>创建/加入会议</Text>
            <View style={styles.placeholder} />
          </View>

          <View style={styles.content}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>会议名称</Text>
              <TextInput
                style={styles.input}
                placeholder="请输入会议名称"
                value={meetingName}
                onChangeText={setMeetingName}
                autoCapitalize="none"
              />
            </View>

            <View style={styles.buttonContainer}>
              {isCreating ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#007AFF" />
                  <Text style={styles.loadingText}>正在处理...</Text>
                </View>
              ) : (
                <>
                  <TouchableOpacity
                    style={[styles.button, styles.createButton]}
                    onPress={handleCreateMeeting}
                  >
                    <Text style={styles.buttonText}>创建会议</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.button, styles.joinButton]}
                    onPress={handleJoinMeeting}
                  >
                    <Text style={styles.buttonText}>加入会议</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  backButton: {
    padding: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 44,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  inputContainer: {
    marginBottom: 30,
  },
  label: {
    fontSize: 16,
    marginBottom: 10,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
  },
  buttonContainer: {
    marginTop: 20,
    gap: 15,
  },
  button: {
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createButton: {
    backgroundColor: '#4285F4',
  },
  joinButton: {
    backgroundColor: '#34A853',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  loadingText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#007AFF',
  },
});

export default CreateMeetingScreen;