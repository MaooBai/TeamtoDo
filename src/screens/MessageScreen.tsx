import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  SafeAreaView,
  StatusBar,
  TextInput,
  RefreshControl,
  Modal,
  Alert,
  SectionList,
  ActivityIndicator
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { wsManager } from '../api/hooks/useAuth';
import { storeMessage, getAllMessages } from '../api/utils/storage';


// 假设这里使用的是 StackNavigation
import { StackNavigationProp } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiConfig } from '../api/config/config';

// 定义消息项的类型
type MessageItem = {
  id: string;
  sender: string;
  avatar: string;
  content: string;
  time: Date;
  unread: boolean;
  pinned: boolean;
  type: 'private' | 'group';
};

// 定义接收的WebSocket消息格式
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
    groupName?: string;
    groupAvatar?: string;
  };
  timestamp: number;
};

// 定义分组数据的类型
type SectionData = {
  title: string;
  data: MessageItem[];
};

// 定义导航参数类型
type RootStackParamList = {
  Chat: { 
    contactId: number;
    contactName: string;
    contactAvatar: string;
    lastMessage?: string;
    time?: Date;
  };
  NewChat: undefined;
  VideoCall: {
    contactName: string;
    contactId: number;
    isIncoming?: boolean;
  };
};

// 定义导航类型
type MessagesScreenNavigationProp = StackNavigationProp<RootStackParamList>;

export const EnhancedMessagesScreen = ({ navigation }: { navigation: MessagesScreenNavigationProp }) => {
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [allMessages, setAllMessages] = useState<MessageItem[]>([]); // 保存所有消息的完整列表
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<MessageItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [wsConnectionStatus, setWsConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('disconnected');
  const [receivedMessageIds, setReceivedMessageIds] = useState<Set<string>>(new Set());

  // 初始化加载数据
  useEffect(() => {
    getWebsocket();
    loadMessages();
    setupWebSocketListener();

    // 清理函数
    return () => {
      removeWebSocketListener();
    };
  }, []);

  const getWebsocket = async () => {
    wsManager.connect(await AsyncStorage.getItem("auth_token") as string);
  }


  // 处理接收到的WebSocket消息
  const handleWebSocketMessage = useCallback((event: WebSocketMessageEvent) => {
    try {
      const message: WebSocketMessage = JSON.parse(event.data);
      console.log('收到WebSocket消息:', message);
      storeMessage(message); // 存储消息
      
      // 根据消息类型处理不同的消息
      switch (message.type) {
        case 'chat':
        case 'message':
        case 'private_message':
          handleNewChatMessage(message);
          break;
        case 'group_message':
          handleNewGroupMessage(message);
          break;
        case 'system':
          handleSystemMessage(message);
          break;
        default:
          console.log('未知消息类型:', message.type);
      }
    } catch (error) {
      console.error('解析WebSocket消息失败:', error);
    }
  }, [receivedMessageIds]);



  // 将WebSocket消息转换为MessageItem格式
  const transformWebSocketMessageToMessageItem = (wsMessage: WebSocketMessage): MessageItem | null => {
    // 只处理带有data和userId的消息
    if (!wsMessage.data || !wsMessage.data.userId) return null;

    // 如果是自己发送的消息（带有isOwnMessage标记），则不在消息页面显示
    if ((wsMessage.data as any).isOwnMessage === true) {
      return null;
    }

    // 处理消息内容
    let content = wsMessage.data.content;
    if (wsMessage.content === "新消息" && wsMessage.data.content) {
      content = wsMessage.data.content;
    } else if (wsMessage.content && wsMessage.content !== "新消息") {
      content = wsMessage.content;
    }

    // 判断是否为自己发送的消息
    const isOwnMessage = wsMessage.data.username === 'me';
    
    // 生成唯一ID
    const messageId = wsMessage.data.messageId || `${wsMessage.data.userId}_${wsMessage.timestamp}_${Math.random().toString(36).substr(2, 9)}`;

    // 确定显示的发送者名称
    let displaySender: string;
    if (isOwnMessage) {
      // 对于自己发送的消息，使用目标用户名称
      displaySender = (wsMessage.data as any).targetUserName || (wsMessage.data as any).targetUserId?.toString() || `用户${wsMessage.data.userId}`;
    } else {
      displaySender = wsMessage.data.sender || wsMessage.data.username || '未知发件人';
    }

    return {
      id: isOwnMessage ? `me_${wsMessage.data.userId}` : (wsMessage.data.userId?.toString() || messageId),
      sender: displaySender,
      avatar: wsMessage.data.avatar || (isOwnMessage ? 'https://randomuser.me/api/portraits/men/0.jpg' : 'https://randomuser.me/api/portraits/lego/1.jpg'),
      content: content || '',
      time: new Date(wsMessage.timestamp),
      unread: !isOwnMessage, // 自己发送的消息标记为已读
      pinned: false,
      type: wsMessage.type === 'group_message' ? 'group' : 'private',
    };
  };

  // 设置WebSocket消息监听器
  const setupWebSocketListener = useCallback(() => {
    const ws = wsManager.getConnection();
    if (ws) {
      ws.onmessage = handleWebSocketMessage;
      
      // 监听连接状态变化
      ws.onopen = () => {
        console.log('WebSocket连接已建立');
        setWsConnectionStatus('connected');
      };
      
      ws.onclose = () => {
        console.log('WebSocket连接已关闭');
        setWsConnectionStatus('disconnected');
      };
      
      ws.onerror = (error) => {
        console.error('WebSocket连接错误:', error);
        setWsConnectionStatus('disconnected');
      };
      
      // 设置当前连接状态
      if (ws.readyState === WebSocket.OPEN) {
        setWsConnectionStatus('connected');
      } else if (ws.readyState === WebSocket.CONNECTING) {
        setWsConnectionStatus('connecting');
      } else {
        setWsConnectionStatus('disconnected');
      }
    } else {
      setWsConnectionStatus('disconnected');
    }
  }, [handleWebSocketMessage]);

  // 移除WebSocket消息监听器
  const removeWebSocketListener = useCallback(() => {
    const ws = wsManager.getConnection();
    if (ws) {
      ws.onmessage = null;
    }
  }, []);

  // 统一的消息更新函数
  const updateMessagesWithFilter = useCallback((updateFunction: (prevMessages: MessageItem[]) => MessageItem[]) => {
    setAllMessages(prevAllMessages => {
      const updatedAllMessages = updateFunction(prevAllMessages);
      
      // 根据当前活动标签过滤消息
      let filteredMessages = updatedAllMessages;
      if (activeTab === 'unread') {
        filteredMessages = updatedAllMessages.filter(msg => msg.unread);
      } else if (activeTab === 'pinned') {
        filteredMessages = updatedAllMessages.filter(msg => msg.pinned);
      } else if (activeTab === 'groups') {
        filteredMessages = updatedAllMessages.filter(msg => msg.type === 'group');
      }
      
      setMessages(filteredMessages);
      return updatedAllMessages;
    });
  }, [activeTab]);

  // 处理新的聊天消息
  const handleNewChatMessage = (wsMessage: WebSocketMessage) => {
    // 只处理带有data和userId的消息
    if (!wsMessage.data || !wsMessage.data.userId) {
      console.log('消息缺少必要的data或userId，跳过处理');
      return;
    }

    // 如果是自己发送的消息（带有isOwnMessage标记），则不在消息页面显示
    if ((wsMessage.data as any).isOwnMessage === true) {
      console.log('自己发送的消息，不在消息页面显示');
      return;
    }

    // 生成消息ID，用于去重
    const messageId = wsMessage.data?.messageId || `${wsMessage.data?.userId}_${wsMessage.timestamp}_${Math.random().toString(36).substr(2, 9)}`;
    
    // 检查消息是否已经处理过
    if (receivedMessageIds.has(messageId)) {
      console.log('消息已存在，跳过处理:', messageId);
      return;
    }
    
    // 添加到已处理消息集合
    setReceivedMessageIds(prev => new Set([...prev, messageId]));

    // 处理消息内容
    let message = ""
    if(wsMessage.content == "新消息"){
      message = wsMessage.data?.content || ""
    } else {
      message = wsMessage.content || ""
    }

    // 判断是否为自己发送的消息
    const isOwnMessage = wsMessage.data?.username === 'me';

    const newMessage: MessageItem = {
      id: isOwnMessage ? `me_${wsMessage.data?.userId}` : (wsMessage.data?.userId?.toString() || messageId),
      sender: isOwnMessage ? (wsMessage.data?.username || wsMessage.data?.sender || `用户${wsMessage.data?.userId}`) : (wsMessage.data?.username || wsMessage.data?.sender || '未知用户'),
      avatar: wsMessage.data?.avatar || (isOwnMessage ? 'https://randomuser.me/api/portraits/men/0.jpg' : 'https://randomuser.me/api/portraits/men/1.jpg'),
      content: message,
      time: new Date(wsMessage.timestamp),
      unread: !isOwnMessage, // 自己发送的消息标记为已读
      pinned: false,
      type: 'private'
    };
    
    // 更新消息列表，将新消息添加到顶部
    const updateMessagesList = (prevMessages: MessageItem[]) => {
      // 使用用户ID和发送者来查找现有对话，确保同一用户的消息整合到一个对话中
      const existingIndex = prevMessages.findIndex(msg => {
        if (isOwnMessage) {
          // 自己发送的消息：查找与目标用户的对话
          return msg.id === `me_${wsMessage.data?.userId}` || 
                 (msg.type === 'private' && msg.sender === newMessage.sender);
        } else {
          // 他人发送的消息：查找发送者的对话
          return msg.id === newMessage.id || 
                 (msg.type === 'private' && msg.sender === newMessage.sender);
        }
      });
      
      if (existingIndex >= 0) {
        // 更新现有对话
        const updatedMessages = [...prevMessages];
        updatedMessages[existingIndex] = {
          ...updatedMessages[existingIndex],
          content: newMessage.content,
          time: newMessage.time,
          unread: newMessage.unread
        };
        // 将更新的对话移到顶部
        const [updatedMessage] = updatedMessages.splice(existingIndex, 1);
        return [updatedMessage, ...updatedMessages];
      } else {
        // 添加新对话
        return [newMessage, ...prevMessages];
      }
    };
    
    // 使用统一的更新函数，确保立即刷新当前视图
    updateMessagesWithFilter(updateMessagesList);
  };

  // 处理群组消息
  const handleNewGroupMessage = (wsMessage: WebSocketMessage) => {
    // 只处理带有data和userId的消息
    if (!wsMessage.data || !wsMessage.data.userId) {
      console.log('群组消息缺少必要的data或userId，跳过处理');
      return;
    }

    // 生成消息ID，用于去重
    const messageId = wsMessage.data?.messageId || `group_${wsMessage.data?.username}_${wsMessage.timestamp}`;
    
    // 检查消息是否已经处理过
    if (receivedMessageIds.has(messageId)) {
      console.log('群组消息已存在，跳过处理:', messageId);
      return;
    }
    
    // 添加到已处理消息集合
    setReceivedMessageIds(prev => new Set([...prev, messageId]));
    
    const newMessage: MessageItem = {
      id: `group_${wsMessage.data?.username}` || messageId,
      sender: wsMessage.data?.username || '群组成员',
      avatar: wsMessage.data?.avatar || 'https://randomuser.me/api/portraits/lego/4.jpg',
      content: wsMessage.content || '',
      time: new Date(wsMessage.timestamp),
      unread: true,
      pinned: false,
      type: 'group'
    };
    
    const updateGroupMessagesList = (prevMessages: MessageItem[]) => {
      const existingIndex = prevMessages.findIndex(msg => 
        msg.type === 'group' && msg.sender === newMessage.sender
      );
      
      if (existingIndex >= 0) {
        const updatedMessages = [...prevMessages];
        updatedMessages[existingIndex] = {
          ...updatedMessages[existingIndex],
          content: newMessage.content,
          time: newMessage.time,
          unread: true
        };
        const [updatedMessage] = updatedMessages.splice(existingIndex, 1);
        return [updatedMessage, ...updatedMessages];
      } else {
        return [newMessage, ...prevMessages];
      }
    };
    
    // 使用统一的更新函数，确保立即刷新当前视图
    updateMessagesWithFilter(updateGroupMessagesList);
  };

  // 处理系统消息
  const handleSystemMessage = (wsMessage: WebSocketMessage) => {
    Alert.alert('系统通知', wsMessage.content);
  };

  // 格式化时间戳
  const formatTimestamp = (timestamp: number): string => {
    const now = new Date();
    const messageTime = new Date(timestamp);
    const diffInHours = (now.getTime() - messageTime.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return messageTime.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 24) {
      return messageTime.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 48) {
      return '昨天';
    } else {
      return messageTime.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
    }
  };

  const loadMessages = async () => {
    setIsLoading(true);
    const storedMessages = await getAllMessages();
    let combinedMessages: MessageItem[] = [];

    if (storedMessages.length > 0) {
      // 过滤掉自己发送的消息和没有userId的消息，然后转换格式
      const filteredMessages = storedMessages.filter((wsMessage: any) => {
        // 只保留带有data和userId的消息
        if (!wsMessage.data || !wsMessage.data.userId) return false;
        // 过滤掉自己发送的消息
        if (wsMessage.data.isOwnMessage === true) return false;
        return true;
      });
      
      const formattedMessages = filteredMessages.map(transformWebSocketMessageToMessageItem).filter(Boolean) as MessageItem[];
      combinedMessages = [...formattedMessages];
    }

    // 合并并去重 - 基于用户ID和对话类型进行去重
    const conversationMap = new Map<string, MessageItem>();
    
     
     // 处理存储的消息
     combinedMessages.forEach(msg => {
       let key: string;
        if (msg.type === 'group') {
          key = `group_${msg.sender}_${(msg as any).groupName || 'default'}`;
        } else {
          // 对于私聊消息，区分自己发送和他人发送
          if (msg.id.startsWith('me_')) {
            // 自己发送的消息：使用目标用户ID作为key
            const targetUserId = msg.id.replace('me_', '').split('_')[0];
            key = `private_${targetUserId}`;
          } else {
            // 他人发送的消息：使用发送者作为key
            key = `private_${msg.sender}`;
          }
        }
       
       if (!conversationMap.has(key) || conversationMap.get(key)!.time < msg.time) {
         conversationMap.set(key, msg);
       }
     });

    const finalMessages = Array.from(conversationMap.values())
      .sort((a, b) => b.time.getTime() - a.time.getTime()); // 按时间倒序排列

    // 模拟API请求延迟
    setTimeout(() => {
      setAllMessages(finalMessages); // 保存完整的消息列表
      setMessages(finalMessages);
      setIsLoading(false);
      setRefreshing(false);
    }, 500);
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadMessages();
    // 重新设置WebSocket监听器
    setupWebSocketListener();
  }, []);

  // 监听WebSocket连接状态变化
  useEffect(() => {
    const checkWebSocketConnection = () => {
      const ws = wsManager.getConnection();
      if (ws && ws.readyState === WebSocket.OPEN) {
        setupWebSocketListener();
      }
    };

    // 定期检查WebSocket连接状态
    const interval = setInterval(checkWebSocketConnection, 5000);
    
    return () => {
      clearInterval(interval);
    };
  }, []);

  // 处理视频通话按钮点击
  const handleVideoCall = () => {
    // 导航到会议创建/加入界面
    navigation.navigate('CreateMeeting' as never);
  };

  // 处理搜索
  const handleSearch = (text: string) => {
    setSearchQuery(text);
    if (text === '') {
      // 如果搜索为空，根据当前活动标签显示相应的消息
      handleTabChange(activeTab);
    } else {
      const filtered = allMessages.filter(msg => 
        msg.sender.toLowerCase().includes(text.toLowerCase()) || 
        msg.content.toLowerCase().includes(text.toLowerCase())
      );
      setMessages(filtered as never);
    }
  };

  // 切换消息分类
  const handleTabChange = (tab: React.SetStateAction<string>) => {
    setActiveTab(tab);
    let filteredMessages = allMessages; // 使用完整的消息列表而不是initialMessages
    
    if (tab === 'unread') {
      filteredMessages = allMessages.filter(msg => msg.unread);
    } else if (tab === 'pinned') {
      filteredMessages = allMessages.filter(msg => msg.pinned);
    } else if (tab === 'groups') {
      filteredMessages = allMessages.filter(msg => msg.type === 'group');
    }
    
    setMessages(filteredMessages as never);
  };

  // 打开消息操作菜单
  const openMessageMenu = (message: MessageItem) => {
    setSelectedMessage(message);
    setIsMenuVisible(true);
  };

  // 处理消息操作
  const handleMessageAction = (action: string) => {
    setIsMenuVisible(false);
    
    if (action === 'pin' && selectedMessage) {
      const updatePinStatus = (msgs: MessageItem[]) => msgs.map(msg => 
        msg.id === selectedMessage.id ? {...msg, pinned: !msg.pinned} : msg
      );
      updateMessagesWithFilter(updatePinStatus);
    } else if (action === 'delete' && selectedMessage) {
      Alert.alert(
        '删除对话',
        `确定要删除与${selectedMessage.sender}的对话吗？`,
        [
          { text: '取消', style: 'cancel' },
          { 
            text: '删除', 
            style: 'destructive',
            onPress: () => {
              const filterDeleted = (msgs: MessageItem[]) => msgs.filter(msg => msg.id !== selectedMessage.id);
              updateMessagesWithFilter(filterDeleted);
            }
          }
        ]
      );
    } else if (action === 'markAsRead' && selectedMessage) {
      const markAsRead = (msgs: MessageItem[]) => msgs.map(msg => 
        msg.id === selectedMessage.id ? {...msg, unread: false} : msg
      );
      updateMessagesWithFilter(markAsRead);
    }
  };

  // 渲染单个消息项
  const renderMessageItem = ({ item }: { item: MessageItem }) => (
    <TouchableOpacity 
      style={[
        styles.messageItem,
        item.pinned && styles.pinnedMessage,
        item.unread && styles.unreadMessageItem
      ]}
      onPress={() => {
        if (item.unread) {
          const markAsRead = (msgs: MessageItem[]) =>
            msgs.map(msg =>
              msg.id === item.id ? { ...msg, unread: false } : msg
            );
          updateMessagesWithFilter(markAsRead);
        }
        // 确定联系人信息
        let contactName = item.sender;
        let contactId = parseInt(item.id) || 1;
        
        if (item.id.startsWith('me_')) {
          // 对于自己发送的消息，从ID中提取目标用户ID
          const targetUserId = item.id.replace('me_', '').split('_')[0];
          contactId = parseInt(targetUserId) || 1;
          contactName = item.sender; // 现在sender已经是正确的目标用户名称
        }
        
        navigation.navigate('Chat', {
          contactId: contactId,
          contactName: contactName,
          contactAvatar: item.avatar,
        });
      }}
      onLongPress={() => openMessageMenu(item)}
    >
      {item.pinned && (
        <Ionicons 
          name="pin" 
          size={14} 
          color="#4285F4" 
          style={styles.pinIcon} 
        />
      )}
      <Image source={{ uri: item.avatar }} style={styles.avatar} />
      <View style={styles.messageContent}>
        <View style={styles.messageHeader}>
          <Text style={styles.senderName}>{item.sender || ''}</Text>
          <Text style={styles.messageTime}>{formatTime(item.time) || ''}</Text>
        </View>
        <Text 
          style={styles.messageText}
          numberOfLines={1}
        >
          {item.content || ''}
        </Text>
      </View>
      {item.unread && <View style={styles.unreadBadge} />}
      {item.type === 'group' && (
        <MaterialIcons name="group" size={16} color="#666" style={styles.groupIcon} />
      )}
    </TouchableOpacity>
  );

  // 分组数据：置顶消息和普通消息
  const groupedMessages: SectionData[] = [
    {
      title: '置顶聊天',
      data: messages.filter(msg => msg.pinned)
    },
    {
      title: '所有聊天',
      data: messages.filter(msg => !msg.pinned)
    }
  ];

    // 格式化时间
  const formatTime = (date: Date | undefined | null) => {
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
      return ''; // 或者返回一个默认值，例如 '未知时间'
    }
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


  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* 顶部标题栏 */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>消息</Text>
          {/* WebSocket连接状态指示器 */}
          <View style={[styles.connectionStatus, 
             wsConnectionStatus === 'connected' && styles.connected,
             wsConnectionStatus === 'connecting' && styles.connecting,
             wsConnectionStatus === 'disconnected' && styles.disconnected
           ]}>
             <View style={[
               styles.statusDot,
               wsConnectionStatus === 'connected' && styles.connectedDot,
               wsConnectionStatus === 'connecting' && styles.connectingDot,
               wsConnectionStatus === 'disconnected' && styles.disconnectedDot
             ]} />
            <Text style={styles.statusText}>
              {wsConnectionStatus === 'connected' ? '在线' : 
               wsConnectionStatus === 'connecting' ? '连接中' : '离线'}
            </Text>
          </View>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => navigation.navigate('NewChat')}
          >
            <Ionicons name="add" size={24} color="#4285F4" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={handleVideoCall}
          >
            <Ionicons name="videocam" size={24} color="#4285F4" />
          </TouchableOpacity>
        </View>
      </View>
      
      {/* 搜索框 */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="搜索消息..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={handleSearch}
        />
      </View>
      
      {/* 消息分类标签 */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'all' && styles.activeTab]}
          onPress={() => handleTabChange('all')}
        >
          <Text style={[styles.tabText, activeTab === 'all' && styles.activeTabText]}>全部</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'unread' && styles.activeTab]}
          onPress={() => handleTabChange('unread')}
        >
          <Text style={[styles.tabText, activeTab === 'unread' && styles.activeTabText]}>未读</Text>
          {messages.filter(msg => msg.unread).length > 0 && (
            <View style={styles.unreadCount}>
              <Text style={styles.unreadCountText}>{messages.filter(msg => msg.unread).length || 0}</Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'pinned' && styles.activeTab]}
          onPress={() => handleTabChange('pinned')}
        >
          <Text style={[styles.tabText, activeTab === 'pinned' && styles.activeTabText]}>置顶</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'groups' && styles.activeTab]}
          onPress={() => handleTabChange('groups')}
        >
          <Text style={[styles.tabText, activeTab === 'groups' && styles.activeTabText]}>群组</Text>
        </TouchableOpacity>
      </View>
      
      {/* 消息列表 */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4285F4" />
        </View>
      ) : (
        <SectionList
          sections={groupedMessages}
          renderItem={renderMessageItem}
          renderSectionHeader={({ section }) => {
            if (section.data.length > 0) {
              return <Text style={styles.sectionHeader}>{section.title || ''}</Text>;
            }
            return null;
          }}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#4285F4']}
              tintColor="#4285F4"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbubbles-outline" size={60} color="#ddd" />
              <Text style={styles.emptyText}>暂无消息</Text>
            </View>
          }
          stickySectionHeadersEnabled={false}
        />
      )}
      
      {/* 消息操作菜单 */}
      <Modal
        visible={isMenuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsMenuVisible(false)}
      >
        <TouchableOpacity 
          style={styles.menuOverlay}
          activeOpacity={1}
          onPress={() => setIsMenuVisible(false)}
        >
          <View style={styles.menuContainer}>
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => handleMessageAction('pin')}
            >
              <Ionicons 
                name={selectedMessage?.pinned ? "pin-outline" : "pin"} 
                size={20} 
                color="#333" 
                style={styles.menuIcon} 
              />
              <Text style={styles.menuText}>
                {selectedMessage?.pinned ? "取消置顶" : "置顶聊天"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => handleMessageAction('markAsRead')}
            >
              <Ionicons 
                name="mail-open-outline" 
                size={20} 
                color="#333" 
                style={styles.menuIcon} 
              />
              <Text style={styles.menuText}>标记为已读</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => handleMessageAction('delete')}
            >
              <Ionicons 
                name="trash-outline" 
                size={20} 
                color="#ff4444" 
                style={styles.menuIcon} 
              />
              <Text style={[styles.menuText, { color: '#ff4444' }]}>删除对话</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 12,
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
  },
  connected: {
    backgroundColor: '#e8f5e8',
  },
  connecting: {
    backgroundColor: '#fff3cd',
  },
  disconnected: {
    backgroundColor: '#f8d7da',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
    backgroundColor: '#999',
  },
  connectedDot: {
    backgroundColor: '#28a745',
  },
  connectingDot: {
    backgroundColor: '#ffc107',
  },
  disconnectedDot: {
    backgroundColor: '#dc3545',
  },
  statusText: {
    fontSize: 10,
    color: '#666',
    fontWeight: '500',
  },
  headerActions: {
    flexDirection: 'row',
  },
  headerButton: {
    padding: 8,
    marginLeft: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    marginHorizontal: 16,
    marginVertical: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingHorizontal: 8,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 4,
    position: 'relative',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#4285F4',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
  },
  activeTabText: {
    color: '#4285F4',
    fontWeight: 'bold',
  },
  unreadCount: {
    position: 'absolute',
    top: 6,
    right: 4,
    backgroundColor: '#ff4444',
    borderRadius: 9,
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadCountText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  listContainer: {
    paddingBottom: 16,
  },
  messageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
    backgroundColor: '#fff',
  },
  pinnedMessage: {
    backgroundColor: '#f9f9f9',
  },
  unreadMessageItem: {
    backgroundColor: '#f0f7ff',
  },
  pinIcon: {
    position: 'absolute',
    left: 8,
    top: 8,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  messageContent: {
    flex: 1,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  senderName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  messageTime: {
    fontSize: 12,
    color: '#999',
  },
  messageText: {
    fontSize: 14,
    color: '#666',
  },
  unreadBadge: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4285F4',
    marginLeft: 8,
  },
  groupIcon: {
    marginLeft: 8,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f5f5f5',
    color: '#666',
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#999',
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: 200,
    paddingVertical: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  menuIcon: {
    marginRight: 12,
  },
  menuText: {
    fontSize: 16,
    color: '#333',
  },
});

export default EnhancedMessagesScreen;