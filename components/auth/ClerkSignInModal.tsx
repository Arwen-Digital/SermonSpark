import { theme } from '@/constants/Theme';
import { useAuth, useSSO, useSignIn } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

WebBrowser.maybeCompleteAuthSession();

interface ClerkSignInModalProps {
  visible: boolean;
  onClose: () => void;
  onAuthSuccess: () => void;
}

export const ClerkSignInModal: React.FC<ClerkSignInModalProps> = ({
  visible,
  onClose,
  onAuthSuccess,
}) => {
  const { isSignedIn } = useAuth();
  const { signIn, setActive, isLoaded } = useSignIn();
  const { startSSOFlow } = useSSO();
  const [isProcessing, setIsProcessing] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const buildTemporaryPassword = useCallback(() => {
    const timestampChunk = Date.now().toString(36);
    const randomChunk = Math.random().toString(36).slice(2, 10);
    return `Tmp!${timestampChunk}${randomChunk}`;
  }, []);

  // Check if user just signed in
  useEffect(() => {
    if (visible && isSignedIn) {
      handleAuthSuccess();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, isSignedIn]);

  const handleSignIn = async () => {
    // If already signed in, just proceed
    if (isSignedIn) {
      await handleAuthSuccess();
      return;
    }
    if (!email.trim() || !password.trim()) {
      setErrorMessage('Please enter both email and password');
      return;
    }

    if (!isLoaded) {
      setErrorMessage('Please wait while we initialize...');
      return;
    }

    setIsProcessing(true);
    setErrorMessage('');

    try {
      const result = await signIn?.create({
        identifier: email.trim(),
        password,
      });

      if (result?.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        handleAuthSuccess();
      } else {
        // Handle multi-factor or additional verification
        setErrorMessage('Additional verification required');
      }
    } catch (error: any) {
      console.error('Sign in error:', error);
      const errorMsg = error?.errors?.[0]?.message || error?.message || 'Sign in failed';
      setErrorMessage(errorMsg);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAuthSuccess = async () => {
    setIsProcessing(true);
    
    try {
      // Give a moment for auth state to propagate
      await new Promise(resolve => setTimeout(resolve, 500));
      
      onAuthSuccess();
      onClose();
      
      Alert.alert('Logged In', 'You have successfully logged in. Sync will now proceed.');
    } catch (error: any) {
      Alert.alert('Error', 'Failed to complete login: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGoogleAuth = async () => {
    try {
      setIsProcessing(true);
      setErrorMessage('');

      const { createdSessionId, setActive: oauthSetActive, signIn: oauthSignIn, signUp: oauthSignUp } = await startSSOFlow({
        strategy: 'oauth_google',
      });

      if (createdSessionId && oauthSetActive) {
        await oauthSetActive({ session: createdSessionId });
        await handleAuthSuccess();
        return;
      }

      if (oauthSignIn?.status === 'needs_new_password') {
        const cleanedPassword = password.trim();
        const passwordToSet = cleanedPassword.length >= 8 ? cleanedPassword : buildTemporaryPassword();
        if (cleanedPassword.length < 8) {
          console.warn('[Sync OAuth] Generating temporary password for Clerk reset flow.');
        }

        const resetResult = await oauthSignIn.resetPassword({
          password: passwordToSet,
          signOutOfOtherSessions: true,
        });

        if (resetResult.status === 'complete' && resetResult.createdSessionId && oauthSetActive) {
          await oauthSetActive({ session: resetResult.createdSessionId });
          if (cleanedPassword.length < 8) {
            Alert.alert(
              'Password Reset Applied',
              'We set a temporary password to finish Google sign-in. You can update it later from Profile → Privacy & Security.'
            );
          }
          await handleAuthSuccess();
          return;
        }

        setErrorMessage('We could not complete the password reset automatically. Please retry or use email sign-in.');
        return;
      }

      if (oauthSignIn || oauthSignUp) {
        setErrorMessage('Additional verification is required to finish signing in. Please check your email.');
        return;
      }

      setErrorMessage('Google did not return a session. Please try again.');
    } catch (error: any) {
      console.error('Google OAuth error (sync modal):', error);
      const message = error?.errors?.[0]?.message || error?.message || 'Failed to authenticate with Google.';
      setErrorMessage(message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Sign In to Sync</Text>
          <Pressable onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>Close</Text>
          </Pressable>
        </View>

        {isProcessing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>
              {isSignedIn ? 'Completing login...' : 'Signing in...'}
            </Text>
          </View>
        ) : (
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.signInContainer}
          >
            <Text style={styles.description}>
              Sign in to sync your data across devices and access your content from anywhere.
            </Text>
            {isSignedIn ? (
              <>
              <Text style={styles.description}>You&apos;re already signed in.</Text>
                <Pressable
                  style={styles.signInButton}
                  onPress={handleAuthSuccess}
                >
                  <Text style={styles.signInButtonText}>Sync now</Text>
                </Pressable>
              </>
            ) : (
              <>
            <Pressable
              style={[styles.socialButton, isProcessing && styles.socialButtonDisabled]}
              onPress={handleGoogleAuth}
              disabled={isProcessing}
            >
              <Ionicons name="logo-google" size={20} color="#DB4437" />
              <Text style={styles.socialButtonText}>Continue with Google</Text>
            </Pressable>

            <View style={styles.dividerContainer}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.divider} />
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                placeholderTextColor={theme.colors.textSecondary}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                editable={!isProcessing}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                placeholderTextColor={theme.colors.textSecondary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoComplete="password"
                editable={!isProcessing}
              />
            </View>

            {errorMessage ? (
              <Text style={styles.error}>{errorMessage}</Text>
            ) : null}

            <Pressable
              style={[
                styles.signInButton,
                (!email || !password) && styles.signInButtonDisabled
              ]}
              onPress={handleSignIn}
              disabled={!email || !password || isProcessing}
            >
              <Text style={styles.signInButtonText}>Sign In</Text>
            </Pressable>

            <Pressable
              onPress={() => {
                // Navigate to simple sign-up page
                onClose();
                router.push('/signup');
              }}
            >
              <Text style={styles.linkText}>Don&apos;t have an account? Sign up →</Text>
            </Pressable>

            <Pressable
              onPress={() => {
                // Fallback: navigate to full auth screen
                onClose();
                router.push('/auth');
              }}
            >
              <Text style={styles.linkText}>Or use full sign-in screen →</Text>
            </Pressable>
              </>
            )}
          </KeyboardAvoidingView>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray200,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 16,
    color: theme.colors.primary,
  },
  description: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginBottom: 24,
    paddingHorizontal: 20,
    textAlign: 'center',
  },
  signInContainer: {
    flex: 1,
    paddingTop: 20,
    paddingHorizontal: 20,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.gray300,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: theme.colors.textPrimary,
    backgroundColor: theme.colors.background,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.gray300,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: theme.colors.background,
    marginBottom: 16,
  },
  socialButtonDisabled: {
    opacity: 0.6,
  },
  socialButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginLeft: 8,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.gray300,
  },
  dividerText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginHorizontal: 12,
    fontWeight: '600',
  },
  error: {
    color: '#ef4444',
    fontSize: 14,
    marginBottom: 16,
    marginHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  signInButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    alignSelf: 'stretch',
    marginBottom: 16,
  },
  signInButtonDisabled: {
    backgroundColor: theme.colors.gray300,
    opacity: 0.5,
  },
  signInButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  linkText: {
    fontSize: 14,
    color: theme.colors.primary,
    textAlign: 'center',
  },
});

