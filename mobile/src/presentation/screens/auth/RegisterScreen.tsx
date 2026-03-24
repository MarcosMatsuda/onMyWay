import React, { useState } from 'react';
import { View, Text, TextInput, Button, ActivityIndicator } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../../hooks';
import { AuthStackParamList } from '../../navigation/types';

type RegisterScreenProps = NativeStackScreenProps<AuthStackParamList, 'Register'>;

const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export function RegisterScreen({ navigation }: RegisterScreenProps): JSX.Element {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const { register, isLoading, error } = useAuth();

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!name.trim()) {
      errors.name = 'Name is required';
    } else if (name.length < 2) {
      errors.name = 'Name must be at least 2 characters';
    }

    if (!email.trim()) {
      errors.email = 'Email is required';
    } else if (!isValidEmail(email)) {
      errors.email = 'Invalid email format';
    }

    if (!phone.trim()) {
      errors.phone = 'Phone is required';
    } else if (phone.length < 10) {
      errors.phone = 'Phone must be at least 10 characters';
    }

    if (!password.trim()) {
      errors.password = 'Password is required';
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    if (!confirmPassword.trim()) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleRegister = async (): Promise<void> => {
    if (!validateForm()) {
      return;
    }

    try {
      await register(name, email, phone, password);
    } catch {
      // Error is handled by useAuth hook
    }
  };

  return (
    <View style={{ flex: 1, padding: 20, justifyContent: 'center' }}>
      <Text style={{ fontSize: 24, marginBottom: 20 }}>Register</Text>

      <TextInput
        placeholder="Name"
        value={name}
        onChangeText={setName}
        editable={!isLoading}
        style={{ borderWidth: 1, padding: 10, marginBottom: 10 }}
      />
      {validationErrors.name && (
        <Text style={{ color: 'red', marginBottom: 10 }}>{validationErrors.name}</Text>
      )}

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
        placeholder="Phone"
        value={phone}
        onChangeText={setPhone}
        editable={!isLoading}
        style={{ borderWidth: 1, padding: 10, marginBottom: 10 }}
      />
      {validationErrors.phone && (
        <Text style={{ color: 'red', marginBottom: 10 }}>{validationErrors.phone}</Text>
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

      <TextInput
        placeholder="Confirm Password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
        editable={!isLoading}
        style={{ borderWidth: 1, padding: 10, marginBottom: 10 }}
      />
      {validationErrors.confirmPassword && (
        <Text style={{ color: 'red', marginBottom: 10 }}>{validationErrors.confirmPassword}</Text>
      )}

      {error && <Text style={{ color: 'red', marginBottom: 10 }}>{error}</Text>}

      <View style={{ marginBottom: 10 }}>
        <Button
          title={isLoading ? 'Creating account...' : 'Register'}
          onPress={handleRegister}
          disabled={isLoading}
        />
      </View>

      {isLoading && <ActivityIndicator size="large" />}

      <Button
        title="Already have an account? Login"
        onPress={() => navigation.navigate('Login')}
        disabled={isLoading}
      />
    </View>
  );
}
