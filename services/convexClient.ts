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
  const { getToken, userId } = useClerkAuth();

  useEffect(() => {
    if (!userId) {
      convexClient.setAuth(async () => null);
      return;
    }

    // Set auth function that fetches Clerk JWT token
    convexClient.setAuth(async () => {
      try {
        const token = await getToken({ template: "convex" });
        return token;
      } catch (error) {
        console.error("Failed to get Clerk token for Convex:", error);
        return null;
      }
    });
  }, [userId, getToken]);
}


