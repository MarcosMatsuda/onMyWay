import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MainStackParamList } from './types';
import { HomeScreen } from '../screens/main/HomeScreen';
import { SchoolSelectionScreen } from '../screens/main/SchoolSelectionScreen';
import { MapScreen } from '../screens/main/MapScreen';
import { ProfileScreen } from '../screens/main/ProfileScreen';

const Stack = createNativeStackNavigator<MainStackParamList>();

export const MainNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
      }}
    >
      <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Home' }} />
      <Stack.Screen
        name="SchoolSelect"
        component={SchoolSelectionScreen}
        options={{ title: 'Select School' }}
      />
      <Stack.Screen name="Map" component={MapScreen} options={{ title: 'Map' }} />
      <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile' }} />
    </Stack.Navigator>
  );
};
