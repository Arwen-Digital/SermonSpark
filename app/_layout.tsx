import { ClerkProvider, useAuth as useClerkAuth } from '@clerk/clerk-expo';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { ConvexProvider } from 'convex/react';
import Constants from 'expo-constants';
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
import { clerkTokenCache } from '@/services/clerkTokenCache';
import { convexClient, useConvexClerkAuth } from '@/services/convexClient';
import { initDb } from '@/services/db/index.native';

// Inner component to access Clerk hooks
function AppContent() {
  const { isSignedIn, userId, isLoaded } = useClerkAuth();
  useConvexClerkAuth(); // Sync Clerk token with Convex client
  
  // Track if we've logged the initial state
  const hasLoggedInitialState = React.useRef(false);
  const [hasCheckedLocalUserId, setHasCheckedLocalUserId] = React.useState(false);
  
  // Check if there's a cached user ID from SQLite on first load
  React.useEffect(() => {
    const checkLocalUserId = async () => {
      if (hasCheckedLocalUserId || !isLoaded) return;
      
      try {
        const cachedUserId = await authSession.getCachedUserId();
        console.log('Checking for cached Clerk user ID:', cachedUserId);
        
        if (cachedUserId && !cachedUserId.startsWith('anon_')) {
          console.log('Found cached Clerk user ID from SQLite:', cachedUserId);
          // We have a user ID in SQLite, but Clerk doesn't have it
          // This means the session was lost on app restart
          // We'll need to prompt user to log in again
          console.log('WARNING: Clerk session lost. User needs to login again.');
        }
        setHasCheckedLocalUserId(true);
      } catch (error) {
        console.error('Error checking local user ID:', error);
        setHasCheckedLocalUserId(true);
      }
    };
    
    checkLocalUserId();
  }, [isLoaded, hasCheckedLocalUserId]);
  
  React.useEffect(() => {
    if (!isLoaded) {
      console.log('Clerk not loaded yet...');
      return;
    }
    
    // Log the initial loaded state once
    if (!hasLoggedInitialState.current) {
      console.log('Clerk initial load complete:', { isSignedIn, userId });
      hasLoggedInitialState.current = true;
    }
    
    console.log('Auth state changed:', { isSignedIn, userId });
    
    if (isSignedIn && userId) {
      console.log('User is signed in with ID:', userId);
      // User just logged in, sync their ID to local
      authSession.syncClerkUserToLocal(userId);
    } else if (isSignedIn === false && userId === null && isLoaded) {
      console.log('User is NOT signed in (session not found)');
    }
  }, [isSignedIn, userId, isLoaded]);
  
  return <></>;
}

// Get Clerk publishable key from environment
const clerkPublishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY || Constants.expoConfig?.extra?.clerkPublishableKey || '';



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
      <ClerkProvider publishableKey={clerkPublishableKey} tokenCache={clerkTokenCache as any}>
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
      </ClerkProvider>
    </SafeAreaProvider>
  );
}
