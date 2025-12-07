/**
 * Convex Client Configuration
 * 
 * This module initializes and exports the Convex client.
 * Authentication is handled by the custom AuthProvider in services/customAuth.tsx
 */

import { ConvexReactClient } from "convex/react";
import Constants from "expo-constants";

// Initialize Convex client
const convexUrl = process.env.EXPO_PUBLIC_CONVEX_URL || Constants.expoConfig?.extra?.convexUrl || "";

export const convexClient = new ConvexReactClient(convexUrl);

// Export typed API client
export const convex = convexClient;
