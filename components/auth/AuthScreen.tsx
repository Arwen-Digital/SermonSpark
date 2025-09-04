import { theme } from '@/constants/Theme';
import authService from '@/services/supabaseAuthService';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Button } from '../common/Button';
import { Card } from '../common/Card';

interface AuthScreenProps {
  onAuthenticated: () => void;
}

type AuthMode = 'signin' | 'signup' | 'forgot';

export const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthenticated }) => {
  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [church, setChurch] = useState('');
  const [title, setTitle] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async () => {
    setIsLoading(true);
    setErrorMessage(''); // Clear previous errors
    
    try {
      if (mode === 'signup') {
        // Validation
        if (!name.trim()) {
          setErrorMessage('Please enter your name');
          return;
        }
        if (!email.trim()) {
          setErrorMessage('Please enter your email');
          return;
        }
        if (!password.trim()) {
          setErrorMessage('Please enter a password');
          return;
        }
        if (password !== confirmPassword) {
          setErrorMessage('Passwords do not match');
          return;
        }
        if (password.length < 6) {
          setErrorMessage('Password must be at least 6 characters');
          return;
        }

        // Create username from email (before @ symbol)
        const username = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
        
        // Signup with Strapi
        const authResponse = await authService.signup({
          username,
          email: email.trim(),
          password,
          fullName: name.trim(),
          title: title.trim(),
          church: church.trim(),
        });
        
        Alert.alert('Welcome!', `Account created successfully! Welcome, ${authResponse.user.email}`);
        onAuthenticated();
        
      } else if (mode === 'signin') {
        if (!email.trim()) {
          setErrorMessage('Please enter your email');
          return;
        }
        if (!password.trim()) {
          setErrorMessage('Please enter your password');
          return;
        }
        
        // Signin with Strapi
        const authResponse = await authService.signin({
          identifier: email.trim(),
          password,
        });
        
        onAuthenticated();
        
      } else if (mode === 'forgot') {
        if (!email.trim()) {
          setErrorMessage('Please enter your email');
          return;
        }
        
        // Forgot password with Strapi
        await authService.forgotPassword(email.trim());
        Alert.alert('Email Sent', 'Password reset instructions have been sent to your email');
        setMode('signin');
      }
    } catch (error) {
      console.error('Auth error:', error);
      let errorMsg = 'Something went wrong. Please try again.';
      
      if (error instanceof Error) {
        // More specific error messages based on common auth errors
        if (error.message.includes('Invalid login credentials')) {
          errorMsg = 'Invalid email or password. Please check your credentials and try again.';
        } else if (error.message.includes('User not found')) {
          errorMsg = 'No account found with this email address.';
        } else if (error.message.includes('Too many requests')) {
          errorMsg = 'Too many login attempts. Please wait a few minutes before trying again.';
        } else if (error.message.includes('Email not confirmed')) {
          errorMsg = 'Please check your email and click the confirmation link before signing in.';
        } else if (error.message.includes('User already registered')) {
          errorMsg = 'An account with this email already exists. Try signing in instead.';
        } else if (error.message.includes('Network')) {
          errorMsg = 'Network error. Please check your internet connection and try again.';
        } else {
          errorMsg = error.message;
        }
      }
      
      setErrorMessage(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialAuth = (provider: 'google' | 'apple' | 'facebook') => {
    console.log(`Authenticating with ${provider}`);
    // Mock social authentication
    setTimeout(() => {
      onAuthenticated();
    }, 1000);
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.appName}>YouPreacher</Text>
      <Text style={styles.tagline}>
        {mode === 'signin' && 'Sign in to continue'}
        {mode === 'signup' && 'Create your account'}
        {mode === 'forgot' && 'Reset your password'}
      </Text>
    </View>
  );

  const renderForm = () => (
    <Card style={styles.formCard}>
      <View style={styles.formHeader}>
        <Text style={styles.formTitle}>
          {mode === 'signin' && 'Sign In'}
          {mode === 'signup' && 'Create Account'}
          {mode === 'forgot' && 'Reset Password'}
        </Text>
        <Text style={styles.formSubtitle}>
          {mode === 'signin' && 'Welcome back! Sign in to your account'}
          {mode === 'signup' && 'Join thousands of pastors using YouPreacher'}
          {mode === 'forgot' && 'Enter your email to reset your password'}
        </Text>
      </View>

      {errorMessage ? (
        <View style={styles.errorContainer}>
          <View style={styles.errorIconContainer}>
            <Ionicons name="alert-circle" size={16} color={theme.colors.error} />
          </View>
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      ) : null}

      <View style={styles.form}>
        {mode === 'signup' && (
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Full Name *</Text>
            <TextInput
              style={styles.textInput}
              value={name}
              onChangeText={setName}
              placeholder="Enter your full name"
              placeholderTextColor={theme.colors.textTertiary}
              autoCapitalize="words"
              textContentType="name"
            />
          </View>
        )}

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Email Address *</Text>
          <TextInput
            style={styles.textInput}
            value={email}
            onChangeText={setEmail}
            placeholder="Enter your email"
            placeholderTextColor={theme.colors.textTertiary}
            keyboardType="email-address"
            autoCapitalize="none"
            textContentType="emailAddress"
          />
        </View>

        {mode !== 'forgot' && (
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Password *</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                value={password}
                onChangeText={setPassword}
                placeholder="Enter your password"
                placeholderTextColor={theme.colors.textTertiary}
                secureTextEntry={!showPassword}
                textContentType="password"
              />
              <Pressable
                onPress={() => setShowPassword(!showPassword)}
                style={styles.passwordToggle}
              >
                <Ionicons
                  name={showPassword ? 'eye-off' : 'eye'}
                  size={20}
                  color={theme.colors.textTertiary}
                />
              </Pressable>
            </View>
          </View>
        )}

        {mode === 'signup' && (
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Confirm Password *</Text>
            <TextInput
              style={styles.textInput}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirm your password"
              placeholderTextColor={theme.colors.textTertiary}
              secureTextEntry={!showPassword}
              textContentType="password"
            />
          </View>
        )}

        {mode === 'signup' && (
          <>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Title/Position</Text>
              <TextInput
                style={styles.textInput}
                value={title}
                onChangeText={setTitle}
                placeholder="e.g., Senior Pastor, Youth Pastor"
                placeholderTextColor={theme.colors.textTertiary}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Church/Organization</Text>
              <TextInput
                style={styles.textInput}
                value={church}
                onChangeText={setChurch}
                placeholder="Enter your church name"
                placeholderTextColor={theme.colors.textTertiary}
                autoCapitalize="words"
              />
            </View>
          </>
        )}

        {mode === 'signin' && (
          <Pressable
            onPress={() => setMode('forgot')}
            style={styles.forgotPassword}
          >
            <Text style={styles.forgotPasswordText}>Forgot your password?</Text>
          </Pressable>
        )}

        <Button
          title={
            mode === 'signin' ? 'Sign In' : 
            mode === 'signup' ? 'Create Account' : 
            'Send Reset Link'
          }
          onPress={handleSubmit}
          loading={isLoading}
          variant="primary"
          style={{ marginTop: theme.spacing.md }}
        />
      </View>
    </Card>
  );

  const renderSocialAuth = () => null;

  const renderFooter = () => (
    <View style={styles.footer}>
      {mode === 'signin' && (
        <View style={styles.footerOption}>
          <Text style={styles.footerText}>Don&apos;t have an account?</Text>
          <Pressable onPress={() => setMode('signup')}>
            <Text style={styles.footerLink}> Sign up</Text>
          </Pressable>
        </View>
      )}

      {mode === 'signup' && (
        <View style={styles.footerOption}>
          <Text style={styles.footerText}>Already have an account?</Text>
          <Pressable onPress={() => setMode('signin')}>
            <Text style={styles.footerLink}> Sign in</Text>
          </Pressable>
        </View>
      )}

      {mode === 'forgot' && (
        <View style={styles.footerOption}>
          <Text style={styles.footerText}>Remember your password?</Text>
          <Pressable onPress={() => setMode('signin')}>
            <Text style={styles.footerLink}> Sign in</Text>
          </Pressable>
        </View>
      )}

      <View style={styles.legalLinks}>
        <Pressable>
          <Text style={styles.legalLink}>Privacy Policy</Text>
        </Pressable>
        <Text style={styles.legalSeparator}>•</Text>
        <Pressable>
          <Text style={styles.legalLink}>Terms of Service</Text>
        </Pressable>
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {renderHeader()}
        {renderForm()}
        {renderSocialAuth()}
        {renderFooter()}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.xxl,
  },
  header: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
  },
  appName: {
    ...theme.typography.h3,
    color: theme.colors.textPrimary,
    fontWeight: '700',
  },
  tagline: {
    ...theme.typography.body2,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  formCard: {
    marginBottom: theme.spacing.lg,
  },
  formHeader: {
    marginBottom: theme.spacing.lg,
    alignItems: 'center',
  },
  formTitle: {
    ...theme.typography.h3,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
  },
  formSubtitle: {
    ...theme.typography.body2,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  form: {
    gap: theme.spacing.md,
  },
  inputGroup: {
    gap: theme.spacing.sm,
  },
  inputLabel: {
    ...theme.typography.body2,
    color: theme.colors.textPrimary,
    fontWeight: '500',
  },
  textInput: {
    ...theme.typography.body1,
    color: theme.colors.textPrimary,
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.gray300,
    minHeight: 48,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.gray300,
    minHeight: 48,
  },
  passwordInput: {
    ...theme.typography.body1,
    color: theme.colors.textPrimary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    flex: 1,
  },
  passwordToggle: {
    padding: theme.spacing.sm,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
  },
  forgotPasswordText: {
    ...theme.typography.body2,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  socialSection: {
    marginBottom: theme.spacing.lg,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.gray300,
  },
  dividerText: {
    ...theme.typography.body2,
    color: theme.colors.textTertiary,
    paddingHorizontal: theme.spacing.md,
  },
  socialButtons: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  socialButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.gray300,
  },
  socialButtonText: {
    ...theme.typography.body2,
    color: theme.colors.textPrimary,
    fontWeight: '500',
  },
  footer: {
    alignItems: 'center',
    gap: theme.spacing.lg,
  },
  footerOption: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerText: {
    ...theme.typography.body2,
    color: theme.colors.textSecondary,
  },
  footerLink: {
    ...theme.typography.body2,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  legalLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  legalLink: {
    ...theme.typography.caption,
    color: theme.colors.textTertiary,
  },
  legalSeparator: {
    ...theme.typography.caption,
    color: theme.colors.textTertiary,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: theme.colors.error + '10',
    borderColor: theme.colors.error + '40',
    borderWidth: 1,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  errorIconContainer: {
    marginTop: 2,
  },
  errorText: {
    ...theme.typography.body2,
    color: theme.colors.error,
    flex: 1,
    lineHeight: 20,
  },
});
