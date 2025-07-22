import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  TextInput,
  SectionList,
  Image
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Contact, ContactDept } from '../api/types/auth';
import { useContacts, useDepartmentStats } from '../api/hooks/useContacts';
import { RootStackParamList } from '../navigation';
import { apiConfig } from '../api/config/config';

// 导航类型定义
type ContactsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

export const ContactsScreen = ({ }) => {
  const navigation = useNavigation<ContactsScreenNavigationProp>();
  const [searchText, setSearchText] = useState('');
  const [viewMode, setViewMode] = useState<'department' | 'alphabetical'>('department');
  
  // 使用通讯录数据Hook
  const {
    departments,
    allContacts,
    sections,
    isLoading,
    error,
    refetch
  } = useContacts(searchText);
  
  // 获取统计信息
  const stats = useDepartmentStats(departments);

  // 获取数据
  useFocusEffect(
    React.useCallback(() => {
      refetch();
    }, [])
  );

  // 打开聊天界面
  const openChat = (contact: Contact) => {
    navigation.navigate('Chat', {
      contactId: contact.id,
      contactName: contact.name,
      contactAvatar: contact.avatar
    });
  };

  // 渲染联系人项
  const renderContactItem = ({ item }: { item: Contact }) => (
    <TouchableOpacity style={styles.contactItem}>
      <Image source={{ uri: apiConfig.baseURL + item.avatar }} style={styles.avatar} />
      <View style={styles.contactInfo}>
        <Text style={styles.contactName}>{item.name}</Text>
        <Text style={styles.contactPhone}>{item.phone}</Text>
        <Text style={styles.contactDept}>{item.deptName}</Text>
      </View>
      <TouchableOpacity 
        style={styles.contactAction}
        onPress={() => openChat(item)}
      >
        <Ionicons name="chatbubble-ellipses" size={24} color="#4285F4" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  // 渲染部门项
  const renderDepartmentItem = ({ item }: { item: ContactDept }) => (
    <View style={styles.departmentContainer}>
      <View style={styles.departmentHeader}>
        <Ionicons name="business" size={20} color="#4285F4" />
        <Text style={styles.departmentName}>{item.name}</Text>
        <Text style={styles.contactCount}>({item.contacts.length}人)</Text>
      </View>
      {item.contacts.map(contact => (
        <View key={contact.id}>
          {renderContactItem({ item: contact })}
        </View>
      ))}
      {item.children && item.children.map(childDept => (
        <View key={childDept.id} style={styles.childDepartment}>
          {renderDepartmentItem({ item: childDept })}
        </View>
      ))}
    </View>
  );

  // 渲染字母分组标题
  const renderSectionHeader = ({ section }: { section: { title: string } }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeaderText}>{section.title}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* 顶部标题栏 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>通讯录</Text>
        <TouchableOpacity>
          <Ionicons name="person-add" size={24} color="#4285F4" />
        </TouchableOpacity>
      </View>
      
      {/* 搜索框 */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="搜索联系人"
          placeholderTextColor="#999"
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>

      {/* 视图切换按钮 */}
      <View style={styles.viewModeContainer}>
        <TouchableOpacity
          style={[styles.viewModeButton, viewMode === 'department' && styles.activeViewMode]}
          onPress={() => setViewMode('department')}
        >
          <Ionicons name="business" size={16} color={viewMode === 'department' ? '#fff' : '#4285F4'} />
          <Text style={[styles.viewModeText, viewMode === 'department' && styles.activeViewModeText]}>部门</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.viewModeButton, viewMode === 'alphabetical' && styles.activeViewMode]}
          onPress={() => setViewMode('alphabetical')}
        >
          <Ionicons name="list" size={16} color={viewMode === 'alphabetical' ? '#fff' : '#4285F4'} />
          <Text style={[styles.viewModeText, viewMode === 'alphabetical' && styles.activeViewModeText]}>字母</Text>
        </TouchableOpacity>
      </View>

      {/* 统计信息 */}
      {!isLoading && !error && (
        <View style={styles.statsContainer}>
          <Text style={styles.statsText}>
            共 {stats.totalDepartments} 个部门，{stats.totalContacts} 位联系人
          </Text>
        </View>
      )}

      {/* 内容区域 */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>加载中...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color="#ff6b6b" />
          <Text style={styles.errorText}>加载失败</Text>
          <TouchableOpacity style={styles.retryButton} onPress={refetch}>
            <Text style={styles.retryText}>重试</Text>
          </TouchableOpacity>
        </View>
      ) : allContacts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="people" size={48} color="#ccc" />
          <Text style={styles.emptyText}>
            {searchText ? '未找到匹配的联系人' : '暂无联系人'}
          </Text>
        </View>
      ) : viewMode === 'department' ? (
        <FlatList
          data={departments}
          renderItem={renderDepartmentItem}
          keyExtractor={(item) => item.id.toString()}
          style={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <>
          <SectionList
            sections={sections}
            renderItem={renderContactItem}
            renderSectionHeader={renderSectionHeader}
            keyExtractor={(item) => item.id.toString()}
            style={styles.listContainer}
            showsVerticalScrollIndicator={false}
          />
          {/* 字母索引 */}
          <View style={styles.indexContainer}>
            {sections.map((section) => (
              <TouchableOpacity key={section.title}>
                <Text style={styles.indexLetter}>{section.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    margin: 16,
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
  listContainer: {
    paddingBottom: 16,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    color: '#333',
    marginBottom: 4,
  },
  contactPhone: {
    fontSize: 14,
    color: '#666',
  },
  contactDept: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  contactAction: {
    padding: 8,
  },
  sectionHeader: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  sectionHeaderText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
  indexContainer: {
    position: 'absolute',
    right: 8,
    top: 100,
    bottom: 16,
    justifyContent: 'center',
  },
  indexLetter: {
    fontSize: 12,
    color: '#4285F4',
    paddingVertical: 2,
    textAlign: 'center',
  },
  // 视图切换样式
  viewModeContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 4,
  },
  viewModeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  activeViewMode: {
    backgroundColor: '#4285F4',
  },
  viewModeText: {
    fontSize: 14,
    color: '#4285F4',
    marginLeft: 4,
  },
  activeViewModeText: {
    color: '#fff',
  },
  // 部门视图样式
  departmentContainer: {
    marginBottom: 16,
  },
  departmentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f8f9fa',
    borderLeftWidth: 4,
    borderLeftColor: '#4285F4',
  },
  departmentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
    flex: 1,
  },
  contactCount: {
    fontSize: 12,
    color: '#666',
  },
  childDepartment: {
    marginLeft: 20,
    borderLeftWidth: 1,
    borderLeftColor: '#e0e0e0',
  },
  // 加载状态样式
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  // 统计信息样式
  statsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  statsText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  // 错误状态样式
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  errorText: {
    fontSize: 16,
    color: '#ff6b6b',
    marginTop: 12,
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#4285F4',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
  },
  retryText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default ContactsScreen;