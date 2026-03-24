import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { School } from '@domain/entities';
import { schoolRepository } from '@data/repositories';
import { MainStackParamList } from '../../navigation/types';

type SchoolSelectionScreenProps = NativeStackScreenProps<MainStackParamList, 'SchoolSelect'>;

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
      // TODO: Persist to AsyncStorage when @react-native-async-storage/async-storage is available
      // await AsyncStorage.setItem(SELECTED_SCHOOL_KEY, JSON.stringify(school));

      // For now, just navigate back
      navigation.navigate('Home');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save selected school';
      setError(message);
    }
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 10 }}>Loading schools...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, padding: 20, justifyContent: 'center' }}>
        <Text style={{ color: 'red', marginBottom: 20 }}>Error: {error}</Text>
        <TouchableOpacity
          onPress={() => {
            void loadSchools();
          }}
          style={{ padding: 10, backgroundColor: '#007AFF', borderRadius: 5 }}
        >
          <Text style={{ color: 'white', textAlign: 'center' }}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 24, marginBottom: 20 }}>Select School</Text>

      <FlatList
        data={schools}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => {
              void handleSelectSchool(item);
            }}
            style={{
              padding: 15,
              marginBottom: 10,
              borderWidth: 1,
              borderColor: '#ccc',
              borderRadius: 5,
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: 'bold' }}>{item.name}</Text>
            <Text style={{ fontSize: 12, color: '#666', marginTop: 5 }}>
              Location: {item.location.lat.toFixed(4)},{item.location.lng.toFixed(4)}
            </Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={{ textAlign: 'center', marginTop: 20 }}>No schools available</Text>
        }
      />
    </View>
  );
}
