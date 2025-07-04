// API端点配置
export const API_ENDPOINTS = {
  // 认证相关
  AUTH: {
    LOGIN: '/api/login',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    REGISTER: '/api/register',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    VERIFY_EMAIL: '/auth/verify-email',
  },

  // 用户相关
  USERS: {
    ME: '/users/me',
    LIST: '/users',
    GET: (id: string) => `/users/${id}`,
    UPDATE: (id: string) => `/users/${id}`,
    DELETE: (id: string) => `/users/${id}`,
    AVATAR: (id: string) => `/users/${id}/avatar`,
    CHANGE_PASSWORD: '/users/me/change-password',
  },

  // 会议相关
  MEETINGS: {
    LIST: '/meetings',
    CREATE: '/meetings',
    GET: (id: string) => `/meetings/${id}`,
    UPDATE: (id: string) => `/meetings/${id}`,
    DELETE: (id: string) => `/meetings/${id}`,
    JOIN: (id: string) => `/meetings/${id}/join`,
    LEAVE: (id: string) => `/meetings/${id}/leave`,
    END: (id: string) => `/meetings/${id}/end`,
    PARTICIPANTS: (id: string) => `/meetings/${id}/participants`,
    RECORDINGS: (id: string) => `/meetings/${id}/recordings`,
  },

  // 消息相关
  MESSAGES: {
    LIST: '/messages',
    SEND: '/messages',
    GET: (id: string) => `/messages/${id}`,
    UPDATE: (id: string) => `/messages/${id}`,
    DELETE: (id: string) => `/messages/${id}`,
    MARK_READ: (id: string) => `/messages/${id}/read`,
    ATTACHMENTS: '/messages/attachments',
  },

  // 协作相关
  COLLABORATION: {
    PROJECTS: '/collaboration/projects',
    PROJECT: (id: string) => `/collaboration/projects/${id}`,
    PROJECT_MEMBERS: (id: string) => `/collaboration/projects/${id}/members`,
    TASKS: '/collaboration/tasks',
    TASK: (id: string) => `/collaboration/tasks/${id}`,
    TASK_COMMENTS: (id: string) => `/collaboration/tasks/${id}/comments`,
  },

  // 联系人相关
  CONTACTS: {
    LIST: '/contacts',
    ADD: '/contacts',
    GET: (id: string) => `/contacts/${id}`,
    UPDATE: (id: string) => `/contacts/${id}`,
    DELETE: (id: string) => `/contacts/${id}`,
    SEARCH: '/contacts/search',
    GROUPS: '/contacts/groups',
    GROUP: (id: string) => `/contacts/groups/${id}`,
  },

  // 文件相关
  FILES: {
    UPLOAD: '/files/upload',
    DOWNLOAD: (id: string) => `/files/${id}/download`,
    DELETE: (id: string) => `/files/${id}`,
    LIST: '/files',
    GET_INFO: (id: string) => `/files/${id}`,
  },

  // 通知相关
  NOTIFICATIONS: {
    LIST: '/notifications',
    MARK_READ: (id: string) => `/notifications/${id}/read`,
    MARK_ALL_READ: '/notifications/read-all',
    DELETE: (id: string) => `/notifications/${id}`,
    SETTINGS: '/notifications/settings',
  },

  // 系统相关
  SYSTEM: {
    HEALTH: '/system/health',
    VERSION: '/system/version',
    CONFIG: '/system/config',
  },
} as const;

// API版本配置
export const API_VERSIONS = {
  V1: '/api/v1',
  V2: '/api/v2',
} as const;

// 默认API版本
export const DEFAULT_API_VERSION = API_VERSIONS.V1;

// 构建完整的API端点URL
export function buildApiUrl(endpoint: string, version: string = DEFAULT_API_VERSION): string {
  return `${version}${endpoint}`;
}

// 获取带版本的端点配置
export function getVersionedEndpoints(version: string = DEFAULT_API_VERSION) {
  const versionedEndpoints: any = {};
  
  Object.entries(API_ENDPOINTS).forEach(([category, endpoints]) => {
    versionedEndpoints[category] = {};
    
    Object.entries(endpoints).forEach(([key, endpoint]) => {
      if (typeof endpoint === 'function') {
        versionedEndpoints[category][key] = (id: string) => 
          buildApiUrl(endpoint(id), version);
      } else {
        versionedEndpoints[category][key] = buildApiUrl(endpoint, version);
      }
    });
  });
  
  return versionedEndpoints;
}

// 导出带版本的端点
export const VERSIONED_ENDPOINTS = getVersionedEndpoints();