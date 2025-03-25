import React, { useState, useEffect } from 'react';
import { View, Keyboard, TextInput, StyleSheet, TouchableWithoutFeedback, KeyboardAvoidingView, Platform, ScrollView, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';

export const ForgotPasswordScreen = () => {
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [Error, setError] = useState('');
  const [countdown, setCountdown] = useState(0);
  const navigation = useNavigation();

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => timer && clearInterval(timer);
  }, [countdown]);

  const handleResetPassword = () => {
    if (!email || !verificationCode || !newPassword || !confirmPassword) {
      setError('请填写所有必填项');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('两次密码输入不一致');
      return;
    }
    
    setLoading(true);
    setError('');
    
    // 模拟密码重置请求
    setTimeout(() => {
      setLoading(false);
      console.log('密码重置信息:', { email, newPassword, verificationCode });
      navigation.navigate('Login' as never);
    }, 1500);
  };

  const handleGetVerificationCode = () => {
    if (!email) {
      setError('请输入邮箱地址');
      return;
    }
    setCountdown(60);
  };

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
            <View style={styles.topSpacer} />
            
            <View style={styles.formContainer}>
              <Text style={styles.title}>重置密码</Text>
              
              {Error ? <Text style={styles.errorText}>{Error}</Text> : null}
              
              <View style={styles.inputContainer}>
                <Text style={styles.label}>邮箱</Text>
                <TextInput
                  style={styles.input}
                  placeholder="请输入注册邮箱"
                  placeholderTextColor="#999"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>验证码</Text>
                <View style={styles.codeContainer}>
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    placeholder="请输入验证码"
                    placeholderTextColor="#999"
                    value={verificationCode}
                    onChangeText={setVerificationCode}
                  />
                  <TouchableOpacity 
                    style={styles.codeButton} 
                    onPress={handleGetVerificationCode}
                    disabled={countdown > 0}
                  >
                    <Text style={styles.codeButtonText}>
                      {countdown > 0 ? `${countdown}s` : '获取验证码'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>新密码</Text>
                <TextInput
                  style={styles.input}
                  placeholder="请输入新密码"
                  placeholderTextColor="#999"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>确认密码</Text>
                <TextInput
                  style={styles.input}
                  placeholder="请再次输入密码"
                  placeholderTextColor="#999"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  autoCapitalize="none"
                />
              </View>
              
              <TouchableOpacity
                style={styles.loginButton}
                onPress={handleResetPassword}
                disabled={loading}
                activeOpacity={0.7}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.loginButtonText}>重置密码</Text>
                )}
              </TouchableOpacity>
              
              <View style={styles.signupContainer}>
                <Text style={styles.signupText}>想起密码了?</Text>
                <TouchableOpacity onPress={() => navigation.navigate('Login' as never)}>
                  <Text style={styles.signupLink}>返回登录</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.bottomSpacer} />
          </ScrollView>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
  );
};

// 复用现有样式并扩展新样式
const styles = StyleSheet.create({
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

  codeContainer: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center'
  },
  codeButton: {
    backgroundColor: '#007AFF',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12
  },
  codeButtonText: {
    color: '#fff',
    fontSize: 14
  },
  // 其他样式复用已有定义...
});