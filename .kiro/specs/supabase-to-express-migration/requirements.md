# Requirements Document

## Introduction

This feature involves migrating the YouPreacher React Native app from Supabase backend to Express.js/MySQL with Passport.js authentication. The migration must maintain all existing functionality while transitioning to the new backend architecture. The frontend components should remain unchanged, requiring only service layer modifications to communicate with the new Express.js API endpoints.

## Requirements

### Requirement 1

**User Story:** As a pastor using the app, I want the authentication system to work seamlessly after migration, so that I can continue logging in and accessing my account without any disruption.

#### Acceptance Criteria

1. WHEN a user attempts to sign up THEN the system SHALL create a new user account using Passport.js authentication with MySQL storage
2. WHEN a user attempts to sign in THEN the system SHALL authenticate using email/password via Passport.js and return a JWT token
3. WHEN a user requests password reset THEN the system SHALL send a password reset email and allow password updates
4. WHEN a user updates their profile THEN the system SHALL persist changes to MySQL database
5. WHEN a user signs out THEN the system SHALL invalidate the session and clear authentication tokens
6. IF a user is not authenticated THEN the system SHALL redirect to login screen
7. WHEN the system checks authentication status THEN it SHALL validate JWT tokens and return current user data

### Requirement 2

**User Story:** As a pastor, I want all my existing sermons to be accessible after migration, so that I don't lose any of my sermon preparation work.

#### Acceptance Criteria

1. WHEN a user requests their sermons list THEN the system SHALL return all sermons from MySQL database with same data structure
2. WHEN a user creates a new sermon THEN the system SHALL store it in MySQL with all fields (title, content, outline, scripture, tags, status, visibility, date, notes)
3. WHEN a user updates a sermon THEN the system SHALL persist changes to MySQL and return updated sermon data
4. WHEN a user deletes a sermon THEN the system SHALL perform soft delete in MySQL (set deleted_at timestamp)
5. WHEN a user retrieves a specific sermon THEN the system SHALL return complete sermon data including series relationship
6. IF a sermon belongs to a series THEN the system SHALL include series information in the response
7. WHEN filtering sermons by status THEN the system SHALL return only sermons matching the specified status

### Requirement 3

**User Story:** As a pastor, I want my sermon series to remain organized and accessible after migration, so that I can continue managing my sermon planning effectively.

#### Acceptance Criteria

1. WHEN a user requests their series list THEN the system SHALL return all series from MySQL database with sermon counts
2. WHEN a user creates a new series THEN the system SHALL store it in MySQL with all fields (title, description, start_date, end_date, tags, status)
3. WHEN a user updates a series THEN the system SHALL persist changes to MySQL and return updated series data
4. WHEN a user deletes a series THEN the system SHALL perform soft delete in MySQL (set deleted_at timestamp)
5. WHEN a user retrieves a specific series THEN the system SHALL return complete series data including associated sermons
6. WHEN a user requests active series THEN the system SHALL return only series with status 'active'
7. IF a series has associated sermons THEN the system SHALL include sermon count and basic sermon information

### Requirement 4

**User Story:** As a pastor, I want to continue participating in the community features after migration, so that I can share insights and engage with other pastors.

#### Acceptance Criteria

1. WHEN a user requests community posts THEN the system SHALL return all public and community posts from MySQL with author information
2. WHEN a user creates a community post THEN the system SHALL store it in MySQL with all fields (title, content, tags, visibility, status)
3. WHEN a user updates their community post THEN the system SHALL persist changes to MySQL and return updated post data
4. WHEN a user deletes their community post THEN the system SHALL remove it from MySQL database
5. WHEN a user likes/unlikes a post THEN the system SHALL toggle like status in MySQL and return updated like count
6. WHEN a user adds a comment THEN the system SHALL store comment in MySQL with author and post relationships
7. WHEN a user likes/unlikes a comment THEN the system SHALL toggle comment like status and return updated count
8. IF a user requests their own posts THEN the system SHALL return only posts authored by that user

### Requirement 5

**User Story:** As a developer, I want the Express.js API to provide consistent endpoints that match the existing service interfaces, so that frontend code changes are minimal.

#### Acceptance Criteria

1. WHEN the frontend calls authentication methods THEN the Express.js API SHALL provide equivalent endpoints with same response formats
2. WHEN the frontend calls sermon service methods THEN the Express.js API SHALL provide REST endpoints that return identical data structures
3. WHEN the frontend calls series service methods THEN the Express.js API SHALL provide REST endpoints that maintain existing functionality
4. WHEN the frontend calls community service methods THEN the Express.js API SHALL provide REST endpoints with same behavior
5. WHEN API responses are returned THEN they SHALL match the existing TypeScript interfaces used by frontend
6. IF an error occurs THEN the API SHALL return error responses in the same format as current Supabase integration
7. WHEN authentication is required THEN the API SHALL validate JWT tokens and return appropriate error codes for unauthorized requests

### Requirement 6

**User Story:** As a system administrator, I want the MySQL database schema to properly store all existing data types and relationships, so that no data is lost during migration.

#### Acceptance Criteria

1. WHEN the database is created THEN it SHALL have tables for users, profiles, sermons, series, community_posts, community_comments, and related junction tables
2. WHEN user data is stored THEN the profiles table SHALL contain all pastor-specific fields (full_name, title, church)
3. WHEN sermons are stored THEN they SHALL maintain relationships to series and users with proper foreign keys
4. WHEN community posts are stored THEN they SHALL maintain relationships to authors and support likes/comments
5. WHEN soft deletes are performed THEN records SHALL be marked with deleted_at timestamp rather than removed
6. IF data relationships exist THEN foreign key constraints SHALL maintain referential integrity
7. WHEN queries are performed THEN indexes SHALL be present on frequently queried fields for performance

### Requirement 7

**User Story:** As a developer, I want proper error handling and logging in the Express.js backend, so that issues can be diagnosed and resolved quickly.

#### Acceptance Criteria

1. WHEN API errors occur THEN the system SHALL log detailed error information for debugging
2. WHEN database connection fails THEN the system SHALL return appropriate error responses and retry logic
3. WHEN validation errors occur THEN the system SHALL return specific field-level error messages
4. WHEN authentication fails THEN the system SHALL return standardized error codes and messages
5. WHEN rate limiting is exceeded THEN the system SHALL return 429 status with retry information
6. IF unexpected errors occur THEN the system SHALL log stack traces while returning generic error messages to clients
7. WHEN API requests are made THEN the system SHALL log request/response information for monitoring