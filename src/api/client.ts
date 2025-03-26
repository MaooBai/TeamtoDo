import axios from 'axios';
// 创建axios实例
const apiClient = axios.create({
  baseURL: 'http://192.168.5.3',
  timeout: 10000,
});

// 请求拦截器
apiClient.interceptors.request.use(
  async (config) => {
    // 统一设置请求头
    config.headers['Content-Type'] = 'application/json';
    return config;
  },
  (error) => Promise.reject(error)
);

// 响应拦截器
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response) {
      // 统一错误处理
      const { status, data } = error.response;
      return Promise.reject({
        status,
        message: data?.message || '请求失败',
        code: data?.code || 'UNKNOWN_ERROR',
      });
    }
    return Promise.reject({
      status: 500,
      message: '网络连接错误',
      code: 'NETWORK_ERROR',
    });
  }
);

export default apiClient;