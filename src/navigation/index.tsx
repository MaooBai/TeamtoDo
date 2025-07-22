import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { HomeScreen, LoginScreen, RegisterScreen, ForgotPasswordScreen, ChatScreen } from '../screens';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiService from '../api/services/apiService';

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Home: undefined;
  ForgotPassword: undefined;
  Message: undefined;
  Chat: {
    contactId: number;
    contactName: string;
    contactAvatar: string;
  };
};

const Stack = createStackNavigator<RootStackParamList>();

// 存储键常量
const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER_DATA: 'user_data',
};

export const MainStackNavigator = () => {
  const [initialRoute, setInitialRoute] = useState<keyof RootStackParamList>('Login');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      
      if (token) {
        console.log('发现已存在的认证token，准备验证并导航到消息页面');
        
        // 在后台验证token并刷新用户数据
        try {
          // 验证token有效性并获取最新用户数据
          const userResponse = await apiService.users.getMe();
          
          if (userResponse.code === 200 && userResponse.data) {
            // Token有效，更新本地用户数据
            await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userResponse.data));
            console.log('Token验证成功，用户数据已更新，导航到消息页面');
            setInitialRoute('Home');
          } else {
            throw new Error('Token验证失败');
          }
        } catch (error) {
          console.error('Token验证失败，导航到登录页面:', error);
          // Token无效，清除并导航到登录页面
          await AsyncStorage.multiRemove([STORAGE_KEYS.AUTH_TOKEN, STORAGE_KEYS.USER_DATA]);
          setInitialRoute('Login');
        }
      } else {
        console.log('未发现认证token，导航到登录页面');
        setInitialRoute('Login');
      }
    } catch (error) {
      console.error('检查认证状态失败:', error);
      setInitialRoute('Login');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>正在检查登录状态...</Text>
      </View>
    );
  }

  return (
    <Stack.Navigator initialRouteName={initialRoute}>
    <Stack.Screen
      name="Login"
      component={LoginScreen}
      options={{ 
        headerShown: false,
        gestureEnabled: false,
      }}
    />
    <Stack.Screen
      name="Register"
      component={RegisterScreen}
      options={{ headerShown: false }}
    />
    <Stack.Screen 
      name="Home" 
      component={HomeScreen} 
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="ForgotPassword"
      component={ForgotPasswordScreen}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="Chat"
      component={ChatScreen}
      options={{ headerShown: false }}
    />
  </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
  },
});