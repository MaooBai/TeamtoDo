# ChatScreen 优化指南

## 🚀 已实现的优化功能

### 1. WebSocket 实时消息接收
- **功能**: 添加了 WebSocket 消息监听器，能够实时接收来自相同用户ID的消息
- **去重机制**: 使用 `receivedMessageIds` Set 集合避免重复处理相同消息
- **智能过滤**: 只处理与当前联系人相关的消息（`wsMessage.data?.userId === contactId`）

### 2. 消息历史加载
- **异步加载**: 组件挂载时自动加载历史消息
- **加载状态**: 显示加载指示器，提升用户体验
- **数据初始化**: 将历史消息ID添加到去重集合中

### 3. 优化的消息发送逻辑
- **唯一ID生成**: 使用时间戳和随机字符串生成唯一消息ID
- **即时显示**: 消息发送前立即显示在界面上
- **状态管理**: 完整的消息状态流转（sending → sent → delivered）
- **错误处理**: 发送失败时保持适当的状态指示

### 4. 消息排序和显示
- **时间排序**: 消息按时间戳正确排序显示
- **自动滚动**: 新消息到达时自动滚动到底部
- **初始定位**: 历史消息加载完成后自动定位到最新消息

## 💡 进一步优化建议

### 1. 性能优化

#### 消息虚拟化
```typescript
// 对于大量历史消息，使用 VirtualizedList
import { VirtualizedList } from 'react-native';

// 实现消息分页加载
const loadMoreMessages = async () => {
  const olderMessages = await apiService.messages.getMessages({
    conversationId: contactId.toString(),
    before: messages[0]?.timestamp
  });
  setMessages(prev => [...olderMessages, ...prev]);
};
```

#### 消息缓存策略
```typescript
// 使用 React Query 缓存消息数据
import { useInfiniteQuery } from '@tanstack/react-query';

const useMessages = (contactId: number) => {
  return useInfiniteQuery({
    queryKey: ['messages', contactId],
    queryFn: ({ pageParam = 0 }) => 
      apiService.messages.getMessages({ 
        conversationId: contactId.toString(),
        offset: pageParam 
      }),
    getNextPageParam: (lastPage) => lastPage.nextOffset,
    staleTime: 5 * 60 * 1000, // 5分钟缓存
  });
};
```

### 2. 用户体验增强

#### 输入状态指示
```typescript
// 添加"正在输入"功能
const [isTyping, setIsTyping] = useState(false);
const typingTimeoutRef = useRef<NodeJS.Timeout>();

const handleInputChange = (text: string) => {
  setInputText(text);
  
  if (!isTyping) {
    setIsTyping(true);
    // 发送"开始输入"WebSocket消息
    wsManager.send({
      type: 'typing_start',
      data: { userId: contactId }
    });
  }
  
  // 重置输入超时
  if (typingTimeoutRef.current) {
    clearTimeout(typingTimeoutRef.current);
  }
  
  typingTimeoutRef.current = setTimeout(() => {
    setIsTyping(false);
    // 发送"停止输入"WebSocket消息
    wsManager.send({
      type: 'typing_stop',
      data: { userId: contactId }
    });
  }, 2000);
};
```

#### 消息重试机制
```typescript
// 为失败的消息添加重试功能
const retryMessage = async (messageId: string) => {
  const message = messages.find(m => m.id === messageId);
  if (!message) return;
  
  try {
    await sendMessageMutate({
      userId: contactId.toString(),
      type: 'message',
      content: message.text,
      data: []
    });
    
    setMessages(prev => 
      prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, status: 'sent' }
          : msg
      )
    );
  } catch (error) {
    console.error('重试发送失败:', error);
  }
};
```

### 3. 代码质量提升

#### 类型安全
```typescript
// 创建更严格的消息类型定义
interface ChatMessage extends Message {
  senderId: number;
  receiverId: number;
  conversationId: string;
  messageType: 'text' | 'image' | 'file' | 'voice';
  metadata?: {
    fileName?: string;
    fileSize?: number;
    duration?: number; // 语音消息时长
  };
}

// 使用枚举定义消息状态
enum MessageStatus {
  SENDING = 'sending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  FAILED = 'failed'
}
```

#### 自定义 Hooks
```typescript
// 提取 WebSocket 逻辑到自定义 Hook
const useWebSocketMessages = (contactId: number) => {
  const [receivedMessageIds, setReceivedMessageIds] = useState<Set<string>>(new Set());
  
  const handleIncomingMessage = useCallback((wsMessage: WebSocketMessage) => {
    // 消息处理逻辑
  }, [contactId]);
  
  useEffect(() => {
    // WebSocket 监听器设置
  }, [contactId, handleIncomingMessage]);
  
  return { receivedMessageIds, setReceivedMessageIds };
};

// 提取消息管理逻辑
const useMessageManager = (contactId: number) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  
  const loadMessageHistory = useCallback(async () => {
    // 历史消息加载逻辑
  }, [contactId]);
  
  const addMessage = useCallback((message: Message) => {
    setMessages(prev => [...prev, message].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    ));
  }, []);
  
  return { messages, isLoadingHistory, loadMessageHistory, addMessage };
};
```

### 4. 错误处理和监控

#### 错误边界
```typescript
// 添加错误边界组件
class ChatErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }
  
  componentDidCatch(error, errorInfo) {
    console.error('ChatScreen错误:', error, errorInfo);
    // 发送错误报告到监控服务
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <Text>聊天加载失败，请重试</Text>
          <TouchableOpacity onPress={() => this.setState({ hasError: false })}>
            <Text>重新加载</Text>
          </TouchableOpacity>
        </View>
      );
    }
    
    return this.props.children;
  }
}
```

#### 网络状态监控
```typescript
import NetInfo from '@react-native-netinfo';

const useNetworkStatus = () => {
  const [isConnected, setIsConnected] = useState(true);
  
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected ?? false);
    });
    
    return unsubscribe;
  }, []);
  
  return isConnected;
};

// 在 ChatScreen 中使用
const isConnected = useNetworkStatus();

// 显示网络状态提示
{!isConnected && (
  <View style={styles.networkWarning}>
    <Text>网络连接已断开</Text>
  </View>
)}
```

### 5. 测试策略

#### 单元测试
```typescript
// __tests__/ChatScreen.test.tsx
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { ChatScreen } from '../ChatScreen';

describe('ChatScreen', () => {
  it('应该正确显示历史消息', async () => {
    const { getByText } = render(<ChatScreen route={mockRoute} />);
    
    await waitFor(() => {
      expect(getByText('你好！')).toBeTruthy();
    });
  });
  
  it('应该能够发送消息', async () => {
    const { getByPlaceholderText, getByTestId } = render(<ChatScreen route={mockRoute} />);
    
    const input = getByPlaceholderText('输入消息...');
    const sendButton = getByTestId('send-button');
    
    fireEvent.changeText(input, '测试消息');
    fireEvent.press(sendButton);
    
    await waitFor(() => {
      expect(getByText('测试消息')).toBeTruthy();
    });
  });
});
```

## 📊 性能监控指标

1. **消息加载时间**: 历史消息加载完成时间
2. **消息发送延迟**: 从点击发送到状态更新的时间
3. **内存使用**: 长时间聊天后的内存占用
4. **WebSocket 连接稳定性**: 连接断开和重连频率
5. **UI 响应性**: 滚动性能和输入响应时间

## 🔧 维护建议

1. **定期清理**: 实现消息本地存储清理机制
2. **版本兼容**: 确保 WebSocket 消息格式的向后兼容性
3. **日志记录**: 添加详细的调试日志用于问题排查
4. **配置管理**: 将消息相关配置（如重试次数、超时时间）提取到配置文件
5. **文档更新**: 保持 API 文档和代码注释的同步更新

通过这些优化，ChatScreen 将具备更好的性能、用户体验和可维护性。