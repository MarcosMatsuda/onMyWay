import React from 'react';
import { View, Text, Button, ScrollView, ActivityIndicator } from 'react-native';
import { useAuth } from '../../hooks';

export function ProfileScreen(): JSX.Element {
  const { parent, isLoading, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      // Navigation will be handled automatically by AppNavigator
    } catch {
      // Error handling could be added here if needed
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
      <View style={{ marginTop: 20 }}>
        <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>Profile</Text>

        {/* Parent Info */}
        <View
          style={{ marginBottom: 16, padding: 16, backgroundColor: '#f9f9f9', borderRadius: 4 }}
        >
          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontWeight: '600', marginBottom: 4, color: '#666' }}>Name</Text>
            <Text style={{ fontSize: 16 }}>{parent.name}</Text>
          </View>

          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontWeight: '600', marginBottom: 4, color: '#666' }}>Email</Text>
            <Text style={{ fontSize: 16 }}>{parent.email}</Text>
          </View>

          <View>
            <Text style={{ fontWeight: '600', marginBottom: 4, color: '#666' }}>Phone</Text>
            <Text style={{ fontSize: 16 }}>{parent.phone}</Text>
          </View>
        </View>

        {/* Logout Button */}
        <View>
          <Button
            title={isLoading ? 'Logging out...' : 'Logout'}
            onPress={handleLogout}
            disabled={isLoading}
            color="#ff6b6b"
          />
          {isLoading && <ActivityIndicator size="large" style={{ marginTop: 12 }} />}
        </View>
      </View>
    </ScrollView>
  );
}
