import React, { useState } from 'react';
import { View, TextInput, Button, Text, ActivityIndicator, ScrollView } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '@presentation/hooks';
import { AuthStackParamList } from '@presentation/navigation/types';

type LoginScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

interface Props {
  navigation: LoginScreenNavigationProp;
}

export const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const { login, isLoading, error } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!email.trim()) {
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

  const handleLogin = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      await login(email, password);
      // Navigation will be handled automatically by AppNavigator
    } catch {
      // Error is already stored in useAuth().error
    }
  };

  return (
    <ScrollView style={{ flex: 1, padding: 16 }}>
      <View style={{ marginTop: 20 }}>
        <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>Login</Text>

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

        {/* Login Button */}
        <View style={{ marginBottom: 16 }}>
          <Button
            title={isLoading ? 'Logging in...' : 'Login'}
            onPress={handleLogin}
            disabled={isLoading}
          />
          {isLoading && <ActivityIndicator size="large" style={{ marginTop: 12 }} />}
        </View>

        {/* Register Link */}
        <View style={{ alignItems: 'center', marginTop: 20 }}>
          <Text style={{ marginBottom: 8 }}>Don't have an account?</Text>
          <Button
            title="Go to Register"
            onPress={() => navigation.navigate('Register')}
            disabled={isLoading}
          />
        </View>
      </View>
    </ScrollView>
  );
};
