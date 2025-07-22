import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Image,
  Alert
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { sendMessageAuth } from '../api/hooks/chat';
import { MessageRequest, MessageRequestSchema } from '../api/types/auth';
import { storeMessage, getAllMessages } from '../api/utils/storage';
import { apiConfig } from '../api/config/config';

// 路由参数类型
type ChatScreenRouteProp = RouteProp<{
  Chat: {
    contactId: number;
    contactName: string;
    contactAvatar: string;
    lastMessage?: string;
    time: Date;
  };
}, 'Chat'>;

type ChatScreenNavigationProp = StackNavigationProp<any, 'Chat'>;

// 消息类型
interface Message {
  id: string;
  text: string;
  timestamp: Date;
  isOwn: boolean;
  status: 'sending' | 'sent' | 'delivered' | 'read';
}

export const ChatScreen = () => {
  const route = useRoute<ChatScreenRouteProp>();
  const navigation = useNavigation<ChatScreenNavigationProp>();
  const { contactId, contactName, contactAvatar, lastMessage, time } = route.params;

  
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  // 加载历史消息
  const loadMessageHistory = async () => {
    try {
      setIsLoadingHistory(true);
      
      // 从本地存储加载消息
      const storedMessages = await getAllMessages();
      const chatMessages: Message[] = [];
      
      // 过滤出与当前联系人相关的消息并转换格式 - 显示完整历史记录
        if (storedMessages.length > 0) {
          console.log('加载历史消息，联系人ID:', contactId, '存储消息数量:', storedMessages.length);
          
          storedMessages.forEach((wsMessage: any) => {
            if (wsMessage.data?.userId === contactId || 
                (wsMessage.type === 'chat' && wsMessage.data?.userId === contactId)) {
              const messageId = wsMessage.data?.messageId || `${wsMessage.data?.userId}_${wsMessage.timestamp}`;
              let messageText = "";
              if (wsMessage.content === "新消息") {
                messageText = wsMessage.data?.content || "";
              } else {
                messageText = wsMessage.content || "";
              }
              
              // 判断是否为自己发送的消息
              const isOwnMessage = wsMessage.data?.username === 'me';
              
              const newMessage: Message = {
                id: messageId,
                text: messageText,
                timestamp: new Date(wsMessage.timestamp),
                isOwn: isOwnMessage,
                status: isOwnMessage ? 'delivered' : 'read'
              };
              
              // 添加所有历史消息，不进行去重
              chatMessages.push(newMessage);
              console.log('添加历史消息:', messageText, '时间:', newMessage.timestamp, '是否自己:', isOwnMessage);
            }
          });
        }
      
      // 不再加载从信息页传递过来的消息
      
      // 按时间排序
      chatMessages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
      
      setMessages(chatMessages);
      
      // 将历史消息ID添加到已处理集合中
      const historyIds = chatMessages.map(msg => msg.id);
      setReceivedMessageIds(new Set(historyIds));
      
    } catch (error) {
      console.error('加载历史消息失败:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // 组件挂载时加载历史消息
  useEffect(() => {
    loadMessageHistory();
  }, [contactId]);
  
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [receivedMessageIds, setReceivedMessageIds] = useState<Set<string>>(new Set());
  const flatListRef = useRef<FlatList>(null);
  const { sendMessageMutate } = sendMessageAuth();

  // WebSocket消息类型定义
  type WebSocketMessage = {
    type: string;
    content: string;
    data?: {
      userId: number;
      username: string;
      content: string;
      avatar?: string;
      messageId?: string;
      sender?: string;
    };
    timestamp: number;
  };

  // WebSocket消息监听器
  useEffect(() => {
    const handleWebSocketMessage = (event: MessageEvent) => {
      try {
        const wsMessage: WebSocketMessage = JSON.parse(event.data);
        
        // 只处理与当前联系人相关的消息
        if ((wsMessage.type === 'chat' || wsMessage.type === 'message') && wsMessage.data?.userId === contactId) {
          handleIncomingMessage(wsMessage);
        }
      } catch (error) {
        console.error('解析WebSocket消息失败:', error);
      }
    };

    // 获取WebSocket实例并添加监听器
    const wsManager = require('../api/hooks/useAuth').wsManager;
    if (wsManager && wsManager.ws) {
      wsManager.ws.addEventListener('message', handleWebSocketMessage);
      
      return () => {
        wsManager.ws?.removeEventListener('message', handleWebSocketMessage);
      };
    }
  }, [contactId]);

  // 处理接收到的消息
  const handleIncomingMessage = (wsMessage: WebSocketMessage) => {
    // 生成消息ID，用于去重
    const messageId = wsMessage.data?.messageId || `${wsMessage.data?.userId}_${wsMessage.timestamp}_${Math.random().toString(36).substr(2, 9)}`;
    
    // 检查消息是否已经处理过（基于具体的消息ID，而不是用户ID）
    if (receivedMessageIds.has(messageId)) {
      console.log('消息已存在，跳过处理:', messageId);
      return;
    }
    
    // 存储消息到本地
    storeMessage(wsMessage);
    
    // 添加到已处理消息集合（只添加当前消息ID）
    setReceivedMessageIds(prev => new Set([...prev, messageId]));

    let message = ""
    if(wsMessage.content == "新消息"){
      message = wsMessage.data?.content || ""
    }else
      message = wsMessage.content || ""
    
    // 构造新消息
    const newMessage: Message = {
      id: messageId,
      text: message || '',
      timestamp: new Date(wsMessage.timestamp),
      isOwn: false,
      status: 'read'
    };

    // 直接添加新消息到历史记录中
    console.log('接收到新消息，用户ID:', wsMessage.data?.userId, '消息内容:', message);
    setMessages(prev => {
      // 直接添加新消息，不进行集合处理
      const updatedMessages = [...prev, newMessage];
      console.log('添加新消息到历史记录，当前消息总数:', updatedMessages.length);
      return updatedMessages;
    });
    
    // 滚动到底部
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };


  // 发送消息
  const sendMessage = async () => {
    if (inputText.trim()) {
      const messageId = `send_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const messageText = inputText.trim();
      console.log("发送消息 inputText contactId" + messageText + contactId)

      // 构造发送给API的消息请求
      const messageRequest: MessageRequest = {
        userId: contactId.toString(),
        type: 'message',
        content: messageText,
        data: []
      };

      // 构造WebSocket格式的消息用于存储
      const wsMessageForStorage = {
        type: 'message',
        content: messageText,
        data: {
          userId: contactId,
          username: 'me', // 标识为自己发送的消息
          content: messageText,
          messageId: messageId,
          targetUserId: contactId, // 添加目标用户ID
          targetUserName: contactName, // 添加目标用户名称
          isOwnMessage: true // 添加自己发送的消息标记
        },
        timestamp: Date.now()
      };
      
      // 存储发送的消息
      storeMessage(wsMessageForStorage);

      // 构造本地显示的消息
      const newMessage: Message = {
        id: messageId,
        text: messageText,
        timestamp: new Date(),
        isOwn: true,
        status: 'sending'
      };

      // 添加到已处理消息集合，避免重复
      setReceivedMessageIds(prev => new Set([...prev, messageId]));
      
      // 立即添加到消息列表
      setMessages(prev => [...prev, newMessage]);
      setInputText('');
      
      // 滚动到底部
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);

      try {
        await sendMessageMutate(messageRequest);
        
        // 发送成功，更新状态
        setMessages(prev => 
          prev.map(msg => 
            msg.id === messageId 
              ? { ...msg, status: 'sent' }
              : msg
          )
        );
        
        // 模拟消息送达状态
        setTimeout(() => {
          setMessages(prev => 
            prev.map(msg => 
              msg.id === messageId 
                ? { ...msg, status: 'delivered' }
                : msg
            )
          );
        }, 1500);
        
      } catch (error) {
        console.error('发送消息失败:', error);
        // 发送失败，可以添加重试按钮或错误状态
        setMessages(prev => 
          prev.map(msg => 
            msg.id === messageId 
              ? { ...msg, status: 'sending' } // 保持发送中状态，表示失败
              : msg
          )
        );
      }
    }
  };

  // 格式化时间
  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) { // 1分钟内
      return '刚刚';
    } else if (diff < 3600000) { // 1小时内
      return `${Math.floor(diff / 60000)}分钟前`;
    } else if (diff < 86400000) { // 24小时内
      return `${Math.floor(diff / 3600000)}小时前`;
    } else {
      return date.toLocaleDateString();
    }
  };

  // 渲染消息项
  const renderMessage = ({ item }: { item: Message }) => (
    <View style={[
      styles.messageContainer,
      item.isOwn ? styles.ownMessage : styles.otherMessage
    ]}>
      {!item.isOwn && (
        <Image source={{ uri: contactAvatar }} style={styles.messageAvatar} />
      )}
      
      <View style={[
        styles.messageBubble,
        item.isOwn ? styles.ownBubble : styles.otherBubble
      ]}>
        <Text style={[
          styles.messageText,
          item.isOwn ? styles.ownText : styles.otherText
        ]}>
          {item.text || ''}
        </Text>
        
        <View style={styles.messageFooter}>
          <Text style={[
            styles.messageTime,
            item.isOwn ? styles.ownTime : styles.otherTime
          ]}>
            {formatTime(item.timestamp) || ''}
          </Text>
          
          {item.isOwn && (
            <View style={styles.messageStatus}>
              {item.status === 'sending' && (
                <Ionicons name="time" size={12} color="#999" />
              )}
              {item.status === 'sent' && (
                <Ionicons name="checkmark" size={12} color="#999" />
              )}
              {item.status === 'delivered' && (
                <Ionicons name="checkmark-done" size={12} color="#999" />
              )}
              {item.status === 'read' && (
                <Ionicons name="checkmark-done" size={12} color="#4285F4" />
              )}
            </View>
          )}
        </View>
      </View>
    </View>
  );

  // 更多操作
  const showMoreOptions = () => {
    Alert.alert(
      '更多操作',
      '',
      [
        { text: '语音通话', onPress: () => console.log('语音通话') },
        { text: '视频通话', onPress: () => console.log('视频通话') },
        { text: '查看资料', onPress: () => console.log('查看资料') },
        { text: '取消', style: 'cancel' }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* 顶部导航栏 */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        
        <View style={styles.headerInfo}>
          <Image source={{ uri: apiConfig.baseURL + contactAvatar }} style={styles.headerAvatar} />
          <View style={styles.headerText}>
            <Text style={styles.headerName}>{contactName || '未知联系人'}</Text>
            <Text style={styles.headerStatus}>
              {isTyping ? '正在输入...' : '在线'}
            </Text>
          </View>
        </View>
        
        <TouchableOpacity 
          style={styles.moreButton}
          onPress={showMoreOptions}
        >
          <Ionicons name="ellipsis-vertical" size={24} color="#333" />
        </TouchableOpacity>
      </View>
      
      {/* 消息列表 */}
      {isLoadingHistory ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>加载历史消息...</Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          onLayout={() => {
            // 初次加载完成后滚动到底部
            setTimeout(() => {
              flatListRef.current?.scrollToEnd({ animated: false });
            }, 100);
          }}
        />
      )}
      
      {/* 输入区域 */}
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.inputContainer}
      >
        <View style={styles.inputRow}>
          <TouchableOpacity style={styles.attachButton}>
            <Ionicons name="add" size={24} color="#4285F4" />
          </TouchableOpacity>
          
          <TextInput
            style={styles.textInput}
            placeholder="输入消息..."
            placeholderTextColor="#999"
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
            onFocus={() => {
              setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
              }, 300);
            }}
          />
          
          {inputText.trim() ? (
            <TouchableOpacity 
              style={styles.sendButton}
              onPress={sendMessage}
            >
              <Ionicons name="send" size={20} color="#fff" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.voiceButton}>
              <Ionicons name="mic" size={24} color="#4285F4" />
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 4,
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  headerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  headerStatus: {
    fontSize: 12,
    color: '#4285F4',
    marginTop: 2,
  },
  moreButton: {
    padding: 4,
    marginLeft: 12,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    paddingVertical: 16,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  ownMessage: {
    justifyContent: 'flex-end',
  },
  otherMessage: {
    justifyContent: 'flex-start',
  },
  messageAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
    alignSelf: 'flex-end',
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 18,
  },
  ownBubble: {
    backgroundColor: '#4285F4',
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  ownText: {
    color: '#fff',
  },
  otherText: {
    color: '#333',
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  messageTime: {
    fontSize: 11,
    marginRight: 4,
  },
  ownTime: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  otherTime: {
    color: '#999',
  },
  messageStatus: {
    marginLeft: 4,
  },
  inputContainer: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  attachButton: {
    padding: 8,
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    maxHeight: 100,
    backgroundColor: '#f8f9fa',
  },
  sendButton: {
    backgroundColor: '#4285F4',
    borderRadius: 20,
    padding: 10,
    marginLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  voiceButton: {
    padding: 10,
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
  },
});

export default ChatScreen;