import { theme } from '@/constants/Theme';
import { useAuth, useSSO, useSignIn, useSignUp } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import React, { useCallback, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Button } from '../common/Button';
import { Card } from '../common/Card';

WebBrowser.maybeCompleteAuthSession();

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

  const { isSignedIn } = useAuth();
  const { signIn, isLoaded: signInLoaded } = useSignIn();
  const { signUp, isLoaded: signUpLoaded } = useSignUp();
  const { startSSOFlow } = useSSO();
  const buildTemporaryPassword = useCallback(() => {
    const timestampChunk = Date.now().toString(36);
    const randomChunk = Math.random().toString(36).slice(2, 10);
    return `Tmp!${timestampChunk}${randomChunk}`;
  }, []);

  const handleGoogleAuth = async () => {
    try {
      setIsLoading(true);
      setErrorMessage('');
      
      console.log('[OAuth] Starting Google OAuth flow...');
      
      const { createdSessionId, setActive, signIn: oauthSignIn, signUp: oauthSignUp } = await startSSOFlow({ strategy: 'oauth_google' });
      console.log('[OAuth] startSSOFlow result', {
        createdSessionId,
        setActive: !!setActive,
        oauthSignInStatus: oauthSignIn?.status,
        oauthSignUpStatus: oauthSignUp?.status,
        oauthSignInSupportedFirstFactors: oauthSignIn?.supportedFirstFactors?.map(f => f.strategy),
      });
      
      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
        onAuthenticated();
        return;
      }

      if (oauthSignIn?.status === 'needs_new_password') {
        const cleanedPassword = password.trim();
        const passwordToSet = cleanedPassword.length >= 8 ? cleanedPassword : buildTemporaryPassword();
        if (cleanedPassword.length < 8) {
          console.warn('[OAuth] Generating temporary password to satisfy Clerk new-password requirement.');
        }

        const resetResult = await oauthSignIn.resetPassword({
          password: passwordToSet,
          signOutOfOtherSessions: true,
        });

        console.log('[OAuth] resetPassword result', {
          status: resetResult.status,
          createdSessionId: resetResult.createdSessionId,
        });

        if (resetResult.status === 'complete' && resetResult.createdSessionId && setActive) {
          await setActive({ session: resetResult.createdSessionId });
          if (cleanedPassword.length < 8) {
            Alert.alert(
              'Password Reset Required',
              'Your account needed a new password. We applied a temporary one so Google sign-in can continue. You can set your own password later from Profile → Privacy & Security.'
            );
          }
          onAuthenticated();
          return;
        }

        setErrorMessage('We could not finish resetting your password automatically. Please try again or use email sign-in to set a new password.');
        return;
      }

      if (oauthSignIn || oauthSignUp) {
        setErrorMessage('Additional verification is required to finish signing in. Please complete the flow in the email we sent.');
        return;
      }

      setErrorMessage('Google did not return a session. Please try again.');
    } catch (error: any) {
      console.error('Google OAuth error:', error);
      let errorMsg = 'Failed to authenticate with Google. Please try again.';
      
      if (error?.errors?.[0]?.message) {
        errorMsg = error.errors[0].message;
      } else if (error?.message) {
        errorMsg = error.message;
      }
      
      setErrorMessage(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setErrorMessage('');
    
    try {
      if (mode === 'signup') {
        if (!signUpLoaded) {
          setErrorMessage('Please wait while we initialize...');
          return;
        }

        // Validation
        if (!name.trim()) {
          setErrorMessage('Please enter your name');
          setIsLoading(false);
          return;
        }
        if (!email.trim()) {
          setErrorMessage('Please enter your email');
          setIsLoading(false);
          return;
        }
        if (!password.trim()) {
          setErrorMessage('Please enter a password');
          setIsLoading(false);
          return;
        }
        if (password !== confirmPassword) {
          setErrorMessage('Passwords do not match');
          setIsLoading(false);
          return;
        }
        if (password.length < 8) {
          setErrorMessage('Password must be at least 8 characters');
          setIsLoading(false);
          return;
        }

        // Signup with Clerk
        const result = await signUp.create({
          emailAddress: email.trim(),
          password: password,
          firstName: name.trim().split(' ')[0],
          lastName: name.trim().split(' ').slice(1).join(' ') || '',
          unsafeMetadata: {
            title: title.trim(),
            church: church.trim(),
          },
        });

        // Send verification email
        await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
        
        Alert.alert(
          'Verification Required',
          'Please check your email to verify your account before signing in.'
        );
        
        setMode('signin');
        
      } else if (mode === 'signin') {
        if (!signInLoaded) {
          setErrorMessage('Please wait while we initialize...');
          return;
        }

        if (!email.trim()) {
          setErrorMessage('Please enter your email');
          setIsLoading(false);
          return;
        }
        if (!password.trim()) {
          setErrorMessage('Please enter your password');
          setIsLoading(false);
          return;
        }
        
        // Signin with Clerk
        await signIn.create({
          identifier: email.trim(),
          password: password,
        });
        
        onAuthenticated();
        
      } else if (mode === 'forgot') {
        if (!signInLoaded) {
          setErrorMessage('Please wait while we initialize...');
          setIsLoading(false);
          return;
        }

        if (!email.trim()) {
          setErrorMessage('Please enter your email');
          setIsLoading(false);
          return;
        }
        
        // Forgot password with Clerk
        await signIn.attemptFirstFactor({
          strategy: 'reset_password_email_code',
          identifier: email.trim(),
        });
        
        Alert.alert('Email Sent', 'Password reset instructions have been sent to your email');
        setMode('signin');
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      let errorMsg = 'Something went wrong. Please try again.';
      
      if (error?.errors?.[0]?.message) {
        errorMsg = error.errors[0].message;
      } else if (error?.message) {
        errorMsg = error.message;
      }
      
      setErrorMessage(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const renderHeader = () => (
    <View style={styles.header}>
      {/* <Text style={styles.appName}>YouPreacher</Text>
      <Text style={styles.tagline}>
        {mode === 'signin' && 'Sign in to continue'}
        {mode === 'signup' && 'Create your account'}
        {mode === 'forgot' && 'Reset your password'}
      </Text> */}
    </View>
  );

  const renderForm = () => (
    <Card style={styles.formCard}>
      <View style={styles.formHeader}>
        <Text style={styles.formTitle}>
          {mode === 'signin' && 'Welcome Back'}
          {mode === 'signup' && 'Create Your Account'}
          {mode === 'forgot' && 'Reset Password'}
        </Text>
        <Text style={styles.formSubtitle}>
          {mode === 'signin' && 'Sign in to access premium features and sync your content'}
          {mode === 'signup' && 'Join the community and unlock AI-powered tools'}
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

      {/* Google OAuth Button - only show in signin and signup modes */}
      {mode !== 'forgot' && (
        <>
          <Pressable
            style={styles.socialButton}
            onPress={handleGoogleAuth}
            disabled={isLoading}
          >
            <Ionicons name="logo-google" size={20} color="#DB4437" />
            <Text style={styles.socialButtonText}>
              Continue with Google
            </Text>
          </Pressable>

          {/* Divider */}
          <View style={styles.dividerContainer}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.divider} />
          </View>
        </>
      )}

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
