import React, { useState } from 'react';
import { View, TextInput, Button, ActivityIndicator, Text } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '@presentation/hooks';
import { AuthStackParamList } from '@presentation/navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

export const RegisterScreen: React.FC<Props> = ({ navigation }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const { register, isLoading, error } = useAuth();

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!name) {
      errors.name = 'Name is required';
    } else if (name.length < 2) {
      errors.name = 'Name must be at least 2 characters';
    }

    if (!email) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Invalid email format';
    }

    if (!phone) {
      errors.phone = 'Phone is required';
    } else if (phone.length < 10) {
      errors.phone = 'Phone must be at least 10 characters';
    }

    if (!password) {
      errors.password = 'Password is required';
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    if (!confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      await register(name, email, phone, password);
    } catch {
      // Error is handled by useAuth hook and displayed via error state
    }
  };

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>Register</Text>

      <TextInput
        style={{
          borderWidth: 1,
          borderColor: '#ccc',
          padding: 10,
          marginBottom: 10,
          borderRadius: 4,
        }}
        placeholder="Name"
        value={name}
        onChangeText={setName}
        editable={!isLoading}
      />
      {validationErrors.name && (
        <Text style={{ color: 'red', marginBottom: 10 }}>{validationErrors.name}</Text>
      )}

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
        placeholder="Phone"
        value={phone}
        onChangeText={setPhone}
        editable={!isLoading}
        keyboardType="phone-pad"
      />
      {validationErrors.phone && (
        <Text style={{ color: 'red', marginBottom: 10 }}>{validationErrors.phone}</Text>
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

      <TextInput
        style={{
          borderWidth: 1,
          borderColor: '#ccc',
          padding: 10,
          marginBottom: 10,
          borderRadius: 4,
        }}
        placeholder="Confirm Password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        editable={!isLoading}
        secureTextEntry
      />
      {validationErrors.confirmPassword && (
        <Text style={{ color: 'red', marginBottom: 10 }}>{validationErrors.confirmPassword}</Text>
      )}

      {error && <Text style={{ color: 'red', marginBottom: 10 }}>Error: {error}</Text>}

      <View style={{ marginBottom: 10 }}>
        <Button
          title={isLoading ? 'Registering...' : 'Register'}
          onPress={handleSubmit}
          disabled={isLoading}
        />
      </View>

      {isLoading && <ActivityIndicator size="large" color="#0000ff" style={{ marginBottom: 10 }} />}

      <Button
        title="Already have an account? Login"
        onPress={() => navigation.navigate('Login')}
        disabled={isLoading}
      />
    </View>
  );
};
