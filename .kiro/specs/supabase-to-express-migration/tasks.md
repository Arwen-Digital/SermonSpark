# Implementation Plan

- [x] 1. Set up Express.js backend foundation
  - Use the Express.js (in ../expresjs/ installed properly already) application with proper middleware setup 
  - Configure MySQL database connection with connection pooling
  - Set up environment configuration for database credentials and JWT secrets
  - Implement global error handling middleware
  - _Requirements: 5.6, 7.1, 7.2_

- [x] 2. Implement MySQL database schema and models
  - [x] 2.1 Create database migration scripts for all tables
    - Write SQL scripts for users, profiles, series, sermons, community_posts, community_post_comments, and likes tables
    - Include proper indexes, foreign keys, and constraints
    - _Requirements: 6.1, 6.3, 6.4, 6.6_

  - [x] 2.2 Create Sequelize/MySQL models
    - Implement User, Profile, Series, Sermon, CommunityPost, and CommunityComment models
    - Define relationships between models with proper foreign keys
    - Add soft delete functionality with deleted_at timestamps
    - _Requirements: 6.1, 6.5, 6.6_

- [x] 3. Set up Passport.js authentication system
  - [x] 3.1 Configure Passport.js with local strategy
    - Set up passport configuration for email/password authentication
    - Implement password hashing using bcrypt
    - Configure JWT token generation and validation
    - _Requirements: 1.1, 1.2, 1.7_

  - [x] 3.2 Create JWT authentication middleware
    - Implement middleware to validate JWT tokens on protected routes
    - Add user context to request object for authenticated requests
    - Handle token expiration and refresh logic
    - _Requirements: 1.6, 1.7, 5.7_

- [x] 4. Implement authentication API endpoints
  - [x] 4.1 Create user registration endpoint
    - Implement POST /api/auth/register with validation
    - Create user record and profile with pastor-specific fields
    - Return JWT token and user data matching existing interface
    - _Requirements: 1.1, 5.1, 5.5_

  - [x] 4.2 Create user login endpoint
    - Implement POST /api/auth/login with email/password validation
    - Authenticate user and generate JWT token
    - Return user data with profile information
    - _Requirements: 1.2, 5.1, 5.5_

  - [x] 4.3 Create profile management endpoints
    - Implement GET /api/auth/me to get current user
    - Implement PUT /api/auth/profile to update user profile
    - Implement POST /api/auth/forgot-password for password reset
    - _Requirements: 1.3, 1.4, 5.1, 5.5_

  - [x] 4.4 Write authentication endpoint tests
    - Create unit tests for all authentication endpoints
    - Test validation, error handling, and success scenarios
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 5. Implement sermon management API endpoints
  - [x] 5.1 Create sermon CRUD endpoints
    - Implement GET /api/sermons to list user's sermons
    - Implement GET /api/sermons/:id to get specific sermon
    - Implement POST /api/sermons to create new sermon
    - Implement PUT /api/sermons/:id to update sermon
    - Implement DELETE /api/sermons/:id for soft delete
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [x] 5.2 Add sermon-series relationship handling
    - Include series information in sermon responses
    - Handle series_id assignment and updates
    - Filter sermons by series when requested
    - _Requirements: 2.6, 3.7_

  - [x] 5.3 Write sermon endpoint tests
    - Create unit tests for all sermon CRUD operations
    - Test series relationship handling
    - Test soft delete functionality
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 6. Implement series management API endpoints
  - [x] 6.1 Create series CRUD endpoints
    - Implement GET /api/series to list user's series with sermon counts
    - Implement GET /api/series/:id to get specific series with sermons
    - Implement POST /api/series to create new series
    - Implement PUT /api/series/:id to update series
    - Implement DELETE /api/series/:id for soft delete
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [x] 6.2 Add series filtering and aggregation
    - Implement GET /api/series/active for active series only
    - Include sermon count and basic sermon info in series responses
    - Handle series status filtering
    - _Requirements: 3.6, 3.7_

  - [x] 6.3 Write series endpoint tests
    - Create unit tests for all series CRUD operations
    - Test sermon count aggregation
    - Test active series filtering
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 7. Implement community features API endpoints
  - [x] 7.1 Create community post CRUD endpoints
    - Implement GET /api/community/posts to list public/community posts
    - Implement GET /api/community/posts/:id to get specific post
    - Implement POST /api/community/posts to create new post
    - Implement PUT /api/community/posts/:id to update post
    - Implement DELETE /api/community/posts/:id to delete post
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [x] 7.2 Create community interaction endpoints
    - Implement POST /api/community/posts/:id/like to toggle post likes
    - Implement GET /api/community/posts/:id/comments to get comments
    - Implement POST /api/community/posts/:id/comments to create comments
    - Implement POST /api/community/comments/:id/like to toggle comment likes
    - Implement GET /api/community/my-posts for user's posts
    - _Requirements: 4.5, 4.6, 4.7, 4.8_

  - [x] 7.3 Write community endpoint tests
    - Create unit tests for all community post operations
    - Test like/unlike functionality
    - Test comment creation and retrieval
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_

- [x] 8. Create Express.js service layer for React Native
  - [x] 8.1 Implement Express authentication service
    - Create expressAuthService.ts to replace supabaseAuthService.ts
    - Implement all authentication methods with HTTP requests to Express API
    - Handle JWT token storage and automatic inclusion in requests
    - Maintain exact same interface as existing Supabase service
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 5.1, 5.5_

  - [x] 8.2 Implement Express sermon service
    - Create expressSermonService.ts to replace supabaseSermonService.ts
    - Implement all sermon CRUD methods with HTTP requests
    - Maintain SermonDto interface compatibility
    - Handle error responses and data transformation
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 5.2, 5.5_

  - [x] 8.3 Implement Express series service
    - Create expressSeriesService.ts to replace supabaseSeriesService.ts
    - Implement all series CRUD methods with HTTP requests
    - Maintain Series interface compatibility
    - Handle sermon count aggregation from API responses
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 5.3, 5.5_

  - [x] 8.4 Implement Express community service
    - Create expressCommunityService.ts to replace supabaseCommunityService.ts
    - Implement all community post and comment methods
    - Handle like/unlike functionality
    - Maintain CommunityPostDto and CommunityCommentDto interfaces
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 5.4, 5.5_

- [x] 9. Add comprehensive error handling and validation
  - [x] 9.1 Implement request validation middleware
    - Create validation schemas for all API endpoints
    - Add input sanitization and type checking
    - Return detailed validation error messages
    - _Requirements: 5.6, 7.3_

  - [x] 9.2 Add API security and rate limiting
    - Implement rate limiting middleware for all endpoints
    - Add CORS configuration for React Native app
    - Implement request size limits and security headers
    - _Requirements: 7.5_

  - [x] 9.3 Create comprehensive logging system
    - Add request/response logging for monitoring
    - Implement error logging with stack traces
    - Add database query logging for debugging
    - _Requirements: 7.1, 7.6, 7.7_

- [x] 10. Update React Native app configuration
  - [x] 10.1 Update service imports and configuration
    - Replace Supabase service imports with Express services
    - Update API base URL configuration
    - Configure HTTP client with proper headers and interceptors
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [x] 10.2 Update environment configuration
    - Add Express.js API URL to environment variables
    - Remove Supabase configuration variables
    - Update build configurations for different environments
    - _Requirements: 5.1_

- [ ] 11. Create data migration utilities
  - [ ] 11.1 Create Supabase data export scripts
    - Write scripts to export users, profiles, series, sermons, and community data
    - Handle data transformation for MySQL compatibility
    - Preserve relationships and foreign key references
    - _Requirements: 6.1, 6.6_

  - [ ] 11.2 Create MySQL data import scripts
    - Write scripts to import transformed data into MySQL
    - Verify data integrity and relationships
    - Handle UUID generation and mapping
    - _Requirements: 6.1, 6.6_

- [x] 12. Integration testing and validation
  - [x] 12.1 Create end-to-end API tests
    - Test complete user workflows through API endpoints
    - Test authentication flows and token handling
    - Test data consistency across related entities
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [x] 12.2 Test React Native service integration
    - Test all service methods with Express.js backend
    - Verify data format compatibility
    - Test error handling and edge cases
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_