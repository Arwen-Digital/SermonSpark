# Bible Verse Integration with Claude AI

This document describes the integration of Claude AI for Bible verse searching in the sermon editor.

## Features

### 1. AI-Powered Bible Verse Search
- Uses Claude Haiku 3.5 (configurable to Sonnet or Opus)
- Searches for Bible verses using natural language
- Supports multiple Bible translations (KJV, NASB, ESV, CSB, NIV, NLT)
- CSB (Christian Standard Bible) is set as the default translation

### 2. Database Tracking
- All AI searches are logged in the `agent_searches` table
- Tracks search queries, responses, success/failure, response times
- Enables analytics and debugging of AI usage
- Supports future expansion to other AI agents

### 3. User Experience
- Translation selection buttons in the Bible modal
- Copy to clipboard functionality for verse text
- Loading states and error handling
- Toast notifications for user feedback
- Configurable API settings

## Database Schema

### agent_searches Table
```sql
CREATE TABLE agent_searches (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  agent_type TEXT NOT NULL,       -- 'claude_haiku' | 'claude_sonnet' | 'claude_opus'
  search_type TEXT NOT NULL,      -- 'bible_verse' | 'sermon_help' | etc.
  query TEXT NOT NULL,
  response TEXT,
  metadata TEXT,                  -- JSON object
  success INTEGER NOT NULL DEFAULT 1,
  error_message TEXT,
  response_time_ms INTEGER,
  tokens_used INTEGER,
  cost_usd REAL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  synced_at TEXT,
  dirty INTEGER NOT NULL DEFAULT 1,
  op TEXT NOT NULL DEFAULT 'upsert',
  version INTEGER NOT NULL DEFAULT 0
);
```

## Configuration

### Environment Variables
Create a `.env` file with:
```
EXPO_PUBLIC_CLAUDE_API_KEY=your_claude_api_key_here
```

### Settings Screen
Access Claude API settings at `/settings/claude` to:
- Configure API key
- Select Claude model (Haiku/Sonnet/Opus)
- Enable/disable the service

## API Integration

### Claude Service
- `services/claudeService.ts` - Core Claude API integration
- `services/bibleVerseService.ts` - Bible-specific service with database logging
- `services/configService.ts` - Configuration management

### Prompt Format
The system uses this prompt format for Bible verse searches:
```
"Search for Bible verse : {verse} {translation}. Return only the actual Bible verse."
```

Example: "Search for Bible verse : John 3:16 CSB. Return only the actual Bible verse."

## Usage

### In Sermon Editor
1. Open create or edit sermon page
2. Click the book icon in the header
3. Select Bible translation (KJV, NASB, ESV, CSB, NIV, NLT)
4. Enter verse reference (e.g., "John 3:16")
5. Click "Fetch" to search
6. Copy verse text or insert into sermon

### Translation Buttons
- **KJV** - King James Version
- **NASB** - New American Standard Bible  
- **ESV** - English Standard Version
- **CSB** - Christian Standard Bible (default)
- **NIV** - New International Version
- **NLT** - New Living Translation

## Migration

The database migration is automatically applied when the app starts:
- Migration v2 adds the `agent_searches` table
- Includes all necessary indexes for performance
- Backward compatible with existing data

## Error Handling

- API key validation
- Network error handling
- Graceful fallbacks for failed searches
- User-friendly error messages
- Database logging of all errors

## Future Enhancements

- Support for verse ranges (e.g., "John 3:16-18")
- Multiple verse search
- Verse context and commentary
- Integration with other Bible APIs
- Offline verse caching
- Search history and favorites