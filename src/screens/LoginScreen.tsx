import React, { useState, useCallback } from 'react';
import { View, Keyboard, TextInput, StyleSheet, TouchableWithoutFeedback, KeyboardAvoidingView, Platform, ScrollView, Image, Text, TouchableOpacity, ActivityIndicator, Alert, BackHandler } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../api/hooks/useAuth';

export const LoginScreen = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigation = useNavigation();
  const { login, isLoggingIn, loginError } = useAuth();

  // 阻止Android返回键
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        // 返回true阻止默认返回行为
        return true;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);

      return () => subscription.remove();
    }, [])
  );

  const handleLogin = async () => {
    const trimmedUsername = username.trim();
    const trimmedPassword = password.trim();
    
    if (!trimmedUsername || !trimmedPassword) {
      Alert.alert('错误', '请输入用户名和密码');
      return;
    }

    try {
      const response = await login({ username: trimmedUsername, password: trimmedPassword }, {
        onSuccess: (data) => {
          if (data.code === 200) {
            Alert.alert('成功', '登录成功!');
            // 这里可以导航到主页面
            navigation.navigate('Home' as never);
          } else {
            Alert.alert('登录失败', data.msg || '登录失败，请重试');
          }
        },
        onError: (error: any) => {
          Alert.alert('登录失败', error?.message || '登录失败，请重试');
        },
      });
    } catch (error: any) {
      Alert.alert('登录失败', error?.message || '登录失败，请重试');
    }
  };
  
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          {/* 顶部留白 */}
          <View style={styles.topSpacer} />
          
          {/* Logo区域 */}
          {/* <View style={styles.logoContainer}> */}
            {/* <Image
              source={require('./assets/logo.png')} // 替换为你的logo
              style={styles.logo}
              resizeMode="contain"
            /> */}
          {/* </View> */}
          
          {/* 表单区域 */}
          <View style={styles.formContainer}>
            <Text style={styles.title}>登录</Text>
            
            {/* 错误提示 */}
            {loginError ? <Text style={styles.errorText}>{loginError.message || '登录失败'}</Text> : null}
            
            {/* 用户名输入 */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>用户名</Text>
              <TextInput
                style={styles.input}
                placeholder="请输入用户名"
                placeholderTextColor="#999"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
              />
            </View>
            
            {/* 密码输入 */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>密码</Text>
              <TextInput
                style={styles.input}
                placeholder="请输入密码"
                placeholderTextColor="#999"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={handleLogin}
              />
            </View>
            
            {/* 忘记密码 */}
            {/* 在登录界面中找到忘记密码按钮 */}
            <TouchableOpacity 
              style={styles.forgotPassword}
              onPress={() => navigation.navigate('ForgotPassword' as never)}
            >
              <Text style={styles.forgotPasswordText}>忘记密码?</Text>
            </TouchableOpacity>
            
            {/* 登录按钮 */}
            <TouchableOpacity
              style={styles.loginButton}
              onPress={handleLogin}
              disabled={isLoggingIn}
              activeOpacity={0.7}
            >
              {isLoggingIn ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.loginButtonText}>登录</Text>
              )}
            </TouchableOpacity>
            
            {/* 注册选项 */}
            <View style={styles.signupContainer}>
              <Text style={styles.signupText}>还没有账号?</Text>
              {/* 在登录界面中找到注册按钮部分修改为 */}
              <TouchableOpacity onPress={() => navigation.navigate('Register' as never)}>
                <Text style={styles.signupLink}>立即注册</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          {/* 底部留白 */}
          <View style={styles.bottomSpacer} />
        </ScrollView>
      </KeyboardAvoidingView>
  );
  }
export const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#f5f5f5',
    },
    scrollContainer: {
      flexGrow: 1,
      justifyContent: 'center',
    },
    topSpacer: {
      height: 20,
    },
    bottomSpacer: {
      height: 20,
    },
    logoContainer: {
      alignItems: 'center',
      marginBottom: 30,
    },
    logo: {
      width: 120,
      height: 120,
    },
    formContainer: {
      marginHorizontal: 30,
      backgroundColor: '#fff',
      borderRadius: 10,
      padding: 25,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#333',
      marginBottom: 25,
      textAlign: 'center',
    },
    inputContainer: {
      marginBottom: 20,
    },
    label: {
      fontSize: 14,
      color: '#666',
      marginBottom: 8,
    },
    input: {
      height: 50,
      borderWidth: 1,
      borderColor: '#ddd',
      borderRadius: 8,
      paddingHorizontal: 15,
      fontSize: 16,
      backgroundColor: '#f9f9f9',
    },
    forgotPassword: {
      alignSelf: 'flex-end',
      marginBottom: 25,
    },
    forgotPasswordText: {
      color: '#4285F4',
      fontSize: 14,
    },
    loginButton: {
      height: 50,
      backgroundColor: '#4285F4',
      borderRadius: 8,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 20,
    },
    loginButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: 'bold',
    },
    signupContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
    },
    signupText: {
      color: '#666',
      fontSize: 14,
      marginRight: 5,
    },
    signupLink: {
      color: '#4285F4',
      fontSize: 14,
      fontWeight: 'bold',
    },
    errorText: {
      color: '#EA4335',
      fontSize: 14,
      marginBottom: 15,
      textAlign: 'center',
    },
  });