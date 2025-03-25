import React, { useState } from 'react';
import { View, Keyboard, TextInput, StyleSheet, TouchableWithoutFeedback, KeyboardAvoidingView, Platform, ScrollView, Image, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';

export const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [Error, setError] = useState('');

  const handleLogin = () => {
      if (!email || !password) {
        setError('请输入邮箱和密码');
        return;
      }
      
      setLoading(true);
      setError('');
      
      // 模拟登录请求
      setTimeout(() => {
        setLoading(false);
        // 这里替换为实际的登录逻辑
        console.log('登录信息:', { email, password });
        navigation.navigate('Home' as never);
      }, 1500);
    };  // <-- 补全函数闭合
  
    return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
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
            {Error ? <Text style={styles.errorText}>{Error}</Text> : null}
            
            {/* 邮箱输入 */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>邮箱</Text>
              <TextInput
                style={styles.input}
                placeholder="请输入邮箱"
                placeholderTextColor="#999"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
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
            // 在登录界面中找到忘记密码按钮
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
              disabled={loading}
              activeOpacity={0.7}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.loginButtonText}>登录</Text>
              )}
            </TouchableOpacity>
            
            {/* 注册选项 */}
            <View style={styles.signupContainer}>
              <Text style={styles.signupText}>还没有账号?</Text>
              // 在登录界面中找到注册按钮部分修改为
              <TouchableOpacity onPress={() => navigation.navigate('Register' as never)}>
                <Text style={styles.signupLink}>立即注册</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          {/* 底部留白 */}
          <View style={styles.bottomSpacer} />
        </ScrollView>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
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