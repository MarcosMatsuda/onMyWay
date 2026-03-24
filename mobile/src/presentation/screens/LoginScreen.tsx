import React, { useState } from 'react';
import { View, TextInput, Button, ActivityIndicator, Text } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '@presentation/hooks';
import { AuthStackParamList } from '@presentation/navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const { login, isLoading, error } = useAuth();

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!email) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Invalid email format';
    }

    if (!password) {
      errors.password = 'Password is required';
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      await login(email, password);
    } catch {
      // Error is handled by useAuth hook and displayed via error state
    }
  };

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>Login</Text>

      <TextInput
        style={{
          borderWidth: 1,
          borderColor: '#ccc',
          padding: 10,
          marginBottom: 10,
          borderRadius: 4,
        }}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        editable={!isLoading}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      {validationErrors.email && (
        <Text style={{ color: 'red', marginBottom: 10 }}>{validationErrors.email}</Text>
      )}

      <TextInput
        style={{
          borderWidth: 1,
          borderColor: '#ccc',
          padding: 10,
          marginBottom: 10,
          borderRadius: 4,
        }}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        editable={!isLoading}
        secureTextEntry
      />
      {validationErrors.password && (
        <Text style={{ color: 'red', marginBottom: 10 }}>{validationErrors.password}</Text>
      )}

      {error && <Text style={{ color: 'red', marginBottom: 10 }}>Error: {error}</Text>}

      <View style={{ marginBottom: 10 }}>
        <Button
          title={isLoading ? 'Logging in...' : 'Login'}
          onPress={handleSubmit}
          disabled={isLoading}
        />
      </View>

      {isLoading && <ActivityIndicator size="large" color="#0000ff" style={{ marginBottom: 10 }} />}

      <Button
        title="Don't have an account? Register"
        onPress={() => navigation.navigate('Register')}
        disabled={isLoading}
      />
    </View>
  );
};
