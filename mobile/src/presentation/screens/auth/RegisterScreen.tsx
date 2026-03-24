import React, { useState } from 'react';
import { View, TextInput, Button, Text, ActivityIndicator, ScrollView } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '@presentation/hooks';
import { AuthStackParamList } from '@presentation/navigation/types';

type RegisterScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Register'>;

interface Props {
  navigation: RegisterScreenNavigationProp;
}

export const RegisterScreen: React.FC<Props> = ({ navigation }) => {
  const { register, isLoading, error } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!name.trim()) {
      errors.name = 'Name is required';
    } else if (name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters';
    }

    if (!email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Invalid email format';
    }

    if (!phone.trim()) {
      errors.phone = 'Phone is required';
    } else if (phone.trim().length < 10) {
      errors.phone = 'Phone must be at least 10 characters';
    }

    if (!password) {
      errors.password = 'Password is required';
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    if (!confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (confirmPassword !== password) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      await register(name, email, phone, password);
      // Navigation will be handled automatically by AppNavigator
    } catch {
      // Error is already stored in useAuth().error
    }
  };

  return (
    <ScrollView style={{ flex: 1, padding: 16 }}>
      <View style={{ marginTop: 20 }}>
        <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>Register</Text>

        {/* Name Input */}
        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontWeight: '600', marginBottom: 8 }}>Name</Text>
          <TextInput
            style={{
              borderWidth: 1,
              borderColor: validationErrors.name ? '#ff6b6b' : '#ccc',
              padding: 12,
              borderRadius: 4,
            }}
            placeholder="Enter your full name"
            value={name}
            onChangeText={setName}
            editable={!isLoading}
          />
          {validationErrors.name && (
            <Text style={{ color: '#ff6b6b', marginTop: 4 }}>{validationErrors.name}</Text>
          )}
        </View>

        {/* Email Input */}
        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontWeight: '600', marginBottom: 8 }}>Email</Text>
          <TextInput
            style={{
              borderWidth: 1,
              borderColor: validationErrors.email ? '#ff6b6b' : '#ccc',
              padding: 12,
              borderRadius: 4,
            }}
            placeholder="Enter your email"
            value={email}
            onChangeText={setEmail}
            editable={!isLoading}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          {validationErrors.email && (
            <Text style={{ color: '#ff6b6b', marginTop: 4 }}>{validationErrors.email}</Text>
          )}
        </View>

        {/* Phone Input */}
        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontWeight: '600', marginBottom: 8 }}>Phone</Text>
          <TextInput
            style={{
              borderWidth: 1,
              borderColor: validationErrors.phone ? '#ff6b6b' : '#ccc',
              padding: 12,
              borderRadius: 4,
            }}
            placeholder="Enter your phone"
            value={phone}
            onChangeText={setPhone}
            editable={!isLoading}
            keyboardType="phone-pad"
          />
          {validationErrors.phone && (
            <Text style={{ color: '#ff6b6b', marginTop: 4 }}>{validationErrors.phone}</Text>
          )}
        </View>

        {/* Password Input */}
        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontWeight: '600', marginBottom: 8 }}>Password</Text>
          <TextInput
            style={{
              borderWidth: 1,
              borderColor: validationErrors.password ? '#ff6b6b' : '#ccc',
              padding: 12,
              borderRadius: 4,
            }}
            placeholder="Enter your password"
            value={password}
            onChangeText={setPassword}
            editable={!isLoading}
            secureTextEntry
          />
          {validationErrors.password && (
            <Text style={{ color: '#ff6b6b', marginTop: 4 }}>{validationErrors.password}</Text>
          )}
        </View>

        {/* Confirm Password Input */}
        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontWeight: '600', marginBottom: 8 }}>Confirm Password</Text>
          <TextInput
            style={{
              borderWidth: 1,
              borderColor: validationErrors.confirmPassword ? '#ff6b6b' : '#ccc',
              padding: 12,
              borderRadius: 4,
            }}
            placeholder="Confirm your password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            editable={!isLoading}
            secureTextEntry
          />
          {validationErrors.confirmPassword && (
            <Text style={{ color: '#ff6b6b', marginTop: 4 }}>
              {validationErrors.confirmPassword}
            </Text>
          )}
        </View>

        {/* API Error */}
        {error && (
          <View
            style={{
              marginBottom: 16,
              padding: 12,
              backgroundColor: '#ffe0e0',
              borderRadius: 4,
            }}
          >
            <Text style={{ color: '#ff6b6b' }}>{error}</Text>
          </View>
        )}

        {/* Register Button */}
        <View style={{ marginBottom: 16 }}>
          <Button
            title={isLoading ? 'Registering...' : 'Register'}
            onPress={handleRegister}
            disabled={isLoading}
          />
          {isLoading && <ActivityIndicator size="large" style={{ marginTop: 12 }} />}
        </View>

        {/* Login Link */}
        <View style={{ alignItems: 'center', marginTop: 20 }}>
          <Text style={{ marginBottom: 8 }}>Already have an account?</Text>
          <Button
            title="Go to Login"
            onPress={() => navigation.navigate('Login')}
            disabled={isLoading}
          />
        </View>
      </View>
    </ScrollView>
  );
};
