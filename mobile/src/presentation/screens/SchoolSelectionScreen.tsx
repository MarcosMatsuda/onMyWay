import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Button } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { School } from '@domain/entities';
import { SchoolRepository } from '@data/repositories';
import { httpClient } from '@infrastructure/http';
import { MainStackParamList } from '@presentation/navigation/types';

type Props = NativeStackScreenProps<MainStackParamList, 'SchoolSelect'>;

// Mock AsyncStorage for now - will be replaced by actual @react-native-async-storage/async-storage
const AsyncStorage = {
  getItem: async (_key: string) => Promise.resolve(null as string | null),
  setItem: async (_key: string, _value: string) => Promise.resolve(),
};

export const SchoolSelectionScreen: React.FC<Props> = ({ navigation }) => {
  const [schools, setSchools] = useState<School[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSchools = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const repo = new SchoolRepository(httpClient);
      const fetchedSchools = await repo.listSchools();
      setSchools(fetchedSchools);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load schools';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSchools();
  }, [loadSchools]);

  const handleSelectSchool = async (school: School) => {
    try {
      await AsyncStorage.setItem('selected_school', JSON.stringify(school));
      navigation.navigate('Home');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save school selection';
      setError(message);
    }
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={{ marginTop: 10 }}>Loading schools...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, padding: 16, justifyContent: 'center' }}>
        <Text style={{ fontSize: 16, color: 'red', marginBottom: 20 }}>Error: {error}</Text>
        <Button title="Retry" onPress={loadSchools} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>Select a School</Text>

      <FlatList
        data={schools}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={{
              padding: 16,
              marginBottom: 10,
              borderWidth: 1,
              borderColor: '#ccc',
              borderRadius: 4,
            }}
            onPress={() => handleSelectSchool(item)}
          >
            <Text style={{ fontSize: 16, fontWeight: '600' }}>{item.name}</Text>
            <Text style={{ fontSize: 14, color: '#666' }}>
              {`Lat: ${item.location.lat.toFixed(4)}, Lng: ${item.location.lng.toFixed(4)}`}
            </Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};
