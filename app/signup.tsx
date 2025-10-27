import { theme } from '@/constants/Theme';
import { useSignUp } from '@clerk/clerk-expo';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

export default function SignupPage() {
  const { signUp, isLoaded } = useSignUp();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const onSubmit = async () => {
    if (!isLoaded) {
      setErrorMessage('Please wait while we initialize...');
      return;
    }

    if (!email.trim() || !password.trim() || !name.trim()) {
      setErrorMessage('Please fill out all fields');
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    try {
      const firstName = name.trim().split(' ')[0];
      const lastName = name.trim().split(' ').slice(1).join(' ') || '';

      await signUp!.create({
        emailAddress: email.trim(),
        password,
        firstName,
        lastName,
      });

      await signUp!.prepareEmailAddressVerification({ strategy: 'email_code' });

      Alert.alert(
        'Verify your email',
        'We sent a code to your email. Please verify, then sign in.'
      );
      router.replace('/auth');
    } catch (error: any) {
      const msg = error?.errors?.[0]?.message || error?.message || 'Sign up failed. Please try again.';
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


