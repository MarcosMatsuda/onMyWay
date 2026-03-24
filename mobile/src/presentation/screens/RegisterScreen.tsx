import React, { useState } from 'react';
import {
  View,
  TextInput,
  Button,
  ActivityIndicator,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '@presentation/hooks';
import { AuthStackParamList } from '@presentation/navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

const styles = StyleSheet.create<any>({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 16,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    color: '#1a1a1a',
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9fafb',
    color: '#1a1a1a',
  },
  inputError: {
    borderColor: '#ef4444',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: 4,
  },
  apiErrorText: {
    color: '#ef4444',
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  buttonContainer: {
    marginTop: 24,
    marginBottom: 16,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#1a1a1a',
  },
  linkContainer: {
    marginTop: 20,
  },
  linkText: {
    fontSize: 14,
    color: '#2563eb',
    textAlign: 'center',
  },
});

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
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Register</Text>

        {/* Name Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Name</Text>
          <TextInput
            style={[styles.input, validationErrors.name && styles.inputError]}
            placeholder="Enter your full name"
            value={name}
            onChangeText={setName}
            editable={!isLoading}
            placeholderTextColor="#9ca3af"
          />
          {validationErrors.name && <Text style={styles.errorText}>{validationErrors.name}</Text>}
        </View>

        {/* Email Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={[styles.input, validationErrors.email && styles.inputError]}
            placeholder="Enter your email"
            value={email}
            onChangeText={setEmail}
            editable={!isLoading}
            autoCapitalize="none"
            placeholderTextColor="#9ca3af"
          />
          {validationErrors.email && <Text style={styles.errorText}>{validationErrors.email}</Text>}
        </View>

        {/* Phone Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Phone</Text>
          <TextInput
            style={[styles.input, validationErrors.phone && styles.inputError]}
            placeholder="Enter your phone number"
            value={phone}
            onChangeText={setPhone}
            editable={!isLoading}
            placeholderTextColor="#9ca3af"
          />
          {validationErrors.phone && <Text style={styles.errorText}>{validationErrors.phone}</Text>}
        </View>

        {/* Password Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Password</Text>
          <TextInput
            style={[styles.input, validationErrors.password && styles.inputError]}
            placeholder="Create a password"
            value={password}
            onChangeText={setPassword}
            editable={!isLoading}
            secureTextEntry
            placeholderTextColor="#9ca3af"
          />
          {validationErrors.password && (
            <Text style={styles.errorText}>{validationErrors.password}</Text>
          )}
        </View>

        {/* Confirm Password Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Confirm Password</Text>
          <TextInput
            style={[styles.input, validationErrors.confirmPassword && styles.inputError]}
            placeholder="Confirm your password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            editable={!isLoading}
            secureTextEntry
            placeholderTextColor="#9ca3af"
          />
          {validationErrors.confirmPassword && (
            <Text style={styles.errorText}>{validationErrors.confirmPassword}</Text>
          )}
        </View>

        {/* API Error */}
        {error && <Text style={styles.apiErrorText}>Error: {error}</Text>}

        {/* Submit Button */}
        <View style={styles.buttonContainer}>
          <Button
            title={isLoading ? 'Registering...' : 'Register'}
            onPress={handleSubmit}
            disabled={isLoading}
            color="#2563eb"
          />
        </View>

        {/* Loading Indicator */}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#2563eb" />
            <Text style={styles.loadingText}>Please wait...</Text>
          </View>
        )}

        {/* Login Link */}
        <TouchableOpacity style={styles.linkContainer} onPress={() => navigation.navigate('Login')}>
          <Text style={styles.linkText}>Already have an account? Login</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};
