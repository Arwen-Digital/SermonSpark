import { theme } from '@/constants/Theme';
import { useAuth, useSignIn } from '@clerk/clerk-expo';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

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
  const [isProcessing, setIsProcessing] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

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

      if (result && result.status === 'complete') {
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

