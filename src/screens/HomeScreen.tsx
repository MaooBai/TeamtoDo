import * as React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { EnhancedMessagesScreen } from './MessageScreen';
import { CollaborationScreen } from './CollaborationScreen';
import { ContactsScreen } from './ContactsScreen';
import { ProfileScreen } from './ProfileScreen';
export const HomeScreen = () => {
  return (
    <View style={styles.BottomTabBar}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;
            if (route.name === '消息') {
              iconName = focused ? 'chatbubble-ellipses' : 'chatbubble-ellipses-outline';
            } else if (route.name === '协作') {
              iconName = focused ? 'people' : 'people-outline';
            } else if (route.name === '通讯录') {
              iconName = focused ? 'book' : 'book-outline';
            } else if (route.name === '我的') {
              iconName = focused ? 'person' : 'person-outline';
            }
  
            // 确保 iconName 不为 undefined，若为 undefined 则使用默认图标名
            const safeIconName = iconName || 'help-outline'; 
            return <Ionicons name={safeIconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: '#4285F4', // 选中颜色
          tabBarInactiveTintColor: 'gray',   // 未选中颜色
          tabBarStyle: {
            paddingBottom: 5,  // 底部间距
            height: 60,       // 导航栏高度
          },
          tabBarLabelStyle: {
            fontSize: 12,     // 文字大小
            marginBottom: 5,   // 文字与图标间距
          },
          headerShown: false, // 隐藏顶部标题栏
        })}
      >
        <Tab.Screen name="消息" component={EnhancedMessagesScreen} />
        <Tab.Screen name="协作" component={CollaborationScreen} />
        <Tab.Screen name="通讯录" component={ContactsScreen} />
        <Tab.Screen name="我的" component={ProfileScreen} />
      </Tab.Navigator>
    );
    </View>
  );
}
  
  // 创建底部导航器
  const Tab = createBottomTabNavigator();
  

  const styles = StyleSheet.create({
    BottomTabBar: {
      backgroundColor: '#fff',
      borderTopWidth: 1,
      borderTopColor: '#ddd', 
      flex: 1,
    },
    screenContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#fff',
    },
    screenText: {
      fontSize: 20,
      fontWeight: 'bold',
    },
  });