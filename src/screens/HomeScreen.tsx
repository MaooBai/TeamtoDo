import * as React from 'react';
import { BottomTabBar, createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
export const HomeScreen = () => {
  return (
    <View style={styles.BottomTabBar}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;
            if (route.name === '消息') {
              iconName = focused ? 'chatbubble' : 'chatbubble-outline';
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
        <Tab.Screen name="消息" component={MessagesScreen} />
        <Tab.Screen name="协作" component={CollaborationScreen} />
        <Tab.Screen name="通讯录" component={ContactsScreen} />
        <Tab.Screen name="我的" component={ProfileScreen} />
      </Tab.Navigator>
    );
    </View>
    
  );

}

  
  // 创建四个示例页面组件
  function MessagesScreen() {
    return (
      <View style={styles.screenContainer}>
        <Text style={styles.screenText}>消息页面</Text>
      </View>
    );
  }
  
  function CollaborationScreen() {
    return (
      <View style={styles.screenContainer}>
        <Text style={styles.screenText}>协作页面</Text>
      </View>
    );
  }
  
  function ContactsScreen() {
    return (
      <View style={styles.screenContainer}>
        <Text style={styles.screenText}>通讯录页面</Text>
      </View>
    );
  }
  
  function ProfileScreen() {
    return (
      <View style={styles.screenContainer}>
        <Text style={styles.screenText}>我的页面</Text>
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