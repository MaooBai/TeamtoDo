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

// 模拟消息数据
const initialMessages = [
  {
    id: '1',
    sender: '张三',
    avatar: 'https://randomuser.me/api/portraits/men/1.jpg',
    content: '你好，项目进展如何了？',
    time: '10:30',
    unread: true,
    pinned: true,
    type: 'private'
  },
  {
    id: '2',
    sender: '李四',
    avatar: 'https://randomuser.me/api/portraits/women/2.jpg',
    content: '会议纪要已上传，请查收',
    time: '昨天',
    unread: false,
    pinned: false,
    type: 'private'
  },
  {
    id: '3',
    sender: '王五',
    avatar: 'https://randomuser.me/api/portraits/men/3.jpg',
    content: '设计稿需要你的反馈',
    time: '昨天',
    unread: true,
    pinned: true,
    type: 'group'
  },
  {
    id: '4',
    sender: '技术部',
    avatar: 'https://randomuser.me/api/portraits/lego/4.jpg',
    content: '系统将于今晚进行升级维护',
    time: '周一',
    unread: false,
    pinned: false,
    type: 'group'
  },
  // 更多消息...
];

import { NavigationProp } from '@react-navigation/native';

// 假设这里使用的是 StackNavigation
import { StackNavigationProp } from '@react-navigation/stack';

// 定义导航参数类型
type RootStackParamList = {
  Chat: { contact: any };
  NewChat: undefined;
};

// 定义导航类型
type MessagesScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Chat'>;

export const EnhancedMessagesScreen = ({ navigation }: { navigation: NavigationProp<MessagesScreenNavigationProp> }) => {
  const [messages, setMessages] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // 初始化加载数据
  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = () => {
    setIsLoading(true);
    // 模拟API请求延迟
    setTimeout(() => {
      setMessages(initialMessages as never);
      setIsLoading(false);
      setRefreshing(false);
    }, 1000);
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadMessages();
  }, []);

  // 处理视频通话按钮点击
  const handleVideoCall = () => {
    Alert.alert('视频通话', '即将发起视频通话');
    // 实际项目中这里会调用视频通话SDK
  };

  // 处理搜索
  const handleSearch = (text: string) => {
    setSearchQuery(text);
    if (text === '') {
      setMessages(initialMessages as never);
    } else {
      const filtered = initialMessages.filter(msg => 
        msg.sender.toLowerCase().includes(text.toLowerCase()) || 
        msg.content.toLowerCase().includes(text.toLowerCase())
      );
      setMessages(filtered as never);
    }
  };

  // 切换消息分类
  const handleTabChange = (tab: React.SetStateAction<string>) => {
    setActiveTab(tab);
    let filteredMessages = initialMessages;
    
    if (tab === 'unread') {
      filteredMessages = initialMessages.filter(msg => msg.unread);
    } else if (tab === 'pinned') {
      filteredMessages = initialMessages.filter(msg => msg.pinned);
    } else if (tab === 'groups') {
      filteredMessages = initialMessages.filter(msg => msg.type === 'group');
    }
    
    setMessages(filteredMessages as never);
  };

  // 打开消息操作菜单
  const openMessageMenu = (message: React.SetStateAction<null>) => {
    setSelectedMessage(message);
    setIsMenuVisible(true);
  };

  // 处理消息操作
  const handleMessageAction = (action: string) => {
    setIsMenuVisible(false);
    
    // if (action === 'pin') {
    //   const updated = messages.map(msg => 
    //     msg.id === selectedMessage.id ? {...msg, pinned: !msg.pinned} : msg
    //   );
    //   setMessages(updated);
    // } else if (action === 'delete') {
    //   Alert.alert(
    //     '删除对话',
    //     `确定要删除与${selectedMessage.sender}的对话吗？`,
    //     [
    //       { text: '取消', style: 'cancel' },
    //       { 
    //         text: '删除', 
    //         style: 'destructive',
    //         onPress: () => {
    //           const updated = messages.filter(msg => msg.id !== selectedMessage.id);
    //           setMessages(updated);
    //         }
    //       }
    //     ]
    //   );
    // } else if (action === 'markAsRead') {
    //   const updated = messages.map(msg => 
    //     msg.id === selectedMessage.id ? {...msg, unread: false} : msg
    //   );
    //   setMessages(updated);
    // }
  };

  // 渲染单个消息项
// 定义消息项的类型
type MessageItem = {
  id: string;
  sender: string;
  avatar: string;
  content: string;
  time: string;
  unread: boolean;
  pinned: boolean;
  type: 'private' | 'group';
};

// 修改函数参数类型
const renderMessageItem = ({ item }: { item: MessageItem }) => (
    <TouchableOpacity 
      style={[
        styles.messageItem,
        item.pinned && styles.pinnedMessage,
        item.unread && styles.unreadMessageItem
      ]}
    //   onPress={() => navigation.navigate('Chat', { contact: item })}
    //   onLongPress={() => openMessageMenu(item)}
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
          <Text style={styles.senderName}>{item.sender}</Text>
          <Text style={styles.messageTime}>{item.time}</Text>
        </View>
        <Text 
          style={styles.messageText}
          numberOfLines={1}
        >
          {item.content}
        </Text>
      </View>
      {item.unread && <View style={styles.unreadBadge} />}
      {item.type === 'group' && (
        <MaterialIcons name="group" size={16} color="#666" style={styles.groupIcon} />
      )}
    </TouchableOpacity>
  );

  // 分组数据：置顶消息和普通消息
  const groupedMessages = [
    {
      title: '置顶聊天',
    //   data: messages.filter(msg => msg.pinned)
    },
    {
      title: '所有聊天',
    //   data: messages.filter(msg => !msg.pinned)
    }
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* 顶部标题栏 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>消息</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.headerButton}
            // onPress={() => navigation.navigate('NewChat')}
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
          <View style={styles.unreadCount}>
            <Text style={styles.unreadCountText}></Text>
          </View>
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
                      //   sections={groupedMessages}
                      renderItem={renderMessageItem}
                      //   renderSectionHeader={({ section }) => (
                      //     section.data.length > 0 && (
                      //       <Text style={styles.sectionHeader}>{section.title}</Text>
                      //     )
                      //   )}
                      keyExtractor={(item) => item.id}
                      contentContainerStyle={styles.listContainer}
                      refreshControl={<RefreshControl
                          refreshing={refreshing}
                          onRefresh={onRefresh}
                          colors={['#4285F4']}
                          tintColor="#4285F4" />}
                      ListEmptyComponent={<View style={styles.emptyContainer}>
                          <Ionicons name="chatbubbles-outline" size={60} color="#ddd" />
                          <Text style={styles.emptyText}>暂无消息</Text>
                      </View>}
                      stickySectionHeadersEnabled={false} sections={[]}        />
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
              {/* <Ionicons 
                name={selectedMessage?.pinned ? "pin-outline" : "pin"} 
                size={20} 
                color="#333" 
                style={styles.menuIcon} 
              />
              <Text style={styles.menuText}>
                {selectedMessage?.pinned ? "取消置顶" : "置顶聊天"}
              </Text> */}
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
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
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