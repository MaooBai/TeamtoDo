// 基础API客户端 - 保持向后兼容
import { enhancedApiClient } from './utils/client';

// 导出增强客户端作为默认客户端
const apiClient = enhancedApiClient;

export default apiClient;