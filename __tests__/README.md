# API Tests

This directory contains comprehensive tests for all API endpoints in the application.

## Test Structure

```
__tests__/
├── __mocks__/          # Mock implementations
│   ├── supabase.js
│   └── lib/
│       ├── supabase.js
│       ├── youtube.js
│       └── cache.js
├── helpers/
│   └── test-helpers.js  # Test utility functions
└── api/
    ├── users/
    │   └── [user_id]/
    │       ├── features.test.js
    │       └── tutorials/
    │           ├── [tutorial_id]/
    │           │   └── interactions.test.js
    │           └── tutorials.test.js
    └── tutorials/
        ├── search.test.js
        └── cache/
            └── [query].test.js
```

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Test Coverage

### 1. POST /api/users/{user_id}/features
- ✅ Create new feature analysis for user
- ✅ Update existing feature analysis
- ✅ Handle user not found (404)
- ✅ Handle database errors (500)

### 2. GET /api/users/{user_id}/features
- ✅ Return user features successfully
- ✅ Handle user not found (404)
- ✅ Handle feature analysis not found (404)

### 3. POST /api/tutorials/search
- ✅ Search with cached results
- ✅ Search with force_refresh
- ✅ Validate required features (400)
- ✅ Update existing tutorial with higher score
- ✅ Handle YouTube API errors gracefully

### 4. POST /api/users/{user_id}/tutorials/{tutorial_id}/interactions
- ✅ Create new interaction
- ✅ Update existing interaction
- ✅ Handle user not found (404)
- ✅ Handle tutorial not found (404)
- ✅ Handle matched_features

### 5. GET /api/users/{user_id}/tutorials
- ✅ Return all tutorials
- ✅ Filter saved tutorials
- ✅ Filter liked tutorials
- ✅ Include feature-matched tutorials
- ✅ Handle user not found (404)
- ✅ Validate filter parameter (400)
- ✅ Sort by view count and score

### 6. GET /api/tutorials/cache/{query}
- ✅ Return cached results
- ✅ Return not cached status
- ✅ Decode URL-encoded queries
- ✅ Handle special characters
- ✅ Handle errors gracefully

## Test Utilities

The `test-helpers.js` file provides utility functions for creating mock objects:
- `createMockRequest()` - Create mock Next.js request
- `createMockUser()` - Create mock user object
- `createMockFeatureAnalysis()` - Create mock feature analysis
- `createMockTutorial()` - Create mock tutorial
- `createMockInteraction()` - Create mock interaction

## Mocks

All external dependencies are mocked:
- **Supabase**: Database operations are mocked
- **YouTube API**: YouTube search is mocked
- **Cache**: Cache operations are mocked

This ensures tests run quickly and don't require actual API keys or database connections.

