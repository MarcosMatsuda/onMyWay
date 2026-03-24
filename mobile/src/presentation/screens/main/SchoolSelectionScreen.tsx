import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { School } from '@domain/entities';
import { schoolRepository } from '@data/repositories';
import { MainStackParamList } from '../../navigation/types';

type SchoolSelectionScreenProps = NativeStackScreenProps<MainStackParamList, 'SchoolSelect'>;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  schoolCard: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  schoolName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  schoolLocation: {
    fontSize: 14,
    color: '#64748b',
  },
  separator: {
    height: 8,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  errorContainer: {
    padding: 16,
    backgroundColor: '#fee2e2',
    borderRadius: 8,
    margin: 16,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#991b1b',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#991b1b',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#dc2626',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  retryButtonText: {
    color: '#ffffff',
    textAlign: 'center',
    fontWeight: '600',
  },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
  },
});

export function SchoolSelectionScreen({ navigation }: SchoolSelectionScreenProps): JSX.Element {
  const [schools, setSchools] = useState<School[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSchools = async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      const fetchedSchools = await schoolRepository.listSchools();
      setSchools(fetchedSchools);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load schools';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadSchools();
  }, []);

  const handleSelectSchool = async (school: School): Promise<void> => {
    try {
      // TODO: Persist to AsyncStorage when dependency available
      navigation.navigate('Home');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save selected school';
      setError(message);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Select your school</Text>
        </View>
        <View style={styles.centerContainer}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2563eb" />
            <Text style={{ marginTop: 12, color: '#64748b' }}>Loading schools...</Text>
          </View>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Select your school</Text>
        </View>
        <View style={styles.centerContainer}>
          <View style={styles.errorContainer}>
            <Text style={styles.errorTitle}>Error loading schools</Text>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => {
                void loadSchools();
              }}
            >
              <Text style={styles.retryButtonText}>Try again</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Select your school</Text>
      </View>

      <FlatList
        data={schools}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        renderItem={({ item }) => (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => {
              void handleSelectSchool(item);
            }}
            style={styles.schoolCard}
          >
            <Text style={styles.schoolName}>{item.name}</Text>
            <Text style={styles.schoolLocation}>
              Lat: {item.location.lat.toFixed(2)}, Lng:
              {item.location.lng.toFixed(2)}
            </Text>
          </TouchableOpacity>
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No schools available</Text>
          </View>
        }
      />
    </View>
  );
}
