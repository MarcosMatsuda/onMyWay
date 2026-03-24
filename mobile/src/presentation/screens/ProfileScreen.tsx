import React from 'react';
import {
  View,
  Text,
  Button,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '@presentation/hooks';
import { MainStackParamList } from '@presentation/navigation/types';

type Props = NativeStackScreenProps<MainStackParamList, 'Profile'>;

const styles = StyleSheet.create<any>({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  infoSection: {
    marginBottom: 32,
  },
  infoRow: {
    marginBottom: 20,
  },
  infoLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  infoValue: {
    fontSize: 16,
    color: '#1a1a1a',
    fontWeight: '500',
  },
  logoutButtonContainer: {
    marginTop: 40,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#ffffff',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#64748b',
  },
});

export const ProfileScreen: React.FC<Props> = ({ navigation }) => {
  const { parent, isLoading, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      // Navigation is handled automatically by AppNavigator
    } catch {
      // Error is handled by useAuth hook
    }
  };

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map((part) => part.charAt(0).toUpperCase())
      .join('')
      .substring(0, 2);
  };

  if (!parent) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No parent data available</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Avatar + Name */}
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getInitials(parent.name)}</Text>
          </View>
          <Text style={styles.name}>{parent.name}</Text>
        </View>

        {/* Info Section */}
        <View style={styles.infoSection}>
          {/* Email */}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{parent.email}</Text>
          </View>

          {/* Phone */}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Phone</Text>
            <Text style={styles.infoValue}>{parent.phone}</Text>
          </View>
        </View>

        {/* Logout Button */}
        <View style={styles.logoutButtonContainer}>
          {isLoading ? (
            <View
              style={[{ backgroundColor: '#dc2626', borderRadius: 8 }, styles.loadingContainer]}
            >
              <ActivityIndicator size="small" color="#ffffff" />
              <Text style={styles.loadingText}>Logging out...</Text>
            </View>
          ) : (
            <Button title="Log out" onPress={handleLogout} disabled={isLoading} color="#dc2626" />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
