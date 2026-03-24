import React from 'react';
import { View, Text, Button, ActivityIndicator, ScrollView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '@presentation/hooks';
import { MainStackParamList } from '@presentation/navigation/types';

type Props = NativeStackScreenProps<MainStackParamList, 'Profile'>;

export const ProfileScreen: React.FC<Props> = ({ navigation }) => {
  const { parent, isLoading, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      // Navigation is handled automatically by AppNavigator reacting to isAuthenticated = false
    } catch {
      // Error is handled by useAuth hook
    }
  };

  if (!parent) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>No parent data available</Text>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>Profile</Text>

      <View style={{ marginBottom: 20 }}>
        <Text style={{ fontSize: 14, color: '#666', marginBottom: 5 }}>Name</Text>
        <Text style={{ fontSize: 18, fontWeight: '600' }}>{parent.name}</Text>
      </View>

      <View style={{ marginBottom: 20 }}>
        <Text style={{ fontSize: 14, color: '#666', marginBottom: 5 }}>Email</Text>
        <Text style={{ fontSize: 18 }}>{parent.email}</Text>
      </View>

      <View style={{ marginBottom: 30 }}>
        <Text style={{ fontSize: 14, color: '#666', marginBottom: 5 }}>Phone</Text>
        <Text style={{ fontSize: 18 }}>{parent.phone}</Text>
      </View>

      {isLoading && (
        <View style={{ marginBottom: 20 }}>
          <ActivityIndicator size="large" color="#0000ff" />
        </View>
      )}

      <Button
        title={isLoading ? 'Logging out...' : 'Logout'}
        onPress={handleLogout}
        disabled={isLoading}
      />
    </ScrollView>
  );
};
