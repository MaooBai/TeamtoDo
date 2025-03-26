import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import AntDesign from 'react-native-vector-icons/AntDesign';

// 为 navigation 参数添加显式类型定义，假设使用 React Navigation，这里简单用 any 替代，实际应根据情况定义具体类型
export const ProfileScreen = ({ navigation }: { navigation: any }) => {
  // 模拟用户数据
  const user = {
    name: '张三',
    avatar: 'https://randomuser.me/api/portraits/men/1.jpg',
    email: 'zhangsan@example.com',
    phone: '13800138001',
    department: '技术部',
    position: '前端开发工程师'
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
      icon: <AntDesign name="questioncircle" size={24} color="#4285F4" />,
      title: '帮助中心',
      onPress: () => navigation.navigate('Help')
    },
    {
      icon: <Ionicons name="log-out" size={24} color="#EA4335" />,
      title: '退出登录',
      titleStyle: { color: '#EA4335' },
      onPress: () => console.log('退出登录')
    }
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* 个人信息卡片 */}
        <View style={styles.profileCard}>
          <Image source={{ uri: user.avatar }} style={styles.avatar} />
          <Text style={styles.name}>{user.name}</Text>
          <Text style={styles.position}>{user.position}</Text>
          
          <View style={styles.infoRow}>
            <Ionicons name="mail" size={18} color="#666" />
            <Text style={styles.infoText}>{user.email}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Ionicons name="call" size={18} color="#666" />
            <Text style={styles.infoText}>{user.phone}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Ionicons name="business" size={18} color="#666" />
            <Text style={styles.infoText}>{user.department}</Text>
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
});

export default ProfileScreen;