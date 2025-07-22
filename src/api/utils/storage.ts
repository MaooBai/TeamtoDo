import AsyncStorage from '@react-native-async-storage/async-storage';

const MESSAGES_KEY = 'websocket_messages';
const USER_DATA_KEY = 'user_data';

// 获取当前用户ID
const getCurrentUserId = async (): Promise<number | null> => {
  try {
    const userData = await AsyncStorage.getItem(USER_DATA_KEY);
    if (userData) {
      const parsedData = JSON.parse(userData);
      return parsedData.id || parsedData.userId || null;
    }
    return null;
  } catch (error) {
    console.error('Error getting current user ID:', error);
    return null;
  }
};

// 存储单条消息（添加当前用户标记）
export const storeMessage = async (message: any) => {
  try {
    const currentUserId = await getCurrentUserId();
    if (!currentUserId) {
      console.warn('无法获取当前用户ID，跳过消息存储');
      return;
    }

    // 为消息添加当前用户标记
    const messageWithUserTag = {
      ...message,
      currentUserId: currentUserId,
      storedAt: Date.now()
    };

    const existingMessages = await AsyncStorage.getItem(MESSAGES_KEY);
    const messages = existingMessages ? JSON.parse(existingMessages) : [];
    messages.push(messageWithUserTag);
    await AsyncStorage.setItem(MESSAGES_KEY, JSON.stringify(messages));
    
    console.log(`消息已存储，当前用户ID: ${currentUserId}`);
  } catch (error) {
    console.error('Error storing message:', error);
  }
};

// 获取当前用户的所有消息
export const getAllMessages = async () => {
  try {
    const currentUserId = await getCurrentUserId();
    if (!currentUserId) {
      console.warn('无法获取当前用户ID，返回空消息列表');
      return [];
    }

    const messages = await AsyncStorage.getItem(MESSAGES_KEY);
    const allMessages = messages ? JSON.parse(messages) : [];
    
    // 只返回属于当前用户的消息
    const userMessages = allMessages.filter((msg: any) => msg.currentUserId === currentUserId);
    
    console.log(`获取到 ${userMessages.length} 条当前用户消息，总消息数: ${allMessages.length}`);
    return userMessages;
  } catch (error) {
    console.error('Error getting messages:', error);
    return [];
  }
};

// 清除当前用户的所有消息
const clearCurrentUserMessages = async () => {
  try {
    const currentUserId = await getCurrentUserId();
    if (!currentUserId) {
      console.warn('无法获取当前用户ID，跳过清除操作');
      return;
    }

    const messages = await AsyncStorage.getItem(MESSAGES_KEY);
    const allMessages = messages ? JSON.parse(messages) : [];
    
    // 保留其他用户的消息，删除当前用户的消息
    const otherUsersMessages = allMessages.filter((msg: any) => msg.currentUserId !== currentUserId);
    
    await AsyncStorage.setItem(MESSAGES_KEY, JSON.stringify(otherUsersMessages));
    console.log(`已清除当前用户 ${currentUserId} 的所有消息`);
  } catch (error) {
    console.error('Error clearing current user messages:', error);
  }
};

// 获取所有消息（管理员功能，用于调试）
export const getAllMessagesForDebug = async () => {
  try {
    const messages = await AsyncStorage.getItem(MESSAGES_KEY);
    return messages ? JSON.parse(messages) : [];
  } catch (error) {
    console.error('Error getting all messages for debug:', error);
    return [];
  }
};

// 导出清除当前用户消息的函数供其他组件使用
export { clearCurrentUserMessages };