# Custom Convex Authentication System - Design Document

## Overview

This design document outlines a custom authentication system built on Convex as the primary backend, replacing the existing Clerk authentication implementation. The system provides secure username/email/password authentication using JWT tokens for session management, with an extensible architecture to support future OAuth providers like Google Authentication.

The authentication system is designed to be:
- **Secure**: Using industry-standard password hashing (bcrypt) and JWT tokens
- **Stateless**: JWT-based authentication without server-side session storage
- **Extensible**: Modular architecture ready for OAuth provider integration
- **Integrated**: Seamless integration with Convex queries and mutations
- **User-friendly**: Clear error messages and smooth authentication flows

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     React Native App                         │
│  ┌──────────────────────────────────────────────────────┐   │
│  │           Auth Context Provider                       │   │
│  │  - Current user state                                 │   │
│  │  - JWT token management                               │   │
│  │  - Auth methods (login, register, logout)            │   │
│  └──────────────────────────────────────────────────────┘   │
│                           │                                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │           Convex React Client                         │   │
│  │  - Authenticated queries/mutations                    │   │
│  │  - JWT token injection                                │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTPS + JWT
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                     Convex Backend                           │
│  ┌──────────────────────────────────────────────────────┐   │
│  │           Auth Mutations                              │   │
│  │  - register()                                         │   │
│  │  - login()                                            │   │
│  │  - validateToken()                                    │   │
│  └──────────────────────────────────────────────────────┘   │
│                           │                                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │           Auth Helpers                                │   │
│  │  - requireAuth()                                      │   │
│  │  - hashPassword()                                     │   │
│  │  - verifyPassword()                                   │   │
│  │  - generateJWT()                                      │   │
│  │  - verifyJWT()                                        │   │
│  └──────────────────────────────────────────────────────┘   │
│                           │                                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │           Database Tables                             │   │
│  │  - users                                              │   │
│  │  - user_profiles (optional extended data)            │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Authentication Flow

**Registration Flow:**
```
User → Register Form → Auth Context → Convex register() mutation
                                           │
                                           ├─ Validate input
                                           ├─ Check email uniqueness
                                           ├─ Hash password (bcrypt)
                                           ├─ Create user record
                                           ├─ Generate JWT token
                                           └─ Return { token, user }
                                           
← JWT stored in AsyncStorage ← Auth Context updates state ← User
```

**Login Flow:**
```
User → Login Form → Auth Context → Convex login() mutation
                                        │
                                        ├─ Find user by email
                                        ├─ Verify password hash
                                        ├─ Generate JWT token
                                        └─ Return { token, user }
                                        
← JWT stored in AsyncStorage ← Auth Context updates state ← User
```

**Authenticated Request Flow:**
```
User → Protected Action → Convex Client (injects JWT) → Convex mutation/query
                                                              │
                                                              ├─ Extract JWT from request
                                                              ├─ Verify JWT signature
                                                              ├─ Check expiration
                                                              ├─ Extract userId
                                                              └─ Execute with user context
                                                              
← Response ← Convex Client ← User
```

## Components and Interfaces

### 1. Convex Schema (Database)

**users table:**
```typescript
users: defineTable({
  email: v.string(),
  username: v.optional(v.string()),
  passwordHash: v.string(),
  authProvider: v.union(v.literal("email"), v.literal("google")),
  googleId: v.optional(v.string()),
  emailVerified: v.boolean(),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_email", ["email"])
  .index("by_username", ["username"])
  .index("by_google_id", ["googleId"])
```

**user_profiles table (extends existing profiles):**
```typescript
profiles: defineTable({
  userId: v.string(), // Now references users._id instead of Clerk userId
  fullName: v.optional(v.string()),
  title: v.optional(v.string()),
  church: v.optional(v.string()),
  avatarUrl: v.optional(v.string()),
  createdAt: v.string(),
  updatedAt: v.string(),
})
  .index("by_user", ["userId"])
```

### 2. Convex Auth Mutations

**convex/auth.ts:**
```typescript
// Registration mutation
export const register = mutation({
  args: {
    email: v.string(),
    password: v.string(),
    username: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Validate email format
    // Validate password strength
    // Check email uniqueness
    // Check username uniqueness (if provided)
    // Hash password with bcrypt
    // Create user record
    // Generate JWT token
    // Return { token, user }
  }
});

// Login mutation
export const login = mutation({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    // Find user by email
    // Verify password hash
    // Generate JWT token
    // Return { token, user }
  }
});

// Get current user query
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    // Extract userId from JWT (via requireAuth helper)
    // Fetch and return user data
  }
});
```

### 3. Auth Helper Functions

**convex/lib/auth.ts:**
```typescript
// Password hashing using bcrypt
export async function hashPassword(password: string): Promise<string>;

// Password verification
export async function verifyPassword(password: string, hash: string): Promise<boolean>;

// JWT generation
export function generateJWT(userId: string, expiresIn: string = "7d"): string;

// JWT verification
export function verifyJWT(token: string): { userId: string; exp: number } | null;

// Auth middleware for mutations/queries
export async function requireAuth(ctx: QueryCtx | MutationCtx): Promise<string>;

// Password validation
export function validatePassword(password: string): { valid: boolean; errors: string[] };

// Email validation
export function validateEmail(email: string): boolean;
```

### 4. Client-Side Auth Context

**hooks/useAuth.tsx:**
```typescript
interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, username?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Manage auth state
  // Load token from AsyncStorage on mount
  // Provide auth methods
  // Handle token expiration
}

export function useAuth(): AuthContextType;
```

### 5. Convex Client Configuration

**services/convexClient.ts:**
```typescript
// Configure Convex client with JWT authentication
export const convex = new ConvexReactClient(process.env.EXPO_PUBLIC_CONVEX_URL!, {
  auth: {
    getToken: async () => {
      // Retrieve JWT from AsyncStorage
      return token;
    }
  }
});
```

### 6. Protected Route Guards

**components/auth/ProtectedRoute.tsx:**
```typescript
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) return <LoadingScreen />;
  if (!isAuthenticated) return <Redirect to="/auth/login" />;
  
  return children;
}
```

## Data Models

### User Model

```typescript
interface User {
  _id: string;
  email: string;
  username?: string;
  authProvider: "email" | "google";
  googleId?: string;
  emailVerified: boolean;
  createdAt: number;
  updatedAt: number;
  // passwordHash is never exposed to client
}
```

### JWT Payload

```typescript
interface JWTPayload {
  userId: string;
  email: string;
  iat: number; // Issued at
  exp: number; // Expiration
}
```

### Auth Response

```typescript
interface AuthResponse {
  token: string;
  user: User;
}
```

### Error Response

```typescript
interface AuthError {
  code: string;
  message: string;
  field?: string; // For validation errors
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Core Authentication Properties

Property 1: Email and password validation
*For any* registration attempt, the system should validate email format and password strength requirements, rejecting invalid inputs with specific error messages
**Validates: Requirements 1.1, 9.1, 9.2, 9.3, 9.4, 9.5**

Property 2: Password hashing security
*For any* password provided during registration, the system should hash it using bcrypt with cost factor ≥10, never store plaintext passwords, and produce unique hashes for the same password (due to unique salts)
**Validates: Requirements 1.2, 5.1, 5.2, 5.4**

Property 3: Email uniqueness enforcement
*For any* existing user email, attempting to register with that email should be rejected with an appropriate error
**Validates: Requirements 1.3**

Property 4: User record completeness
*For any* successful registration, the created user record should contain email, passwordHash, authProvider, emailVerified, createdAt, and updatedAt fields
**Validates: Requirements 1.4, 6.2**

Property 5: Registration returns valid JWT
*For any* successful registration, the returned JWT token should be decodable and contain the correct userId, issued-at, and expiration timestamps
**Validates: Requirements 1.5, 2.4, 3.1, 6.5**

Property 6: Login credential verification
*For any* existing user, providing the correct email and password should successfully authenticate and return a JWT token and user profile
**Validates: Requirements 2.1, 2.2, 2.5**

Property 7: Invalid credentials rejection
*For any* login attempt with incorrect password or non-existent email, the system should reject the attempt with a generic error message that doesn't reveal whether the email exists
**Validates: Requirements 2.3, 7.2**

Property 8: JWT token validation
*For any* authenticated request with a valid JWT token, the system should successfully validate the signature, check expiration, and extract the userId
**Validates: Requirements 3.2, 3.4, 10.1, 10.3, 10.4**

Property 9: Expired token rejection
*For any* JWT token with an expiration timestamp in the past, authenticated requests should be rejected with an unauthorized error
**Validates: Requirements 3.3, 7.3**

Property 10: Logout clears client session
*For any* authenticated user, calling logout should remove the JWT token from client storage and set authentication state to false
**Validates: Requirements 3.5**

Property 11: Username validation and uniqueness
*For any* registration with a username, the system should validate format and length, enforce uniqueness, and store it with the user record; registration without username should succeed without the field
**Validates: Requirements 4.1, 4.2, 4.3, 4.4**

Property 12: Username in auth response
*For any* user with a username, successful authentication should include the username in the returned user profile
**Validates: Requirements 4.5**

Property 13: Validation error specificity
*For any* registration with validation errors (email format, password strength, username format), the system should return specific error messages identifying each validation failure
**Validates: Requirements 7.1, 9.4**

Property 14: Auth state change notification
*For any* authentication state change (login, logout, token refresh), all subscribed components should be notified of the new state
**Validates: Requirements 8.2**

Property 15: Protected route enforcement
*For any* protected route or mutation, unauthenticated requests should be rejected with an unauthorized error
**Validates: Requirements 8.4, 10.2**

Property 16: Auth error propagation
*For any* authentication failure in a Convex function, the error should be propagated to the client with appropriate error details
**Validates: Requirements 10.5**

### Edge Cases

The property-based test generators should handle these edge cases:
- Empty strings for email, password, username
- Very long strings (>1000 characters)
- Special characters and Unicode in all text fields
- SQL injection attempts in email/username fields
- Malformed JWT tokens (invalid signature, missing fields, corrupted payload)
- Concurrent registration attempts with the same email
- Password strings with only whitespace
- Emails with valid format but unusual domains

## Error Handling

### Error Types and Codes

```typescript
enum AuthErrorCode {
  // Validation errors
  INVALID_EMAIL = "INVALID_EMAIL",
  INVALID_PASSWORD = "INVALID_PASSWORD",
  INVALID_USERNAME = "INVALID_USERNAME",
  WEAK_PASSWORD = "WEAK_PASSWORD",
  
  // Uniqueness errors
  EMAIL_ALREADY_EXISTS = "EMAIL_ALREADY_EXISTS",
  USERNAME_ALREADY_EXISTS = "USERNAME_ALREADY_EXISTS",
  
  // Authentication errors
  INVALID_CREDENTIALS = "INVALID_CREDENTIALS",
  UNAUTHORIZED = "UNAUTHORIZED",
  TOKEN_EXPIRED = "TOKEN_EXPIRED",
  INVALID_TOKEN = "INVALID_TOKEN",
  
  // System errors
  INTERNAL_ERROR = "INTERNAL_ERROR",
}
```

### Error Handling Strategy

1. **Validation Errors**: Return specific error codes and messages to help users correct their input
2. **Authentication Errors**: Return generic messages to prevent information leakage
3. **System Errors**: Log detailed errors server-side, return generic messages to client
4. **Token Errors**: Clear client-side token and redirect to login

### Error Response Format

```typescript
interface AuthError {
  code: AuthErrorCode;
  message: string;
  field?: string; // For validation errors
  details?: Record<string, any>; // Additional context (never includes sensitive data)
}
```

## Testing Strategy

### Unit Testing

Unit tests will cover specific examples and edge cases:

**Registration Tests:**
- Valid registration with all fields
- Valid registration without optional username
- Registration with invalid email formats
- Registration with weak passwords
- Registration with existing email
- Registration with existing username

**Login Tests:**
- Successful login with valid credentials
- Login with non-existent email
- Login with incorrect password
- Login with empty fields

**JWT Tests:**
- Token generation with correct payload
- Token verification with valid token
- Token verification with expired token
- Token verification with invalid signature
- Token verification with malformed token

**Password Security Tests:**
- Password hashing produces different hashes for same password
- Password verification succeeds with correct password
- Password verification fails with incorrect password
- Bcrypt cost factor is at least 10

### Property-Based Testing

Property-based tests will verify universal properties across many randomly generated inputs using **fast-check** (for TypeScript/JavaScript).

**Configuration:**
- Minimum 100 iterations per property test
- Custom generators for emails, passwords, usernames
- Shrinking enabled to find minimal failing cases

**Property Test Requirements:**
- Each property-based test MUST be tagged with a comment referencing the design document property
- Tag format: `// Feature: custom-convex-auth, Property {number}: {property_text}`
- Each correctness property MUST be implemented by a SINGLE property-based test
- Tests should use smart generators that constrain to valid input spaces

**Key Property Tests:**

1. **Email/Password Validation Property** (Property 1)
   - Generate random strings for email and password
   - Verify validation correctly accepts/rejects based on rules
   - Verify error messages are specific

2. **Password Hashing Property** (Property 2)
   - Generate random passwords
   - Verify hashing produces different outputs for same input
   - Verify hashes are never equal to plaintext
   - Verify bcrypt format and cost factor

3. **Email Uniqueness Property** (Property 3)
   - Generate random user data
   - Create user, attempt duplicate registration
   - Verify rejection

4. **Registration Round-Trip Property** (Properties 4, 5)
   - Generate random valid registration data
   - Register user, verify record structure
   - Verify returned JWT is valid and contains correct userId

5. **Login Verification Property** (Property 6)
   - Generate random user, register them
   - Login with correct credentials
   - Verify success and JWT validity

6. **Invalid Credentials Property** (Property 7)
   - Generate random credentials (some valid, some invalid)
   - Verify invalid attempts are rejected with generic message

7. **JWT Validation Property** (Property 8)
   - Generate random valid JWTs
   - Verify validation extracts correct userId

8. **Token Expiration Property** (Property 9)
   - Generate expired tokens
   - Verify rejection

9. **Username Handling Property** (Properties 11, 12)
   - Generate registrations with and without usernames
   - Verify optional behavior and uniqueness

10. **Protected Access Property** (Property 15)
    - Generate authenticated and unauthenticated requests
    - Verify access control

### Integration Testing

Integration tests will verify end-to-end flows:
- Complete registration → login → authenticated request flow
- Token refresh and expiration handling
- Logout and re-authentication
- Concurrent user operations

### Test Utilities

**Test Generators (for property-based testing):**
```typescript
// Generate valid emails
const validEmailGen = fc.emailAddress();

// Generate invalid emails
const invalidEmailGen = fc.string().filter(s => !isValidEmail(s));

// Generate valid passwords (meeting strength requirements)
const validPasswordGen = fc.string({ minLength: 8 })
  .filter(s => /[A-Z]/.test(s) && /[a-z]/.test(s) && /[0-9]/.test(s));

// Generate weak passwords
const weakPasswordGen = fc.oneof(
  fc.string({ maxLength: 7 }),
  fc.string().filter(s => !/[A-Z]/.test(s)),
  fc.constant("password123")
);

// Generate valid usernames
const validUsernameGen = fc.string({ minLength: 3, maxLength: 20 })
  .filter(s => /^[a-zA-Z0-9_]+$/.test(s));
```

**Test Helpers:**
```typescript
// Create test user
async function createTestUser(overrides?: Partial<User>): Promise<User>;

// Generate test JWT
function generateTestJWT(userId: string, expiresIn?: string): string;

// Create expired JWT
function generateExpiredJWT(userId: string): string;

// Clear test database
async function clearTestUsers(): Promise<void>;
```

## Security Considerations

### Password Security
- **Hashing Algorithm**: bcrypt with cost factor 10 (adjustable for future security needs)
- **Salt**: Unique per user (automatic with bcrypt)
- **Timing Attacks**: Constant-time comparison in password verification
- **Weak Passwords**: Reject common passwords from known weak password lists

### JWT Security
- **Secret Key**: Stored in environment variables, never committed to code
- **Token Expiration**: 7 days default (configurable)
- **Signature Algorithm**: HS256 (HMAC with SHA-256)
- **Payload**: Minimal data (userId, email, timestamps only)

### Information Leakage Prevention
- **Login Errors**: Generic "Invalid credentials" message (don't reveal if email exists)
- **Registration Errors**: Specific validation errors OK (helps UX without security risk)
- **Token Errors**: Generic "Unauthorized" message

### Rate Limiting (Future Enhancement)
- Implement rate limiting on login/registration endpoints
- Use Convex scheduled functions to track and reset rate limits
- Prevent brute force attacks

### HTTPS Only
- All authentication requests must use HTTPS in production
- JWT tokens transmitted only over secure connections

## Migration from Clerk

### Migration Strategy

1. **Phase 1: Parallel Implementation**
   - Implement custom auth system alongside Clerk
   - Add feature flag to switch between auth systems
   - Test custom auth thoroughly

2. **Phase 2: Data Migration**
   - Export existing Clerk user data
   - Create migration script to populate users table
   - Map Clerk userId to new custom userId in all related tables

3. **Phase 3: Cutover**
   - Enable custom auth for new users
   - Gradually migrate existing users (require re-authentication)
   - Monitor for issues

4. **Phase 4: Cleanup**
   - Remove Clerk dependencies
   - Clean up old auth code
   - Update documentation

### Data Migration Script

```typescript
// Migration script to convert Clerk users to custom auth
async function migrateClerkUsers() {
  // 1. Export Clerk users
  // 2. For each user:
  //    - Create user record with authProvider="email"
  //    - Generate temporary password (force reset on first login)
  //    - Update all related records (series, sermons, profiles) with new userId
  //    - Send email notification about migration
}
```

### Affected Tables

All tables currently using Clerk `userId` (string) will continue to work:
- `series.userId`
- `sermons.userId`
- `profiles.userId`
- `community_posts.userId`
- `community_comments.userId`

The custom auth system will use Convex `_id` (string) as userId, maintaining compatibility.

## Performance Considerations

### Password Hashing
- **Cost**: bcrypt cost factor 10 = ~100ms per hash
- **Impact**: Acceptable for registration/login (infrequent operations)
- **Optimization**: Consider argon2 for better performance if needed

### JWT Verification
- **Cost**: <1ms per verification (signature check)
- **Impact**: Minimal, suitable for every authenticated request
- **Caching**: No caching needed due to low cost

### Database Queries
- **Indexes**: Email and username indexes for fast lookups
- **Query Optimization**: Single query for login (find by email)
- **Connection Pooling**: Handled by Convex

## Future Enhancements

### Google OAuth Integration

The system is designed to support OAuth providers:

```typescript
// Future: Google OAuth mutation
export const loginWithGoogle = mutation({
  args: {
    googleToken: v.string(),
  },
  handler: async (ctx, args) => {
    // Verify Google token
    // Extract user info (email, googleId, name)
    // Find or create user with authProvider="google"
    // Generate JWT
    // Return { token, user }
  }
});
```

### Email Verification

Add email verification flow:
- Send verification email on registration
- Store verification token
- Verify email before allowing full access

### Password Reset

Add password reset flow:
- Request reset (send email with token)
- Verify reset token
- Update password hash

### Multi-Factor Authentication (MFA)

Add optional MFA:
- TOTP (Time-based One-Time Password)
- SMS verification
- Backup codes

### Session Management

Add server-side session tracking:
- Store active sessions in database
- Allow users to view/revoke sessions
- Implement session limits

## Dependencies

### Required Packages

```json
{
  "dependencies": {
    "convex": "^1.28.0",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",
    "@react-native-async-storage/async-storage": "2.2.0"
  },
  "devDependencies": {
    "fast-check": "^3.15.0",
    "@types/bcryptjs": "^2.4.6",
    "@types/jsonwebtoken": "^9.0.5"
  }
}
```

### Package Justification

- **bcryptjs**: Pure JavaScript bcrypt implementation (works in Convex environment)
- **jsonwebtoken**: Industry-standard JWT library
- **fast-check**: Property-based testing framework
- **@react-native-async-storage/async-storage**: Already in project for token storage

## Implementation Notes

### Convex Environment Constraints

Convex functions run in a restricted JavaScript environment:
- No Node.js built-ins (fs, crypto, etc.)
- Must use pure JavaScript libraries
- bcryptjs works (pure JS), bcrypt doesn't (native bindings)

### Token Storage

- **React Native**: AsyncStorage (already in use)
- **Web**: localStorage with fallback to sessionStorage
- **Security**: Tokens stored securely, cleared on logout

### Error Handling Pattern

```typescript
// Consistent error handling in mutations
try {
  // Operation
} catch (error) {
  if (error instanceof ValidationError) {
    throw new ConvexError({ code: error.code, message: error.message });
  }
  // Log error server-side
  console.error("Auth error:", error);
  throw new ConvexError({ code: "INTERNAL_ERROR", message: "An error occurred" });
}
```

### Type Safety

All auth functions will use TypeScript with strict type checking:
- Zod or Convex validators for runtime validation
- TypeScript interfaces for compile-time safety
- Branded types for userId to prevent mixing with other strings
