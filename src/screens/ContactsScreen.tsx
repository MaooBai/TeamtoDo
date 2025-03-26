import React, { useState } from 'react';
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

// 模拟联系人数据
const contactsData = [
  { id: '1', name: '张三', phone: '13800138001', avatar: 'https://randomuser.me/api/portraits/men/1.jpg' },
  { id: '2', name: '李四', phone: '13800138002', avatar: 'https://randomuser.me/api/portraits/women/2.jpg' },
  { id: '3', name: '王五', phone: '13800138003', avatar: 'https://randomuser.me/api/portraits/men/3.jpg' },
  { id: '4', name: '赵六', phone: '13800138004', avatar: 'https://randomuser.me/api/portraits/women/4.jpg' },
  { id: '5', name: '钱七', phone: '13800138005', avatar: 'https://randomuser.me/api/portraits/men/5.jpg' },
  { id: '6', name: '孙八', phone: '13800138006', avatar: 'https://randomuser.me/api/portraits/women/6.jpg' },
  { id: '7', name: '周九', phone: '13800138007', avatar: 'https://randomuser.me/api/portraits/men/7.jpg' },
  { id: '8', name: '吴十', phone: '13800138008', avatar: 'https://randomuser.me/api/portraits/women/8.jpg' },
];

// 按字母分组
// const groupContactsByLetter = () => {
//   const grouped = {};
//   contactsData.forEach(contact => {
//     const firstLetter = contact.name[0].toUpperCase();
//     if (!grouped[firstLetter]) {
//       grouped[firstLetter] = [];
//     }
//     grouped[firstLetter].push(contact);
//   });
  
//   return Object.keys(grouped).sort().map(letter => ({
//     title: letter,
//     data: grouped[letter]
//   }));
// };

export const ContactsScreen = ({ }) => {
  const [searchText, setSearchText] = useState('');
// 定义按字母分组的函数
const groupContactsByLetter = () => {
  const grouped: { [key: string]: typeof contactsData } = {};
  contactsData.forEach(contact => {
    const firstLetter = contact.name[0].toUpperCase();
    if (!grouped[firstLetter]) {
      grouped[firstLetter] = [];
    }
    grouped[firstLetter].push(contact);
  });

  return Object.keys(grouped).sort().map(letter => ({
    title: letter,
    data: grouped[letter]
  }));
};

const [sections] = useState(groupContactsByLetter());


// 定义 Contact 类型，用于明确 item 的结构
type Contact = {
  id: string;
  name: string;
  phone: string;
  avatar: string;
};

const renderItem = ({ item }: { item: Contact }) => (
    <TouchableOpacity 
      style={styles.contactItem}
    >
      <Image source={{ uri: item.avatar }} style={styles.avatar} />
      <View style={styles.contactInfo}>
        <Text style={styles.contactName}>{item.name}</Text>
        <Text style={styles.contactPhone}>{item.phone}</Text>
      </View>
      <TouchableOpacity style={styles.contactAction}>
        <Ionicons name="chatbubble-ellipses" size={24} color="#4285F4" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

// 为 section 参数添加类型注解，以解决隐式 any 类型的问题
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
      


      
      {/* 字母索引 */}
      <View style={styles.indexContainer}>
        {sections.map((section: { title: boolean | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | Promise<string | number | bigint | boolean | React.ReactPortal | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | null | undefined> | React.Key | null | undefined; }) => (
// 问题在于 `section.title` 的类型可能包含无法作为 `key` 的值，这里假设 `section.title` 是字符串类型，将其转换为字符串以确保可以作为 `key` 使用
          <TouchableOpacity key={String(section.title)}>
            <Text style={styles.indexLetter}>{section.title}</Text>
          </TouchableOpacity>
        ))}
      </View>
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
});

export default ContactsScreen;