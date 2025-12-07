# Implementation Plan

- [ ] 1. Set up authentication infrastructure and dependencies
  - Install required packages: bcryptjs, jsonwebtoken, fast-check
  - Create convex/lib/auth.ts for auth helper functions
  - Set up JWT secret in environment variables
  - _Requirements: 5.1, 5.5, 3.1_

- [ ] 2. Implement password security utilities
  - Write hashPassword() function using bcryptjs with cost factor 10
  - Write verifyPassword() function with constant-time comparison
  - Write validatePassword() function to check strength requirements (min 8 chars, uppercase, lowercase, number)
  - Create weak password list and rejection logic
  - _Requirements: 5.1, 5.2, 5.4, 5.5, 9.1, 9.2, 9.3_

- [ ] 2.1 Write property test for password hashing
  - **Property 2: Password hashing security**
  - **Validates: Requirements 1.2, 5.1, 5.2, 5.4**

- [ ] 3. Implement JWT token utilities
  - Write generateJWT() function to create tokens with userId, iat, exp
  - Write verifyJWT() function to validate signature and expiration
  - Write requireAuth() helper to extract userId from authenticated requests
  - _Requirements: 3.1, 3.2, 3.4, 10.1, 10.4_

- [ ] 3.1 Write property test for JWT generation and validation
  - **Property 8: JWT token validation**
  - **Validates: Requirements 3.2, 3.4, 10.1, 10.3, 10.4**

- [ ] 4. Update Convex schema for custom auth
  - Add users table with email, username, passwordHash, authProvider, googleId, emailVerified, timestamps
  - Add indexes: by_email, by_username, by_google_id
  - Update profiles table userId field documentation (now references users._id)
  - _Requirements: 1.4, 4.3, 6.1, 6.2, 6.3_

- [ ] 5. Implement input validation utilities
  - Write validateEmail() function for email format validation
  - Write validateUsername() function for username format and length
  - Create validation error response helpers
  - _Requirements: 1.1, 4.1, 7.1, 9.4_

- [ ] 5.1 Write property test for email and password validation
  - **Property 1: Email and password validation**
  - **Validates: Requirements 1.1, 9.1, 9.2, 9.3, 9.4, 9.5**

- [ ] 6. Implement user registration mutation
  - Create convex/auth.ts with register() mutation
  - Validate email, password, and optional username
  - Check email uniqueness
  - Check username uniqueness if provided
  - Hash password and create user record
  - Generate JWT token
  - Return { token, user } response
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 4.1, 4.2, 4.3, 4.4_

- [ ] 6.1 Write property test for email uniqueness
  - **Property 3: Email uniqueness enforcement**
  - **Validates: Requirements 1.3**

- [ ] 6.2 Write property test for user record completeness
  - **Property 4: User record completeness**
  - **Validates: Requirements 1.4, 6.2**

- [ ] 6.3 Write property test for registration JWT validity
  - **Property 5: Registration returns valid JWT**
  - **Validates: Requirements 1.5, 2.4, 3.1, 6.5**

- [ ] 6.4 Write property test for username handling
  - **Property 11: Username validation and uniqueness**
  - **Validates: Requirements 4.1, 4.2, 4.3, 4.4**

- [ ] 7. Implement user login mutation
  - Create login() mutation in convex/auth.ts
  - Query user by email
  - Verify password hash
  - Return generic error for invalid credentials (don't reveal if email exists)
  - Generate JWT token on success
  - Return { token, user } with username if present
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 4.5, 7.2_

- [ ] 7.1 Write property test for login credential verification
  - **Property 6: Login credential verification**
  - **Validates: Requirements 2.1, 2.2, 2.5**

- [ ] 7.2 Write property test for invalid credentials rejection
  - **Property 7: Invalid credentials rejection**
  - **Validates: Requirements 2.3, 7.2**

- [ ] 7.3 Write property test for username in auth response
  - **Property 12: Username in auth response**
  - **Validates: Requirements 4.5**

- [ ] 8. Implement getCurrentUser query
  - Create getCurrentUser() query in convex/auth.ts
  - Use requireAuth() to extract userId from JWT
  - Fetch and return user data (excluding passwordHash)
  - Handle unauthorized errors
  - _Requirements: 3.2, 3.4, 10.1, 10.3_

- [ ] 8.1 Write unit test for expired token rejection
  - Test that expired tokens are rejected with unauthorized error
  - _Requirements: 3.3, 7.3_

- [ ] 9. Create client-side auth context
  - Create hooks/useAuth.tsx with AuthProvider component
  - Implement state management for user, token, isAuthenticated, isLoading
  - Load token from AsyncStorage on mount
  - Implement login() method that calls Convex mutation and stores token
  - Implement register() method that calls Convex mutation and stores token
  - Implement logout() method that clears token from AsyncStorage
  - Implement refreshUser() method to fetch current user data
  - _Requirements: 3.5, 8.1, 8.2, 8.3, 8.5_

- [ ] 9.1 Write property test for logout clearing session
  - **Property 10: Logout clears client session**
  - **Validates: Requirements 3.5**

- [ ] 9.2 Write property test for auth state change notification
  - **Property 14: Auth state change notification**
  - **Validates: Requirements 8.2**

- [ ] 10. Configure Convex client with JWT authentication
  - Update services/convexClient.ts to configure ConvexReactClient with auth
  - Implement getToken function that retrieves JWT from AsyncStorage
  - Remove Clerk-specific configuration
  - _Requirements: 3.2, 10.4_

- [ ] 11. Create authentication UI components
  - Create components/auth/LoginScreen.tsx with email/password form
  - Create components/auth/RegisterScreen.tsx with email/password/username form
  - Display validation errors from auth mutations
  - Show loading states during authentication
  - Handle success/error responses
  - _Requirements: 7.1, 7.3, 9.4_

- [ ] 11.1 Write property test for validation error specificity
  - **Property 13: Validation error specificity**
  - **Validates: Requirements 7.1, 9.4**

- [ ] 12. Implement protected route guards
  - Create components/auth/ProtectedRoute.tsx component
  - Check authentication state from useAuth hook
  - Show loading screen while checking auth
  - Redirect to login if not authenticated
  - Render children if authenticated
  - _Requirements: 8.4, 10.2_

- [ ] 12.1 Write property test for protected route enforcement
  - **Property 15: Protected route enforcement**
  - **Validates: Requirements 8.4, 10.2**

- [ ] 13. Update existing Convex mutations to use custom auth
  - Update series mutations to use requireAuth() helper
  - Update sermons mutations to use requireAuth() helper
  - Update profiles mutations to use requireAuth() helper
  - Update community mutations to use requireAuth() helper
  - Replace Clerk userId extraction with custom auth userId
  - _Requirements: 10.1, 10.2, 10.3, 10.5_

- [ ] 13.1 Write property test for auth error propagation
  - **Property 16: Auth error propagation**
  - **Validates: Requirements 10.5**

- [ ] 14. Remove Clerk dependencies
  - Remove @clerk/clerk-expo from package.json
  - Delete services/clerkAuth.ts
  - Delete components/auth/ClerkSignInModal.tsx
  - Delete components/auth/AuthScreen.tsx (old Clerk version)
  - Update app/_layout.tsx to remove ClerkProvider
  - Remove useConvexClerkAuth hook from services/convexClient.ts
  - Update all components using useAuth from Clerk to use custom useAuth
  - _Requirements: All (migration from Clerk)_

- [ ] 15. Update app routing and navigation
  - Update app/_layout.tsx to use AuthProvider
  - Create auth routes: /auth/login, /auth/register
  - Wrap protected routes with ProtectedRoute component
  - Handle initial auth state loading
  - Redirect logic for authenticated/unauthenticated users
  - _Requirements: 8.1, 8.3, 8.4_

- [ ] 16. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 17. Create migration utilities (optional for existing users)
  - Create scripts/migrateClerkUsers.ts script
  - Export Clerk user data
  - Map Clerk userIds to new custom userIds
  - Update all related records with new userIds
  - Document migration process
  - _Requirements: All (migration from Clerk)_

- [ ] 18. Update documentation
  - Update README.md with custom auth setup instructions
  - Document environment variables (JWT_SECRET)
  - Add authentication flow diagrams
  - Document API endpoints (register, login, getCurrentUser)
  - Add troubleshooting guide
  - _Requirements: All_

- [ ] 19. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
