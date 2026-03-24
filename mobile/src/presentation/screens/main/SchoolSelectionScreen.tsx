import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Button } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { School } from '@domain/entities';
import { schoolRepository } from '@data/repositories';
import { MainStackParamList } from '@presentation/navigation/types';

type SchoolSelectionScreenNavigationProp = NativeStackNavigationProp<
  MainStackParamList,
  'SchoolSelect'
>;

interface Props {
  navigation: SchoolSelectionScreenNavigationProp;
}

export const SchoolSelectionScreen: React.FC<Props> = ({ navigation }) => {
  const [schools, setSchools] = useState<School[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSchools();
  }, []);

  const loadSchools = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const fetchedSchools = await schoolRepository.listSchools();
      setSchools(fetchedSchools);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load schools';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectSchool = async (school: School) => {
    try {
      // Save selected school to secure storage
      await SecureStore.setItemAsync('selected_school', JSON.stringify(school));

      // Navigate back to Home
      navigation.navigate('Home');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save school selection';
      setError(message);
    }
  };

  const renderSchoolItem = ({ item }: { item: School }) => (
    <TouchableOpacity
      style={{
        marginBottom: 12,
        padding: 16,
        backgroundColor: '#f9f9f9',
        borderRadius: 4,
        borderLeftWidth: 4,
        borderLeftColor: '#3498db',
      }}
      onPress={() => handleSelectSchool(item)}
    >
      <Text style={{ fontWeight: '600', fontSize: 16, marginBottom: 4 }}>{item.name}</Text>
      <Text style={{ fontSize: 12, color: '#666' }}>
        Location: {item.location.lat.toFixed(4)}, {item.location.lng.toFixed(4)}
      </Text>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <View style={{ marginTop: 20, marginBottom: 16 }}>
        <Text style={{ fontSize: 24, fontWeight: 'bold' }}>Select a School</Text>
      </View>

      {error && (
        <View
          style={{ marginBottom: 16, padding: 12, backgroundColor: '#ffe0e0', borderRadius: 4 }}
        >
          <Text style={{ color: '#ff6b6b', marginBottom: 8 }}>Error: {error}</Text>
          <Button title="Retry" onPress={loadSchools} />
        </View>
      )}

      {schools.length === 0 && !error && (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ fontSize: 16, color: '#666' }}>No schools available</Text>
        </View>
      )}

      {schools.length > 0 && (
        <FlatList
          data={schools}
          renderItem={renderSchoolItem}
          keyExtractor={(school) => school.id}
          scrollEnabled
        />
      )}
    </View>
  );
};
