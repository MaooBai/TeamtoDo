import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import AntDesign from 'react-native-vector-icons/AntDesign';
import { useLogout, useAuthStatus, useStoredUserData } from '../api/hooks/useAuth';
import { apiConfig } from '../api/config/config';
import { clearCurrentUserMessages } from '../api/utils/storage';
import { Alert } from 'react-native';


// 为 navigation 参数添加显式类型定义，假设使用 React Navigation，这里简单用 any 替代，实际应根据情况定义具体类型
export const ProfileScreen = ({ navigation }: { navigation: any }) => {
  const logout = useLogout();
  const { isLoading } = useAuthStatus();
  const { data: storedUserData, isLoading: isLoadingStoredData } = useStoredUserData();
  
  // 默认用户数据
  const defaultUserData = {
    name: '张三',
    avatar: 'https://randomuser.me/api/portraits/men/1.jpg',
    email: '11111@example.com',
    phone: '13800138001',
    department: '技术部',
    position: '前端开发工程师'
  };

  // 处理用户数据，优先使用本地存储的数据
  const userData = storedUserData ? {
    name: storedUserData.nickName || defaultUserData.name,
    avatar: storedUserData.avatar || defaultUserData.avatar,
    email: storedUserData.email || defaultUserData.email,
    phone: storedUserData.phonenumber || defaultUserData.phone,
    department: storedUserData.deptName || defaultUserData.department,
    position: defaultUserData.position // API 中可能没有职位信息，保持默认值
  } : defaultUserData;

  console.log('当前用户数据:', userData);
  console.log('本地存储数据:', storedUserData);

  // 清除消息的处理函数
  const handleClearMessages = () => {
    Alert.alert(
      '清除消息',
      '确定要清除所有聊天记录吗？此操作不可恢复。',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确定',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearCurrentUserMessages();
              Alert.alert('成功', '所有聊天记录已清除');
            } catch (error) {
              console.error('清除消息失败:', error);
              Alert.alert('错误', '清除聊天记录失败，请重试');
            }
          }
        }
      ]
    );
  };

  // 功能选项
  const options = [
    { 
      icon: <Ionicons name="settings" size={24} color="#4285F4" />,
      title: '账号设置',
      onPress: () => navigation.navigate('Settings')
    },
    {
      icon: <MaterialIcons name="privacy-tip" size={24} color="#4285F4" />,
      title: '隐私设置',
      onPress: () => navigation.navigate('Privacy')
    },
    {
      icon: <Ionicons name="notifications" size={24} color="#4285F4" />,
      title: '通知设置',
      onPress: () => navigation.navigate('Notifications')
    },
    {
      icon: <Ionicons name="trash" size={24} color="#FF9500" />,
      title: '清除聊天记录',
      titleStyle: { color: '#FF9500' },
      onPress: handleClearMessages
    },
    {
      icon: <AntDesign name="questioncircle" size={24} color="#4285F4" />,
      title: '帮助中心',
      onPress: () => navigation.navigate('Help')
    },
    {
      icon: <Ionicons name="log-out" size={24} color="#EA4335" />,
      title: '退出登录',
      titleStyle: { color: '#EA4335' },
      onPress: async () => {
        try {
          await logout.mutateAsync();
          navigation.navigate('Login');
        } catch (error) {
          console.error('退出登录失败:', error);
        }
      }
    }
  ];

  // 如果正在加载，显示加载指示器
  if (isLoading || isLoadingStoredData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4285F4" />
          <Text style={styles.loadingText}>加载用户信息中...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* 错误提示 */}

        
        {/* 个人信息卡片 */}
        <View style={styles.profileCard}>
          <Image source={{ uri: apiConfig.baseURL + userData.avatar }} style={styles.avatar} />
          <Text style={styles.name}>{userData.name}</Text>
          <Text style={styles.position}>{userData.position}</Text>
          
          <View style={styles.infoRow}>
            <Ionicons name="mail" size={18} color="#666" />
            <Text style={styles.infoText}>{userData.email}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Ionicons name="call" size={18} color="#666" />
            <Text style={styles.infoText}>{userData.phone}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Ionicons name="business" size={18} color="#666" />
            <Text style={styles.infoText}>{userData.department}</Text>
          </View>
          
          <TouchableOpacity 
            style={styles.editButton}
            onPress={() => navigation.navigate('EditProfile')}
          >
            <Text style={styles.editButtonText}>编辑资料</Text>
          </TouchableOpacity>
        </View>
        
        {/* 功能选项列表 */}
        <View style={styles.optionsContainer}>
          {options.map((option, index) => (
            <TouchableOpacity 
              key={index}
              style={styles.optionItem}
              onPress={option.onPress}
            >
              <View style={styles.optionIcon}>
                {option.icon}
              </View>
              <Text style={[styles.optionText, option.titleStyle]}>
                {option.title}
              </Text>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    paddingBottom: 20,
  },
  profileCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    margin: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
    borderWidth: 3,
    borderColor: '#4285F4',
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  position: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 12,
  },
  editButton: {
    marginTop: 16,
    paddingVertical: 8,
    paddingHorizontal: 24,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#4285F4',
  },
  editButtonText: {
    color: '#4285F4',
    fontSize: 14,
    fontWeight: '500',
  },
  optionsContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  optionIcon: {
    width: 40,
    alignItems: 'center',
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    borderRadius: 8,
    padding: 16,
    margin: 16,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 14,
    color: '#d32f2f',
    marginBottom: 12,
  },
  retryButton: {
    backgroundColor: '#4285F4',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default ProfileScreen;