import { enhancedApiClient } from '../utils/client';
import { ApiResponseHandler } from '../utils/helpers';
import { API_ENDPOINTS } from '../config/endpoints';
import { LoginRequestSchema, LoginResponseSchema, LoginRequest, LoginResponse
  , RegisterRequest, RegisterResponseSchema, RegisterResponse, RegisterRequestSchema } from '../types/auth';
import { Alert } from 'react-native';

// 认证API服务
export const authApi = {
  // 登录
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    try {
      // 验证请求参数
      const validatedCredentials = LoginRequestSchema.parse(credentials);
      
      const response = await enhancedApiClient.post(API_ENDPOINTS.AUTH.LOGIN, validatedCredentials, {
        retries: 1, // 登录失败只重试1次
      });
      
      // 验证响应数据
      const validatedResponse = LoginResponseSchema.parse(response);
      
      return validatedResponse;
    } catch (error) {
      console.error('登录API错误:', error);
      throw error;
    }
  },
  // 注册
  register: async (register: RegisterRequest): Promise<RegisterResponse> => {
    try {
      console.log('=== authApi.register - API端点处理开始 ===');
      console.log('authApi.register - 接收到的原始参数:', JSON.stringify(register, null, 2));
      console.log('authApi.register - 参数详细信息:', {
        registerType: typeof register,
        isNull: register === null,
        isUndefined: register === undefined,
        keys: register ? Object.keys(register) : 'N/A',
        username: register?.username,
        email: register?.email,
        password: register?.password,
        usernameLength: register?.username?.length,
        emailLength: register?.email?.length,
        passwordLength: register?.password?.length
      });
      
      // 验证请求参数
      console.log('authApi.register - 开始RegisterRequestSchema验证...');
      const registerCredentials = RegisterRequestSchema.parse(register);
      console.log('authApi.register - RegisterRequestSchema验证通过，验证后参数:', JSON.stringify(registerCredentials, null, 2));
      console.log('authApi.register - 准备调用enhancedApiClient.post...');
      
      const response = await enhancedApiClient.post(API_ENDPOINTS.AUTH.REGISTER, registerCredentials, {
        retries: 1,
      });
      
      console.log('authApi.register - enhancedApiClient.post调用完成');
      console.log('authApi.register - 接收到的响应:', JSON.stringify(response, null, 2));
      
      // 验证响应数据
      console.log('authApi.register - 开始RegisterResponseSchema验证...');
      const validatedResponse = RegisterResponseSchema.parse(response);
      console.log('authApi.register - RegisterResponseSchema验证通过');
      console.log('authApi.register - 最终返回的响应:', JSON.stringify(validatedResponse, null, 2));
      console.log('=== authApi.register - API端点处理结束 ===');
      
      return validatedResponse;
    } catch (error) {
      console.error('注册API错误:', error);
      throw error;
    }
  },
  
  // 登出
  logout: async (): Promise<void> => {
    await enhancedApiClient.post(API_ENDPOINTS.AUTH.LOGOUT);
    // 清除本地存储的认证信息
    // 这里可以添加清除AsyncStorage中token的逻辑
  },
  
  // 检查登录状态
  checkAuthStatus: async (): Promise<boolean> => {
    try {
      // 这里可以调用一个验证token的接口
      // 暂时返回false，后续可以根据实际需求实现
      return false;
    } catch (error) {
      return false;
    }
  },
};

// 导出类型
export type { LoginRequest, LoginResponse };