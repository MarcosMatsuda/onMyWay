import React, { useState } from 'react';
import { View, Text, TextInput, Button, ActivityIndicator } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../../hooks';
import { AuthStackParamList } from '../../navigation/types';

type LoginScreenProps = NativeStackScreenProps<AuthStackParamList, 'Login'>;

const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export function LoginScreen({ navigation }: LoginScreenProps): JSX.Element {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const { login, isLoading, error } = useAuth();

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!email.trim()) {
      errors.email = 'Email is required';
    } else if (!isValidEmail(email)) {
      errors.email = 'Invalid email format';
    }

    if (!password.trim()) {
      errors.password = 'Password is required';
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleLogin = async (): Promise<void> => {
    if (!validateForm()) {
      return;
    }

    try {
      await login(email, password);
    } catch {
      // Error is handled by useAuth hook
    }
  };

  return (
    <View style={{ flex: 1, padding: 20, justifyContent: 'center' }}>
      <Text style={{ fontSize: 24, marginBottom: 20 }}>Login</Text>

      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        editable={!isLoading}
        style={{ borderWidth: 1, padding: 10, marginBottom: 10 }}
      />
      {validationErrors.email && (
        <Text style={{ color: 'red', marginBottom: 10 }}>{validationErrors.email}</Text>
      )}

      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        editable={!isLoading}
        style={{ borderWidth: 1, padding: 10, marginBottom: 10 }}
      />
      {validationErrors.password && (
        <Text style={{ color: 'red', marginBottom: 10 }}>{validationErrors.password}</Text>
      )}

      {error && <Text style={{ color: 'red', marginBottom: 10 }}>{error}</Text>}

      <View style={{ marginBottom: 10 }}>
        <Button
          title={isLoading ? 'Logging in...' : 'Login'}
          onPress={handleLogin}
          disabled={isLoading}
        />
      </View>

      {isLoading && <ActivityIndicator size="large" />}

      <Button
        title="Don't have an account? Register"
        onPress={() => navigation.navigate('Register')}
        disabled={isLoading}
      />
    </View>
  );
}
