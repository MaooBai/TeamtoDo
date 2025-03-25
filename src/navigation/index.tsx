import { createStackNavigator } from '@react-navigation/stack';
import { HomeScreen, LoginScreen, RegisterScreen, ForgotPasswordScreen } from '../screens';

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Home: undefined;
  ForgotPassword: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

export const MainStackNavigator = () => (
  <Stack.Navigator initialRouteName="Login">
    <Stack.Screen
      name="Login"
      component={LoginScreen}
      options={{ title: '登录' }}
    />
    <Stack.Screen
      name="Register"
      component={RegisterScreen}
      options={{ title: '注册' }}
    />
    <Stack.Screen 
      name="Home" 
      component={HomeScreen} 
      options={{ title: 'TeamToDo' }}
    />
    <Stack.Screen
      name="ForgotPassword"
      component={ForgotPasswordScreen}
      options={{ title: '重置密码' }}
    />
  </Stack.Navigator>
);