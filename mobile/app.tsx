import React, { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { AppNavigator } from './src/presentation/navigation';
import { useAuth } from './src/presentation/hooks';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { isLoading, initialize } = useAuth();

  useEffect(() => {
    async function prepare() {
      try {
        // Initialize auth (check stored token)
        await initialize();
      } catch (e) {
        console.warn(e);
      } finally {
        // Hide splash screen
        SplashScreen.hideAsync();
      }
    }

    prepare();
  }, [initialize]);

  if (isLoading) {
    // Return null while loading to keep splash screen visible
    return null;
  }

  return (
    <SafeAreaProvider>
      <AppNavigator />
    </SafeAreaProvider>
  );
}
