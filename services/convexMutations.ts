/**
 * Convex mutation helper for repositories
 * Provides typed access to Convex mutations
 */

import { ApiFromModules } from "convex/api";
import type { api as serverApi } from "../convex/_generated/api";

// Type-safe API client
export type Api = ApiFromModules<typeof serverApi>;

// Helper to call Convex mutations
// Note: This will be used by repositories to sync data to Convex
export async function syncToConvex(
  mutationFn: (args: any) => Promise<any>,
  args: any
): Promise<any> {
  try {
    // TODO: Get Convex client instance
    // For now, this is a placeholder that will be called from repositories
    const result = await mutationFn(args);
    return result;
  } catch (error) {
    console.error('Convex sync error:', error);
    throw error;
  }
}

// Helper to check if user is authenticated with Clerk
export async function isConvexAuthenticated(): Promise<boolean> {
  // TODO: Check Clerk auth state via Convex
  return false;
}

