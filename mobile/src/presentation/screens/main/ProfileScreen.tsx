import React from 'react';
import { View, Text, Button } from 'react-native';
import { useAuth } from '../../hooks';

export function ProfileScreen(): JSX.Element {
  const { parent, logout, isLoading } = useAuth();

  if (!parent) {
    return (
      <View style={{ flex: 1, padding: 20, justifyContent: 'center' }}>
        <Text>No user information available</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 24, marginBottom: 20 }}>Profile</Text>

      <View style={{ marginBottom: 20 }}>
        <Text style={{ fontSize: 14, color: '#666', marginBottom: 5 }}>Name</Text>
        <Text style={{ fontSize: 18, fontWeight: 'bold' }}>{parent.name}</Text>
      </View>

      <View style={{ marginBottom: 20 }}>
        <Text style={{ fontSize: 14, color: '#666', marginBottom: 5 }}>Email</Text>
        <Text style={{ fontSize: 18 }}>{parent.email}</Text>
      </View>

      <View style={{ marginBottom: 20 }}>
        <Text style={{ fontSize: 14, color: '#666', marginBottom: 5 }}>Phone</Text>
        <Text style={{ fontSize: 18 }}>{parent.phone}</Text>
      </View>

      <Button
        title={isLoading ? 'Logging out...' : 'Logout'}
        onPress={() => {
          void logout();
        }}
        disabled={isLoading}
      />
    </View>
  );
}
