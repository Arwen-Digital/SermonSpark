import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { ConvexProvider } from 'convex/react';
import { useFonts } from 'expo-font';
import { Stack, usePathname, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { Platform, View } from 'react-native';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { theme } from '@/constants/Theme';
import { useColorScheme } from '@/hooks/useColorScheme';
import authSession from '@/services/authSession';
import { convexClient } from '@/services/convexClient';
import { AuthProvider, useAuth } from '@/services/customAuth';
import { initDb } from '@/services/db/index.native';

// Inner component to handle auth state changes
function AppContent() {
  const { isSignedIn, user, isLoading } = useAuth();

  React.useEffect(() => {
    if (isLoading) {
      console.log('Auth loading...');
      return;
    }

    console.log('Auth state changed:', { isSignedIn, userId: user?.id });

    if (isSignedIn && user) {
      console.log('User is signed in with ID:', user.id);
      // Sync user ID to local cache
      authSession.cacheUserId(user.id);
    } else {
      console.log('User is NOT signed in');
    }
  }, [isSignedIn, user, isLoading]);

  return <></>;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  const router = useRouter();
  const pathname = usePathname();
  const [dbInitialized, setDbInitialized] = React.useState(false);

  React.useEffect(() => {
    let mounted = true;
    const initializeApp = async () => {
      try {
        // Initialize SQLite database immediately on app start
        await initDb();
        console.log('SQLite DB initialized');

        // Initialize auth session cache/listener (keeps userId cached for offline use)
        authSession.initAuthSession();

        // Perform local authentication check first (no API calls)
        try {
          const isOfflineAuth = await authSession.isAuthenticatedOffline();
          if (isOfflineAuth) {
            console.log('User authenticated offline');
          } else {
            console.log('User not authenticated - allowing offline access');
            // Generate anonymous user for fresh installs
            await authSession.generateAnonymousUserId();
            console.log('Generated anonymous user for offline access');
          }
        } catch (error) {
          console.log('Authentication check failed - allowing offline access:', error);
        }

        if (mounted) {
          setDbInitialized(true);

          // Only redirect from auth screen if user is already authenticated with a real account
          if (pathname === '/auth') {
            try {
              console.log('Checking if user is authenticated online...');
              const isOnlineAuth = await authSession.isAuthenticatedOnline();
              console.log('Online authentication status:', isOnlineAuth);
              if (isOnlineAuth) {
                console.log('User is authenticated online, redirecting to home');
                router.replace('/(tabs)/home');
              } else {
                console.log('User not authenticated online, staying on auth page');
              }
            } catch (error) {
              console.log('Auth check failed, staying on auth page:', error);
              // Stay on auth screen if check fails
            }
          }
        }
      } catch (error) {
        console.error('App initialization failed:', error);
        if (mounted) {
          setDbInitialized(true); // Allow app to continue even if init fails
        }
      }
    };

    initializeApp();

    return () => {
      mounted = false;
    };
  }, [pathname, router]);

  if (!loaded || !dbInitialized) {
    // Show loading only for fonts and database initialization
    return null;
  }

  const content = (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="auth" options={{ headerShown: false }} />
      <Stack.Screen name="sermon/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="sermon/edit/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="sermon/create" options={{ headerShown: false }} />
      <Stack.Screen name="community/[postId]" options={{ headerShown: false }} />
      <Stack.Screen name="community/create" options={{ headerShown: false }} />
      <Stack.Screen name="profile/privacy-security" options={{ headerShown: false }} />
      <Stack.Screen name="research/sermon-title-generator" options={{ headerShown: false }} />
      <Stack.Screen name="research/outline-generator" options={{ headerShown: false }} />
      <Stack.Screen name="research/illustration-finder" options={{ headerShown: false }} />
      <Stack.Screen name="research/historical-context" options={{ headerShown: false }} />
      <Stack.Screen name="research/original-language-study" options={{ headerShown: false }} />
      <Stack.Screen name="research/discussion-questions" options={{ headerShown: false }} />
      <Stack.Screen name="research/topic-explorer" options={{ headerShown: false }} />
      <Stack.Screen name="research/social-media-post-ideas" options={{ headerShown: false }} />
      <Stack.Screen name="research/blog-post-ideas" options={{ headerShown: false }} />
      <Stack.Screen
        name="series/index"
        options={{
          headerShown: false,
          // When we call router.replace from My Series back button,
          // animate like a back/pop (slide to the right on iOS)
          animationTypeForReplace: 'pop',
        }}
      />
      <Stack.Screen name="series/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="series/create" options={{ headerShown: false }} />
      <Stack.Screen name="series/[id]/edit" options={{ headerShown: false }} />
      <Stack.Screen name="pulpit/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="+not-found" />
    </Stack>
  );

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AppContent />
        <ConvexProvider client={convexClient}>
          <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <View style={Platform.select({
              web: {
                flex: 1,
                backgroundColor: theme.colors.background
              },
              default: { flex: 1 }
            })}>
              {Platform.OS === 'web' ? (
                <View style={{ flex: 1, maxWidth: 1200, alignSelf: 'center', width: '100%' }}>
                  {content}
                </View>
              ) : (
                content
              )}
            </View>
            <StatusBar style="auto" />
          </ThemeProvider>
        </ConvexProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
