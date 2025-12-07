import { theme } from '@/constants/Theme';
import { useAuth } from '@/services/customAuth';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

// Password validation helper
function validatePassword(password: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('At least 8 characters');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('One uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('One lowercase letter');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('One number');
  }

  return { isValid: errors.length === 0, errors };
}

export default function SignupPage() {
  const { signUp, isLoading: authLoading } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const passwordValidation = validatePassword(password);

  const onSubmit = async () => {
    if (!email.trim() || !password.trim() || !name.trim()) {
      setErrorMessage('Please fill out all fields');
      return;
    }

    if (!passwordValidation.isValid) {
      setErrorMessage('Password does not meet requirements');
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    try {
      // Generate username from name
      const username = name.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');

      const result = await signUp(email.trim(), password, username || undefined);

      if (result.success) {
        Alert.alert(
          'Account Created',
          'Your account has been created successfully!'
        );
        router.replace('/(tabs)/home');
      } else {
        setErrorMessage(result.error || 'Sign up failed. Please try again.');
      }
    } catch (error: any) {
      const msg = error?.message || 'Sign up failed. Please try again.';
      setErrorMessage(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Create your account</Text>
          <Text style={styles.subtitle}>Join and sync your work across devices.</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full name</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="John Doe"
              placeholderTextColor={theme.colors.textSecondary}
              style={styles.input}
              editable={!submitting}
              autoCapitalize="words"
              returnKeyType="next"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor={theme.colors.textSecondary}
              style={styles.input}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              editable={!submitting}
              returnKeyType="next"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor={theme.colors.textSecondary}
              style={styles.input}
              secureTextEntry
              autoComplete="password"
              editable={!submitting}
              returnKeyType="go"
              onSubmitEditing={onSubmit}
            />
          </View>

          {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}

          <Pressable
            onPress={onSubmit}
            disabled={submitting}
            style={({ pressed }) => [
              styles.primaryButton,
              submitting && styles.primaryButtonDisabled,
              pressed && !submitting ? { opacity: 0.9 } : null,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Create account"
          >
            <Text style={styles.primaryButtonText}>{submitting ? 'Creating account...' : 'Create account'}</Text>
          </Pressable>

          <Pressable
            onPress={() => router.replace('/auth')}
            style={({ pressed }) => [styles.linkRow, pressed ? { opacity: 0.7 } : null]}
            accessibilityRole="button"
            accessibilityLabel="Go to sign in"
          >
            <Text style={styles.linkText}>Already have an account? <Text style={styles.linkBold}>Sign in</Text></Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flexGrow: 1,
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  title: {
    ...theme.typography.h4,
    color: theme.colors.textPrimary,
    fontWeight: '700',
  },
  subtitle: {
    ...theme.typography.body2,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.lg,
  },
  inputGroup: {
    gap: theme.spacing.xs,
  },
  label: {
    ...theme.typography.body2,
    color: theme.colors.textPrimary,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.gray300,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 12,
    color: theme.colors.textPrimary,
    ...theme.typography.body1,
  },
  error: {
    color: '#ef4444',
    ...theme.typography.body2,
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 14,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.spacing.sm,
  },
  primaryButtonDisabled: {
    backgroundColor: theme.colors.gray300,
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '700',
    ...theme.typography.body1,
  },
  linkRow: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.spacing.md,
  },
  linkText: {
    color: theme.colors.textSecondary,
    ...theme.typography.body2,
  },
  linkBold: {
    color: theme.colors.primary,
    fontWeight: '700',
  },
});


