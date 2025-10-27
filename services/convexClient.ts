import { useAuth as useClerkAuth } from "@clerk/clerk-expo";
import { ConvexReactClient } from "convex/react";
import Constants from "expo-constants";
import { useEffect } from "react";

// Initialize Convex client
const convexUrl = process.env.EXPO_PUBLIC_CONVEX_URL || Constants.expoConfig?.extra?.convexUrl || "";

export const convexClient = new ConvexReactClient(convexUrl);

// Export typed API client
export const convex = convexClient;

// Hook to sync Clerk auth with Convex (must be used in component within ClerkProvider)
export function useConvexClerkAuth() {
  const { getToken, userId, isLoaded, isSignedIn } = useClerkAuth();

  useEffect(() => {
    console.log('ConvexClerkAuth hook:', { userId, isLoaded, isSignedIn });
    
    if (!isLoaded) {
      console.log('Clerk not loaded yet, skipping auth setup');
      return;
    }
    
    // Check if user is supposed to be signed in by checking AsyncStorage
    if (userId === null && isSignedIn === false) {
      console.log('No userId and not signed in');
      // Before clearing, check if there's a cached session
      import('@react-native-async-storage/async-storage').then(AsyncStorage => {
        AsyncStorage.default.getAllKeys().then(keys => {
          const clerkKeys = keys.filter(k => k.includes('clerk') || k.includes('@clerk'));
          console.log('AsyncStorage keys with "clerk" or "@clerk":', clerkKeys);
          if (clerkKeys.length === 0) {
            console.log('No Clerk session data in AsyncStorage');
          } else {
            console.log(`Found ${clerkKeys.length} Clerk-related keys in AsyncStorage`);
          }
        });
      }).catch(() => {});
      
      convexClient.setAuth(async () => null);
      return;
    }
    
    if (!userId) {
      console.log('No userId, clearing Convex auth');
      convexClient.setAuth(async () => null);
      return;
    }

    console.log('Setting up Convex auth for userId:', userId);
    // Set auth function that fetches Clerk JWT token
    convexClient.setAuth(async () => {
      try {
        const token = await getToken({ template: "convex" });
        console.log('Got Convex token, length:', token?.length);
        return token;
      } catch (error) {
        console.error("Failed to get Clerk token for Convex:", error);
        return null;
      }
    });
  }, [userId, getToken, isLoaded, isSignedIn]);
}


