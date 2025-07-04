import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MainStackNavigator } from './src/navigation';
import { REACT_QUERY_CONFIG } from './src/api/config/config';

// 创建QueryClient实例
const queryClient = new QueryClient(REACT_QUERY_CONFIG);

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <NavigationContainer>
        <MainStackNavigator />
      </NavigationContainer>
    </QueryClientProvider>
  );
}


