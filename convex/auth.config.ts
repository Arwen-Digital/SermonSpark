/**
 * Convex Auth Configuration
 * 
 * This project uses custom JWT authentication instead of Clerk.
 * Authentication is handled via:
 * - convex/auth/index.ts - Main auth actions (signUp, signIn, etc.)
 * - JWT tokens generated and verified using jose library
 * - Token passed to Convex client via setAuth()
 * 
 * No external auth providers are configured here.
 */

export default {
  providers: [],
};
