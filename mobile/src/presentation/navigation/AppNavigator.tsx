import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { AuthNavigator } from './AuthNavigator';
import { MainNavigator } from './MainNavigator';

// Simple auth store (can be replaced with Zustand later)
interface AuthState {
  isAuthenticated: boolean;
  setAuthenticated: (value: boolean) => void;
}

const useAuthStore = (): AuthState => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  return { isAuthenticated, setAuthenticated: setIsAuthenticated };
};

export const AppNavigator: React.FC = () => {
  const { isAuthenticated } = useAuthStore();

  return (
    <NavigationContainer>
      {isAuthenticated ? <MainNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
};
