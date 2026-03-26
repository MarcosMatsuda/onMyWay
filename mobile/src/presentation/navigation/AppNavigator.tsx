import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { useAuth } from '../hooks/useAuth';
import { AuthNavigator } from './AuthNavigator';
import { MainNavigator } from './MainNavigator';

const INIT_TIMEOUT_MS = 5000;

export const AppNavigator: React.FC = () => {
  const { isAuthenticated, isLoading, initialize } = useAuth();
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    let timedOut = false;

    const timeout = setTimeout(() => {
      timedOut = true;
      setInitialized(true);
    }, INIT_TIMEOUT_MS);

    initialize()
      .catch(() => {})
      .finally(() => {
        if (!timedOut) {
          clearTimeout(timeout);
          setInitialized(true);
        }
      });

    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!initialized || isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? <MainNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6b7280',
  },
});
