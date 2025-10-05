# Migration Plan: Supabase to MySQL + Express.js + Passport.js

## Overview

This document outlines the complete migration plan from Supabase to a custom backend using MySQL, Express.js, and Passport.js deployed on Vercel. The migration will maintain the existing offline-first architecture while providing more control over the backend infrastructure.

## Migration Phases

### Phase 1: Backend Infrastructure Setup (3-4 weeks)

#### 1.1 Project Setup and Configuration

- [ ] Create new Express.js project structure
- [ ] Set up TypeScript configuration for backend
- [ ] Configure ESLint and Prettier for backend code
- [ ] Set up environment variable management
- [ ] Create package.json with all required dependencies
- [ ] Set up Vercel deployment configuration
- [ ] Configure database connection pooling
- [ ] Set up logging and monitoring infrastructure

#### 1.2 Database Setup

- [ ] Set up MySQL database (PlanetScale, Railway, or AWS RDS)
- [ ] Create database migration system (using Knex.js or Prisma)
- [ ] Design and implement database schema
- [ ] Set up database indexes for performance
- [ ] Create database seeding scripts for development
- [ ] Set up database backup and recovery procedures
- [ ] Configure database connection pooling
- [ ] Set up database monitoring and alerting

#### 1.3 Authentication System

- [ ] Set up Passport.js with JWT strategy
- [ ] Implement user registration endpoint
- [ ] Implement user login endpoint
- [ ] Implement password reset functionality
- [ ] Set up JWT token generation and validation
- [ ] Implement refresh token mechanism
- [ ] Set up session management
- [ ] Create middleware for protected routes
- [ ] Implement rate limiting for auth endpoints

### Phase 2: Core API Development (4-5 weeks)

#### 2.1 User Management API

- [ ] Create user profile CRUD endpoints
- [ ] Implement user data validation
- [ ] Set up user profile image upload
- [ ] Create user preferences endpoints
- [ ] Implement user account deletion
- [ ] Set up user activity logging
- [ ] Create admin user management endpoints
- [ ] Implement user search functionality

#### 2.2 Sermon Management API

- [ ] Create sermon CRUD endpoints
- [ ] Implement sermon search and filtering
- [ ] Set up sermon file uploads (if needed)
- [ ] Create sermon sharing endpoints
- [ ] Implement sermon analytics tracking
- [ ] Set up sermon export functionality
- [ ] Create sermon templates system
- [ ] Implement sermon collaboration features

#### 2.3 Series Management API

- [ ] Create series CRUD endpoints
- [ ] Implement series-sermon relationship management
- [ ] Set up series image upload
- [ ] Create series analytics endpoints
- [ ] Implement series sharing functionality
- [ ] Set up series templates
- [ ] Create series import/export features

#### 2.4 Community Features API

- [ ] Create community posts CRUD endpoints
- [ ] Implement post likes and comments system
- [ ] Set up post moderation features
- [ ] Create user following system
- [ ] Implement notification system
- [ ] Set up content reporting functionality
- [ ] Create community analytics endpoints

### Phase 3: Sync Service Development (2-3 weeks)

#### 3.1 Offline-First Sync Architecture

- [ ] Design sync conflict resolution strategy
- [ ] Implement push sync (local → server)
- [ ] Implement pull sync (server → local)
- [ ] Create sync status tracking
- [ ] Implement incremental sync
- [ ] Set up sync error handling and retry logic
- [ ] Create sync performance monitoring
- [ ] Implement sync queue management

#### 3.2 Conflict Resolution

- [ ] Implement last-write-wins strategy
- [ ] Create conflict detection algorithms
- [ ] Set up conflict resolution UI
- [ ] Implement manual conflict resolution
- [ ] Create conflict logging and analytics
- [ ] Set up conflict notification system

### Phase 4: Frontend Integration (3-4 weeks)

#### 4.1 Service Layer Updates

- [ ] Create new API service classes
- [ ] Update authentication service
- [ ] Modify sermon service
- [ ] Update series service
- [ ] Modify community service
- [ ] Update sync service
- [ ] Implement error handling
- [ ] Set up request/response interceptors

#### 4.2 Repository Pattern Updates

- [ ] Update native repository implementations
- [ ] Update web repository implementations
- [ ] Modify data serialization
- [ ] Update type definitions
- [ ] Implement new error handling
- [ ] Update caching strategies

#### 4.3 UI Component Updates

- [ ] Update authentication screens
- [ ] Modify sermon editor
- [ ] Update series management screens
- [ ] Modify community features
- [ ] Update profile screens
- [ ] Implement new error states
- [ ] Add loading states for new API calls

### Phase 5: Testing and Quality Assurance (2-3 weeks)

#### 5.1 Backend Testing

- [ ] Set up Jest testing framework
- [ ] Create unit tests for all API endpoints
- [ ] Implement integration tests
- [ ] Set up end-to-end testing
- [ ] Create performance testing suite
- [ ] Implement security testing
- [ ] Set up automated testing pipeline
- [ ] Create test data fixtures

#### 5.2 Frontend Testing

- [ ] Update existing unit tests
- [ ] Create new integration tests
- [ ] Implement component testing
- [ ] Set up E2E testing with Detox
- [ ] Create API mocking for tests
- [ ] Implement offline testing scenarios
- [ ] Set up visual regression testing

#### 5.3 Sync Testing

- [ ] Test offline/online transitions
- [ ] Test conflict resolution scenarios
- [ ] Test sync performance under load
- [ ] Test sync error recovery
- [ ] Test data integrity during sync
- [ ] Test sync with large datasets

### Phase 6: Deployment and Migration (1-2 weeks)

#### 6.1 Production Deployment

- [ ] Set up production database
- [ ] Configure production environment variables
- [ ] Deploy backend to Vercel
- [ ] Set up monitoring and alerting
- [ ] Configure backup procedures
- [ ] Set up SSL certificates
- [ ] Implement rate limiting
- [ ] Set up CDN for static assets

#### 6.2 Data Migration

- [ ] Create data export scripts from Supabase
- [ ] Implement data transformation logic
- [ ] Create data import scripts for MySQL
- [ ] Set up data validation procedures
- [ ] Create rollback procedures
- [ ] Test migration with sample data
- [ ] Plan migration timeline
- [ ] Execute production migration

#### 6.3 App Store Updates

- [ ] Update app configuration
- [ ] Test app with new backend
- [ ] Update app store listings
- [ ] Plan app store release
- [ ] Coordinate with app store review process

## Technical Specifications

### Backend Architecture

```
backend/
├── src/
│   ├── controllers/          # Route handlers
│   ├── middleware/           # Custom middleware
│   ├── models/              # Database models
│   ├── routes/              # API routes
│   ├── services/            # Business logic
│   ├── utils/               # Utility functions
│   ├── types/               # TypeScript types
│   └── config/              # Configuration files
├── tests/                   # Test files
├── migrations/              # Database migrations
├── seeds/                   # Database seeds
└── docs/                    # API documentation
```

### Database Schema

```sql
-- Users table
CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    title VARCHAR(255),
    church VARCHAR(255),
    avatar_url VARCHAR(500),
    email_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    INDEX idx_users_email (email),
    INDEX idx_users_deleted_at (deleted_at)
);

-- Sermons table
CREATE TABLE sermons (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    outline JSON,
    scripture TEXT,
    tags JSON,
    status ENUM('draft', 'preparing', 'ready', 'delivered', 'archived') DEFAULT 'draft',
    visibility ENUM('private', 'congregation', 'public') DEFAULT 'private',
    date DATE,
    notes TEXT,
    series_id VARCHAR(36),
    word_count INT DEFAULT 0,
    reading_time INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (series_id) REFERENCES series(id),
    INDEX idx_sermons_user_id (user_id),
    INDEX idx_sermons_series_id (series_id),
    INDEX idx_sermons_status (status),
    INDEX idx_sermons_created_at (created_at),
    INDEX idx_sermons_deleted_at (deleted_at)
);

-- Series table
CREATE TABLE series (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_date DATE,
    end_date DATE,
    image_url VARCHAR(500),
    tags JSON,
    status ENUM('planning', 'active', 'completed', 'archived') DEFAULT 'planning',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_series_user_id (user_id),
    INDEX idx_series_status (status),
    INDEX idx_series_created_at (created_at),
    INDEX idx_series_deleted_at (deleted_at)
);

-- Community posts table
CREATE TABLE community_posts (
    id VARCHAR(36) PRIMARY KEY,
    author_id VARCHAR(36) NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    tags JSON,
    visibility ENUM('community', 'public', 'private') DEFAULT 'community',
    status ENUM('active', 'archived', 'draft') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    FOREIGN KEY (author_id) REFERENCES users(id),
    INDEX idx_community_posts_author_id (author_id),
    INDEX idx_community_posts_status (status),
    INDEX idx_community_posts_created_at (created_at),
    INDEX idx_community_posts_deleted_at (deleted_at)
);

-- Community post likes table
CREATE TABLE community_post_likes (
    id VARCHAR(36) PRIMARY KEY,
    post_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES community_posts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_post_user_like (post_id, user_id),
    INDEX idx_community_post_likes_post_id (post_id),
    INDEX idx_community_post_likes_user_id (user_id)
);

-- Community post comments table
CREATE TABLE community_post_comments (
    id VARCHAR(36) PRIMARY KEY,
    post_id VARCHAR(36) NOT NULL,
    author_id VARCHAR(36) NOT NULL,
    content TEXT NOT NULL,
    parent_comment_id VARCHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    FOREIGN KEY (post_id) REFERENCES community_posts(id) ON DELETE CASCADE,
    FOREIGN KEY (author_id) REFERENCES users(id),
    FOREIGN KEY (parent_comment_id) REFERENCES community_post_comments(id) ON DELETE CASCADE,
    INDEX idx_community_post_comments_post_id (post_id),
    INDEX idx_community_post_comments_author_id (author_id),
    INDEX idx_community_post_comments_parent_id (parent_comment_id),
    INDEX idx_community_post_comments_created_at (created_at)
);

-- Sync tracking table
CREATE TABLE sync_tracking (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    table_name VARCHAR(50) NOT NULL,
    record_id VARCHAR(36) NOT NULL,
    last_synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    sync_version INT DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE KEY unique_user_table_record (user_id, table_name, record_id),
    INDEX idx_sync_tracking_user_id (user_id),
    INDEX idx_sync_tracking_table_name (table_name),
    INDEX idx_sync_tracking_last_synced (last_synced_at)
);
```

### API Endpoints

#### Authentication

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh` - Refresh JWT token
- `POST /api/auth/forgot-password` - Password reset request
- `POST /api/auth/reset-password` - Password reset confirmation

#### Users

- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `DELETE /api/users/account` - Delete user account
- `POST /api/users/avatar` - Upload avatar

#### Sermons

- `GET /api/sermons` - List user's sermons
- `GET /api/sermons/:id` - Get specific sermon
- `POST /api/sermons` - Create new sermon
- `PUT /api/sermons/:id` - Update sermon
- `DELETE /api/sermons/:id` - Delete sermon
- `GET /api/sermons/search` - Search sermons

#### Series

- `GET /api/series` - List user's series
- `GET /api/series/:id` - Get specific series
- `POST /api/series` - Create new series
- `PUT /api/series/:id` - Update series
- `DELETE /api/series/:id` - Delete series
- `GET /api/series/:id/sermons` - Get sermons in series

#### Community

- `GET /api/community/posts` - List community posts
- `GET /api/community/posts/:id` - Get specific post
- `POST /api/community/posts` - Create new post
- `PUT /api/community/posts/:id` - Update post
- `DELETE /api/community/posts/:id` - Delete post
- `POST /api/community/posts/:id/like` - Like/unlike post
- `GET /api/community/posts/:id/comments` - Get post comments
- `POST /api/community/posts/:id/comments` - Add comment

#### Sync

- `POST /api/sync/push` - Push local changes to server
- `GET /api/sync/pull` - Pull server changes to local
- `GET /api/sync/status` - Get sync status

## Testing Strategy

### Backend Testing

#### Unit Tests

```javascript
// Example: Sermon service unit test
describe('SermonService', () => {
  describe('createSermon', () => {
    it('should create a new sermon successfully', async () => {
      const mockUser = { id: 'user-123' };
      const sermonData = {
        title: 'Test Sermon',
        content: 'Test content',
        status: 'draft'
      };
      
      const result = await sermonService.createSermon(mockUser, sermonData);
      
      expect(result).toMatchObject({
        id: expect.any(String),
        title: 'Test Sermon',
        content: 'Test content',
        status: 'draft',
        userId: 'user-123'
      });
    });
    
    it('should throw error for invalid sermon data', async () => {
      const mockUser = { id: 'user-123' };
      const invalidData = { title: '' };
      
      await expect(sermonService.createSermon(mockUser, invalidData))
        .rejects.toThrow('Title is required');
    });
  });
});
```

#### Integration Tests

```javascript
// Example: API endpoint integration test
describe('POST /api/sermons', () => {
  it('should create a new sermon', async () => {
    const token = await getAuthToken();
    const sermonData = {
      title: 'Test Sermon',
      content: 'Test content'
    };
    
    const response = await request(app)
      .post('/api/sermons')
      .set('Authorization', `Bearer ${token}`)
      .send(sermonData)
      .expect(201);
    
    expect(response.body).toMatchObject({
      id: expect.any(String),
      title: 'Test Sermon',
      content: 'Test content'
    });
  });
});
```

#### E2E Tests

```javascript
// Example: Complete user flow test
describe('Sermon Creation Flow', () => {
  it('should allow user to create and edit a sermon', async () => {
    // Register user
    const user = await registerUser();
    
    // Login
    const token = await loginUser(user);
    
    // Create sermon
    const sermon = await createSermon(token, {
      title: 'My First Sermon',
      content: 'Initial content'
    });
    
    // Update sermon
    const updatedSermon = await updateSermon(token, sermon.id, {
      content: 'Updated content'
    });
    
    expect(updatedSermon.content).toBe('Updated content');
  });
});
```

### Frontend Testing

#### Component Tests

```javascript
// Example: SermonEditor component test
describe('SermonEditor', () => {
  it('should render sermon form', () => {
    render(<SermonEditor sermon={mockSermon} onSave={jest.fn()} />);
    
    expect(screen.getByLabelText('Title')).toBeInTheDocument();
    expect(screen.getByLabelText('Content')).toBeInTheDocument();
  });
  
  it('should call onSave when form is submitted', async () => {
    const mockOnSave = jest.fn();
    render(<SermonEditor sermon={mockSermon} onSave={mockOnSave} />);
    
    await userEvent.type(screen.getByLabelText('Title'), 'New Title');
    await userEvent.click(screen.getByText('Save'));
    
    expect(mockOnSave).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'New Title' })
    );
  });
});
```

#### API Service Tests

```javascript
// Example: SermonService test
describe('SermonService', () => {
  beforeEach(() => {
    fetchMock.reset();
  });
  
  it('should fetch sermons successfully', async () => {
    const mockSermons = [{ id: '1', title: 'Test Sermon' }];
    fetchMock.get('/api/sermons', mockSermons);
    
    const result = await sermonService.getSermons();
    
    expect(result).toEqual(mockSermons);
  });
  
  it('should handle API errors', async () => {
    fetchMock.get('/api/sermons', 500);
    
    await expect(sermonService.getSermons()).rejects.toThrow();
  });
});
```

### Sync Testing

#### Offline/Online Transition Tests

```javascript
// Example: Sync service test
describe('SyncService', () => {
  it('should sync local changes when coming online', async () => {
    // Simulate offline state
    await syncService.goOffline();
    
    // Make local changes
    await sermonRepository.create({ title: 'Offline Sermon' });
    
    // Simulate coming online
    await syncService.goOnline();
    
    // Verify sync occurred
    expect(fetchMock).toHaveBeenCalledWith('/api/sync/push');
  });
});
```

## Security Considerations

### Authentication Security

- [ ] Implement JWT token expiration and refresh
- [ ] Set up rate limiting on auth endpoints
- [ ] Implement password strength requirements
- [ ] Set up account lockout after failed attempts
- [ ] Implement email verification
- [ ] Set up two-factor authentication (optional)

### API Security

- [ ] Implement input validation and sanitization
- [ ] Set up CORS configuration
- [ ] Implement request rate limiting
- [ ] Set up API key authentication for admin endpoints
- [ ] Implement request logging and monitoring
- [ ] Set up SQL injection prevention
- [ ] Implement XSS protection

### Data Security

- [ ] Encrypt sensitive data at rest
- [ ] Implement data backup and recovery
- [ ] Set up database access controls
- [ ] Implement audit logging
- [ ] Set up data retention policies
- [ ] Implement GDPR compliance features

## Performance Considerations

### Database Optimization

- [ ] Implement proper indexing strategy
- [ ] Set up database connection pooling
- [ ] Implement query optimization
- [ ] Set up database monitoring
- [ ] Implement caching strategies
- [ ] Set up database replication (if needed)

### API Performance

- [ ] Implement response caching
- [ ] Set up CDN for static assets
- [ ] Implement pagination for large datasets
- [ ] Set up API response compression
- [ ] Implement request batching
- [ ] Set up performance monitoring

### Frontend Performance

- [ ] Implement code splitting
- [ ] Set up image optimization
- [ ] Implement lazy loading
- [ ] Set up bundle optimization
- [ ] Implement offline caching
- [ ] Set up performance monitoring

## Monitoring and Maintenance

### Application Monitoring

- [ ] Set up error tracking (Sentry)
- [ ] Implement performance monitoring
- [ ] Set up uptime monitoring
- [ ] Implement log aggregation
- [ ] Set up alerting for critical issues
- [ ] Implement health check endpoints

### Database Monitoring

- [ ] Set up database performance monitoring
- [ ] Implement slow query logging
- [ ] Set up database backup monitoring
- [ ] Implement disk space monitoring
- [ ] Set up connection pool monitoring

### Business Metrics

- [ ] Implement user analytics
- [ ] Set up feature usage tracking
- [ ] Implement conversion tracking
- [ ] Set up A/B testing framework
- [ ] Implement user feedback collection

## Risk Assessment

### High Risk Items

- [ ] Data migration complexity
- [ ] Sync conflict resolution
- [ ] Authentication token management
- [ ] Database performance under load
- [ ] Offline functionality maintenance

### Medium Risk Items

- [ ] API endpoint compatibility
- [ ] Frontend integration complexity
- [ ] Testing coverage gaps
- [ ] Performance optimization needs

### Low Risk Items

- [ ] UI component updates
- [ ] Configuration management
- [ ] Documentation updates

## Timeline Summary

| Phase | Duration | Key Deliverables |
|-------|----------|------------------|
| Phase 1 | 3-4 weeks | Backend infrastructure, database, authentication |
| Phase 2 | 4-5 weeks | Core API endpoints, business logic |
| Phase 3 | 2-3 weeks | Sync service, conflict resolution |
| Phase 4 | 3-4 weeks | Frontend integration, UI updates |
| Phase 5 | 2-3 weeks | Testing, quality assurance |
| Phase 6 | 1-2 weeks | Deployment, data migration |

**Total Estimated Duration: 15-21 weeks (4-5 months)**

## Success Criteria

### Technical Success

- [ ] All existing functionality works with new backend
- [ ] Offline-first architecture maintained
- [ ] Performance meets or exceeds current benchmarks
- [ ] Security vulnerabilities addressed
- [ ] Test coverage > 80%

### Business Success

- [ ] Zero data loss during migration
- [ ] Minimal user disruption
- [ ] Improved system reliability
- [ ] Reduced operational costs
- [ ] Enhanced scalability

## Rollback Plan

### Immediate Rollback (if needed)

- [ ] Keep Supabase infrastructure running during migration
- [ ] Implement feature flags for gradual rollout
- [ ] Set up monitoring to detect issues quickly
- [ ] Prepare rollback scripts and procedures
- [ ] Train team on rollback procedures

### Data Recovery

- [ ] Maintain Supabase data as backup
- [ ] Implement data export/import procedures
- [ ] Set up data validation checks
- [ ] Create data recovery documentation
- [ ] Test rollback procedures regularly

## Conclusion

This migration plan provides a comprehensive roadmap for transitioning from Supabase to a custom MySQL + Express.js + Passport.js backend. The plan emphasizes maintaining the existing offline-first architecture while gaining more control over the backend infrastructure.

The key to success will be thorough testing, careful data migration, and maintaining backward compatibility during the transition period. The estimated timeline of 4-5 months reflects the complexity of the migration while ensuring quality and reliability.

Regular progress reviews and risk assessments should be conducted throughout the migration process to ensure the project stays on track and meets the defined success criteria.
