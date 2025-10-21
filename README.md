# Pokemon Battle Simulator - AntStack Technical Assessment

## Quick Start

This Pokemon Battle Simulator API includes tournament management and battle simulation functionality.

### Main Endpoints:

**Tournament Management:**
- `POST /api/tournaments` - Create tournament
- `GET /api/tournaments/live` - List live tournaments  
- `GET /api/tournaments/completed` - List completed tournaments
- `GET /api/tournaments/:id/results` - Get tournament results

**Battle Simulation:**
- `POST /api/tournaments/:tournamentId/battle` - Add battle to tournament

**Pokemon Data:**
- `GET /api/pokemon/list` - Get Pokemon list with filtering and pagination

**Authentication:**
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

Request body:

```json
{
  "attacker": "pikachu",
  "defender": "bulbasaur"
}
```

Response:

```json
{
  "battle": {
    "id": "<battleId>",
    "tournamentId": "<tournamentId>",
    "battleNumber": 1,
    "attacker1Name": "pikachu",
    "attacker2Name": "bulbasaur",
    "winnerName": "pikachu",
    "winnerRemainingHp": 37,
    "createdAt": "2025-01-01T00:00:00.000Z"
  }
}
```

How to use:
- Ensure a `Tournament` exists with at least: `status: 'live'`, `maxRounds`, `rounds: []`, and `hpState: {}`.
- Send the POST above; the service simulates the battle, persists it, updates per-Pokémon HP, increments rounds, and marks the tournament `completed` when `maxRounds` is reached.


## Battle API Reference

### Endpoint
- Method: `POST`
- Path: `/tournaments/:tournamentId/battle`
- Auth: Wrapped by `authenticate` and `rateLimiter` middleware

### Request
- Path params:
  - `tournamentId` (string, Mongo ObjectId): Existing tournament id
- Headers:
  - `X-API-Key` if API key auth is enabled in your environment
  - or `Authorization: Bearer <token>` if JWT auth is enabled
- Body (JSON):
  - `attacker` (string | number): Pokémon name or numeric id supported by PokéAPI
  - `defender` (string | number): Pokémon name or numeric id supported by PokéAPI

Example:
```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -H "X-API-Key: test-api-key-123-user1" \
  http://localhost:3000/api/tournaments/<tournamentId>/battle \
  -d '{"attacker":"pikachu","defender":"bulbasaur"}'
```

### Successful Response (201)
```json
{
  "battle": {
    "id": "<battleId>",
    "tournamentId": "<tournamentId>",
    "battleNumber": 1,
    "attacker1Name": "pikachu",
    "attacker2Name": "bulbasaur",
    "winnerName": "pikachu",
    "winnerRemainingHp": 37,
    "createdAt": "2025-01-01T00:00:00.000Z"
  }
}
```

### Error Responses
- 400 Bad Request:
  - Validation error (missing/invalid `attacker` or `defender`)
  - Same Pokémon for attacker and defender: `{ "message": "Cannot battle the same Pokemon" }`
  - Tournament ended by time: `{ "message": "Tournament has ended" }`
  - Tournament reached round limit: `{ "message": "Tournament round limit reached" }`
  - Tournament not live: `{ "message": "Tournament is not live" }`
- 401 Unauthorized: Missing or invalid credentials
- 404 Not Found: Tournament does not exist: `{ "message": "Tournament not found" }`
- 429 Too Many Requests: Rate limit exceeded (when limiter is enabled)
- 500 Internal Server Error: `{ "message": "Failed to add battle to tournament" }`

### Side Effects and State
- A `Battle` document is created and linked to the `Tournament`.
- `Tournament.rounds` array is appended with the new battle id.
- `Tournament.hpState` is updated for both Pokémon based on the winner’s remaining HP.
- If `Tournament.rounds.length >= Tournament.maxRounds`, `Tournament.status` is set to `completed`.


## Required Data Structures

### Tournament document (MongoDB)
- Required fields used by the controller:
  - `status`: string enum, must be `'live'` to allow battles
  - `maxRounds`: number, total rounds allowed before auto-complete
  - `startTime`: number (ms) or Date (used for time comparisons)
  - `endTime`: number (ms) or Date (used to detect end)
  - `rounds`: `ObjectId[]` of `Battle` documents (start with empty array)
  - `hpState`: object map `{ "<pokemonId>-<pokemonName>": number }` to track remaining HP across rounds (start as `{}`)

Example minimal tournament JSON (conceptual):
```json
{
  "_id": "<tournamentId>",
  "name": "Battle Cup",
  "status": "live",
  "maxRounds": 3,
  "startTime": 1730000000000,
  "endTime": 1730003600000,
  "rounds": [],
  "hpState": {}
}
```

### Battle document (created by the endpoint)
- Fields produced by the service include: `tournamentId`, `userId`, `battleNumber`, `attacker1Id`, `attacker1Name`, `attacker2Id`, `attacker2Name`, `winnerName`, `winnerRemainingHp`, `createdAt`.


## Testing Expectations and Structure

If you are writing tests around the battle endpoint, we recommend asserting the following:
- Setup: Insert a `Tournament` with fields listed above and `status: 'live'`.
- Request: POST `/api/tournaments/:tournamentId/battle` with valid `attacker` and `defender`.
- Expect 201 Created and a response object `battle` containing at least:
  - `id`, `tournamentId`, `battleNumber`, `attacker1Name`, `attacker2Name`, `winnerName`, `winnerRemainingHp`, `createdAt`.
- Verify DB side effects:
  - The `Battle` is persisted and linked via `tournamentId`.
  - `Tournament.rounds.length` increments.
  - `Tournament.hpState` contains keys for the two Pokémon, with the loser set to `0` and the winner set to `winnerRemainingHp`.
- Edge cases to test:
  - Same `attacker` and `defender` → 400 with `Cannot battle the same Pokemon`.
  - After `maxRounds` battles, the next call returns 400 with `Tournament round limit reached` and the tournament `status` is `completed`.
  - When `endTime` is in the past while `status` still `live`, the controller will mark the tournament `completed` and reject further battles accordingly.

Example Jest snippet:
```js
const res = await request(app)
  .post(`/api/tournaments/${tournamentId}/battle`)
  .set('X-API-Key', TEST_API_KEY)
  .send({ attacker: 'pikachu', defender: 'bulbasaur' });

expect(res.status).toBe(201);
expect(res.body.battle).toMatchObject({
  tournamentId: tournamentId,
  attacker1Name: expect.any(String),
  attacker2Name: expect.any(String),
  winnerName: expect.any(String),
  winnerRemainingHp: expect.any(Number)
});
```

What you need to figure out in your tests or setup:
- How you seed or create a minimal `Tournament` document before calling the endpoint.
- How you choose `attacker` and `defender` that are supported by the existing PokéAPI integration (names like `pikachu`, `bulbasaur` are safe choices).
- Any auth header values required by your environment (API key or Bearer token).


## Assessment Overview

Welcome to the AntStack technical assessment! You are tasked with fixing critical system failures in a Pokemon Battle Simulator API. This assessment evaluates your ability to:

- **Debug and fix broken systems**
- **Implement authentication and authorization**
- **Work with databases and data validation**
- **Build RESTful APIs with proper error handling**
- **Implement caching and rate limiting**

**Assessment Duration**: 2-3 hours  
**Difficulty Level**: Intermediate to Advanced  
**Total Tasks**: 8 broken systems to fix

## Assessment Instructions

1. **Read this README completely** before starting
2. **Fix systems in order** (Task 1 → Task 2 → ... → Task 8)
3. **Test each fix** before moving to the next task
4. **Run `npm test`** frequently to verify your progress
5. **Submit working code** that passes all tests

## Current System Issues

The following critical systems are currently broken and need to be fixed:

### 1. **Authentication Middleware**
- **File**: `src/middleware/auth.js`
- **Issue**: Authentication function is empty, no JWT validation implemented
- **Impact**: No API endpoints are accessible

### 2. **Auth Controller**
- **File**: `src/controllers/authController.js`
- **Issue**: Always returns "Auth controller is broken" error
- **Impact**: User registration and login endpoints don't work

### 3. **Rate Limiting System**
- **File**: `src/middleware/rateLimiter.js`
- **Issue**: All requests are being blocked with "Rate limiter is broken"
- **Impact**: Even if auth works, requests are blocked

### 4. **Caching System**
- **File**: `src/utils/cache.js`
- **Issue**: Cache functions are empty stubs
- **Impact**: Poor performance, unnecessary API calls

### 5. **Pokemon Controller**
- **File**: `src/controllers/pokemonController.js`
- **Issue**: Always returns "Pokemon controller is broken" error
- **Impact**: Pokemon list endpoint doesn't work

### 6. **Validation System**
- **File**: `src/utils/validators.js`
- **Issue**: Always throws "Validation system is broken" error
- **Impact**: All input validation fails, breaking all endpoints

### 7. **Database Schemas**
- **Files**: `src/models/User.js`, `src/models/Tournament.js`
- **Issue**: User and Tournament schemas are empty, no field definitions
- **Impact**: User and Tournament database operations fail, Battle schema works correctly

### 8. **Request Logging System**
- **File**: `src/server.js`
- **Issue**: No request logging middleware implemented
- **Impact**: No access logs are created for API requests

## Working Systems

The following systems are working correctly and should NOT be modified:

- **Battle Logic**: `src/services/battle.service.js` - Pokemon battle simulation works perfectly
- **Database Models**: All Mongoose models are functional
- **API Routes**: Route definitions are correct
- **Validation**: Input validation schemas work properly

## Tournament Management Endpoints

**Note**: The tests expect these tournament management endpoints to be implemented. You'll need to create these as part of the assessment:

### Create Tournament
- **POST** `/api/tournaments`
- **Headers**: `X-API-Key: test-api-key-123-user1` or `Authorization: Bearer <token>`
- **Body**: 
  ```json
  {
    "name": "Tournament Name",
    "max_rounds": 5,
    "tournament_active_time": 30
  }
  ```
- **Response (201)**:
  ```json
  {
    "tournament": {
      "id": "68f686043ac9ea1dbe06308b",
      "name": "Tournament Name",
      "status": "live",
      "max_rounds": 5,
      "next_round": 1,
      "tournament_ends_in": "2h 30m 45s"
    }
  }
  ```

### List Live Tournaments  
- **GET** `/api/tournaments/live`
- **Headers**: `X-API-Key: test-api-key-123-user1` or `Authorization: Bearer <token>`
- **Response (200)**:
  ```json
  {
    "tournaments": [
      {
        "id": "68f686043ac9ea1dbe06308b",
        "name": "Tournament Name",
        "max_rounds": 5,
        "next_round": 1,
        "tournament_ends_in": "2h 30m 45s"
      }
    ]
  }
  ```
- **Note**: Auto-completes expired tournaments (moves them to completed status)

### List Completed Tournaments
- **GET** `/api/tournaments/completed`
- **Headers**: `X-API-Key: test-api-key-123-user1` or `Authorization: Bearer <token>`
- **Response (200)**:
  ```json
  {
    "tournaments": [
      {
        "id": "68f686043ac9ea1dbe06308b",
        "name": "Tournament Name",
        "status": "completed",
        "max_rounds": 5,
        "rounds": [
          {
            "battleNumber": 1,
            "attacker1": "pikachu",
            "attacker2": "bulbasaur",
            "winner": {
              "name": "pikachu",
              "remainingHp": 3
            },
            "createdAt": "2025-10-20T18:57:15.174Z"
          }
        ]
      }
    ]
  }
  ```

### Get Tournament Results
- **GET** `/api/tournaments/:id/results`
- **Headers**: `X-API-Key: test-api-key-123-user1` or `Authorization: Bearer <token>`
- **Response (200)**:
  ```json
  {
    "tournament": {
      "id": "68f686043ac9ea1dbe06308b",
      "name": "Tournament Name",
      "status": "completed",
      "maxRounds": 5,
      "rounds": [
        {
          "battleNumber": 1,
          "attacker1": "pikachu",
          "attacker2": "bulbasaur",
          "winner": {
            "name": "pikachu",
            "remainingHp": 3
          },
          "createdAt": "2025-10-20T18:57:15.174Z"
        }
      ]
    }
  }
  ```

**Important Notes**:
- Battle responses show Pokemon names as simple strings (e.g., `"attacker1": "pikachu"`) rather than objects with IDs
- `tournament_ends_in` should be in human-readable format: "2h 30m 45s", "45m 30s", "30s", or "Expired"
- Expired tournaments are automatically moved to "completed" status
- All endpoints require authentication via API key or JWT token

## Additional API Endpoints

### Pokemon List
- **GET** `/api/pokemon/list`
- **Headers**: `X-API-Key: test-api-key-123-user1` or `Authorization: Bearer <token>`
- **Query Parameters**:
  - `page` (optional): Page number (default: 1, min: 1)
  - `limit` (optional): Items per page (default: 20, min: 1, max: 100)
  - `type` (optional): Filter by Pokemon type (e.g., "fire", "water")
  - `generation` (optional): Filter by generation (1-8)
  - `minStats` (optional): Minimum total stats
  - `maxStats` (optional): Maximum total stats
  - `sortBy` (optional): Sort field ("name", "height", "weight", "base_experience")
  - `sortOrder` (optional): Sort order ("asc" or "desc")
- **Response (200)**:
  ```json
  {
    "data": [
      {
        "id": 25,
        "name": "pikachu",
        "height": 4,
        "weight": 60,
        "base_experience": 112,
        "types": ["electric"]
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "pages": 5
    },
    "cached": false,
    "executionTime": 150
  }
  ```

### User Registration
- **POST** `/api/auth/register`
- **Body**:
  ```json
  {
    "username": "testuser",
    "password": "Password123!"
  }
  ```
- **Response (201)**:
  ```json
  {
    "user": {
      "id": "68f686043ac9ea1dbe06308b",
      "username": "testuser",
      "createdAt": "2025-10-20T18:57:15.174Z"
    }
  }
  ```

### User Login
- **POST** `/api/auth/login`
- **Body**:
  ```json
  {
    "username": "testuser",
    "password": "Password123!"
  }
  ```
- **Response (200)**:
  ```json
  {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "68f686043ac9ea1dbe06308b",
      "username": "testuser"
    }
  }
  ```

## Error Response Formats

### Common Error Responses
- **400 Bad Request**:
  ```json
  {
    "message": "Invalid input data",
    "details": "Validation error details"
  }
  ```

- **401 Unauthorized**:
  ```json
  {
    "message": "Authentication required"
  }
  ```

- **404 Not Found**:
  ```json
  {
    "message": "Tournament not found"
  }
  ```

- **429 Too Many Requests**:
  ```json
  {
    "message": "Rate limit exceeded"
  }
  ```

- **500 Internal Server Error**:
  ```json
  {
    "message": "Internal server error"
  }
  ```

## Validation Requirements

### Tournament Creation
- `name`: Required string, trimmed
- `max_rounds`: Required number, min: 1, max: 20
- `tournament_active_time`: Optional number, min: 1, max: 1440 (minutes)

### Battle Simulation
- `attacker`: Required string (Pokemon name)
- `defender`: Required string (Pokemon name)
- Cannot battle same Pokemon

### User Registration/Login
- `username`: Required string, trimmed
- `password`: Required string with complexity (uppercase, number, special character)

### Pokemon List Query
- `page`: Optional number, min: 1
- `limit`: Optional number, min: 1, max: 100
- `type`: Optional string (lowercase)
- `generation`: Optional number, min: 1, max: 8
- `sortBy`: Optional string ("name", "height", "weight", "base_experience")
- `sortOrder`: Optional string ("asc", "desc")

## Edge Cases and Error Scenarios

### Authentication Edge Cases
- **Missing API Key**: Returns 401 "Authentication required"
- **Invalid API Key**: Returns 401 "Authentication required"
- **Missing JWT Token**: Returns 401 "Authentication required"
- **Invalid JWT Token**: Returns 401 "Authentication required"
- **Expired JWT Token**: Returns 401 "Authentication required"

### Tournament Edge Cases
- **Create Tournament**:
  - Invalid `max_rounds` (outside 1-20 range): 400 validation error
  - Invalid `tournament_active_time` (outside 1-1440 range): 400 validation error
  - Missing required fields: 400 validation error

- **Battle Simulation**:
  - Same Pokemon for attacker and defender: 400 "Cannot battle the same Pokemon"
  - Tournament not found: 404 "Tournament not found"
  - Tournament not live: 400 "Tournament is not live"
  - Tournament ended by time: 400 "Tournament has ended"
  - Tournament reached max rounds: 400 "Tournament round limit reached"
  - Invalid Pokemon names: 400 validation error
  - Missing attacker/defender: 400 validation error

- **Tournament Status**:
  - Expired tournaments auto-complete to "completed" status
  - Live tournaments show `tournament_ends_in` in human-readable format
  - Completed tournaments show detailed battle information

### Pokemon List Edge Cases
- **Invalid Query Parameters**:
  - Invalid `page` (less than 1): 400 validation error
  - Invalid `limit` (outside 1-100 range): 400 validation error
  - Invalid `generation` (outside 1-8 range): 400 validation error
  - Invalid `sortBy` (not in allowed values): 400 validation error
  - Invalid `sortOrder` (not "asc" or "desc"): 400 validation error

### Rate Limiting Edge Cases
- **Rate Limit Exceeded**: 429 "Rate limit exceeded" with headers:
  - `X-RateLimit-Limit`: Maximum requests allowed
  - `X-RateLimit-Remaining`: Requests remaining in current window
  - `X-RateLimit-Reset`: Time when limit resets

### Caching Edge Cases
- **Cache Miss**: First request shows `cached: false`
- **Cache Hit**: Subsequent identical requests show `cached: true`
- **Cache Expiry**: Expired cache entries are automatically refreshed

### Database Edge Cases
- **User Registration**:
  - Duplicate username: 409 "Username already exists"
  - Weak password: 400 validation error
  - Missing required fields: 400 validation error

- **User Login**:
  - Invalid credentials: 401 "Invalid credentials"
  - User not found: 401 "Invalid credentials"

### System Edge Cases
- **Server Errors**: 500 "Internal server error" for unexpected failures
- **Network Timeouts**: Handle gracefully with appropriate error messages
- **Database Connection Issues**: Return 500 with error message

## Assessment Tasks (Complete in Order)

### Task 1: Fix Authentication Middleware
**File**: `src/middleware/auth.js`

#### Current Problem
The authentication middleware function is completely empty, so no JWT validation is implemented.

#### What You Need to Fix
1. **JWT Token Authentication**:
   - Extract token from Authorization Bearer header
   - Validate token using JWT verification with environment secret
   - Allow valid tokens to proceed to next middleware
   - Return 401 for invalid/expired tokens
   - Handle missing credentials properly

#### Implementation Steps
1. Implement JWT token extraction from Authorization header
2. Implement JWT verification using jwt.verify() with process.env.JWT_SECRET
3. Add proper error handling for different scenarios
4. Call next() for valid tokens
5. Return appropriate error responses for invalid/missing tokens

#### Expected Result
- Valid JWT token should return 200 (after other systems are fixed)
- Invalid/expired tokens should return 401
- Missing credentials should return 401

### Task 2: Fix Auth Controller
**File**: `src/controllers/authController.js`

#### Current Problem
The auth controller always returns 500 error with "Auth controller is broken" message.

#### What You Need to Fix
1. **User Registration** (`/api/auth/register`):
   - Validate input using validation schemas
   - Check if username already exists
   - Hash password using bcrypt with proper salt rounds
   - Create user in database
   - Return 201 with user data (without password)

2. **User Login** (`/api/auth/login`):
   - Validate input using validation schemas
   - Find user by username
   - Compare password using bcrypt
   - Generate JWT token with proper payload and expiration
   - Return token on success

#### Implementation Steps
1. Remove the lines that always return 500 errors
2. Implement registration logic with password hashing
3. Implement login logic with credential validation
4. Add proper error handling for validation and database errors
5. Generate JWT tokens for successful login

#### Expected Result
- Registration should return 201 with user data
- Login should return 200 with JWT token
- Invalid credentials should return 401
- Duplicate username should return 409

### Task 3: Fix Rate Limiting System
**File**: `src/middleware/rateLimiter.js`

#### Current Problem
The rate limiter always blocks all requests with "Rate limiter is broken" message.

#### What You Need to Fix
1. **Request Tracking**:
   - Track requests per IP address using rateLimitStore Map
   - Get client IP from request headers
   - Store request count and reset time for each IP

2. **Rate Limit Logic**:
   - Use environment variables for window and max requests
   - Reset counters when time window expires
   - Increment counter for each request
   - Block requests when limit exceeded

3. **Response Headers**:
   - Add rate limit headers to responses
   - Include limit, remaining, and reset time information

#### Implementation Steps
1. Remove the line that always returns 429 error
2. Implement IP-based request tracking
3. Implement time window logic
4. Implement counter increment and limit checking
5. Add rate limit headers to responses
6. Call next() for allowed requests

#### Expected Result
- First 100 requests should succeed (within limit)
- 101st request should return 429 with rate limit headers
- Headers should show remaining requests and reset time

### Task 4: Fix Caching System
**File**: `src/utils/cache.js`

#### Current Problem
The cache system has empty function stubs, so no caching is implemented.

#### What You Need to Fix
1. **Cache Get Function**:
   - Implement cache retrieval logic
   - Check if key exists and is not expired
   - Return cached value if valid
   - Handle expired entries appropriately

2. **Cache Set Function**:
   - Implement cache storage logic
   - Store value with expiration time based on TTL
   - Choose appropriate data structure (Map, Object, etc.)

3. **Cache Key Generation**:
   - Implement consistent key generation
   - Sort parameters for consistent keys
   - Create proper key format

4. **Cache Management**:
   - Implement cache clearing functionality
   - Handle memory management appropriately

#### Implementation Hints
- **Data Structure Options**: Consider using Map, Object, or any other data structure
- **TTL Support**: Handle expiration, key generation, and cache management
- **Memory Management**: Consider memory usage and cleanup strategies
- **Key Consistency**: Ensure keys are generated consistently for the same parameters

#### Implementation Steps
1. Choose your caching approach (Map, Object, etc.)
2. Implement cache retrieval with expiration checking
3. Implement cache storage with TTL support
4. Implement key generation logic
5. Implement cache clearing functionality

#### Expected Result
- First request should have cached: false
- Second identical request should have cached: true
- Cached responses should be faster

### Task 5: Fix Pokemon Controller
**File**: `src/controllers/pokemonController.js`

#### Current Problem
The Pokemon controller always returns 500 error with "Pokemon controller is broken" message.

#### What You Need to Fix
1. **Input Validation**:
   - Use validation schemas to validate query parameters
   - Handle validation errors with 400 status

2. **Caching Logic**:
   - Generate cache key using cache utility
   - Check cache first before making API calls
   - Return cached data if available

3. **Data Fetching**:
   - Use PokeAPI service to fetch Pokemon data
   - Apply filters: type, generation, minStats, maxStats
   - Apply sorting: sortBy, sortOrder

4. **Pagination**:
   - Calculate offset and total pages
   - Add pagination metadata to response

5. **Response Format**:
   - Return data, pagination, cached status, executionTime
   - Cache results for future requests

#### Implementation Steps
1. Remove the line that always returns 500 error
2. Implement parameter validation
3. Implement caching logic
4. Implement data fetching from PokeAPI
5. Implement filtering and sorting
6. Implement pagination
7. Add proper error handling

#### Expected Result
- Should return Pokemon list with pagination info
- Should support filtering by type, generation, stats
- Should support sorting by name, height, weight, base_experience
- Should cache responses for performance

### Task 6: Fix Validation System
**File**: `src/utils/validators.js`

#### Current Problem
The validation system always throws "Validation system is broken" error for all validation attempts.

#### What You Need to Fix
1. **Pokemon List Schema**:
   - Page number with minimum value 1
   - Limit with range 1-100
   - Optional type filter (lowercase)
   - Optional generation filter (1-8)
   - Optional stats range filters
   - Sort by name, height, weight, or base_experience
   - Sort order asc or desc

2. **Battle Simulation Schema**:
   - Pokemon IDs as required integers with minimum value 1

3. **Tournament Schemas**:
   - Tournament name as required string
   - Max rounds with range 1-20
   - Tournament active time with range 1-1440 minutes
   - Attacker and defender as required lowercase strings

4. **Auth Schemas**:
   - Username as required string
   - Password with complexity requirements (uppercase, number, special character)

5. **Validate Function**:
   - Use Joi validation with proper error handling
   - Return validated data or throw Joi errors
   - Strip unknown fields and validate all at once

#### Implementation Steps
1. Remove the line that always throws error
2. Implement all Joi schemas with proper validation rules
3. Implement validate function with proper error handling
4. Export all schemas and validate function

#### Expected Result
- Valid requests should work normally
- Invalid requests should return 400 with validation error details
- All endpoints should have proper input validation

### Task 7: Fix Database Schemas
**Files**: `src/models/User.js`, `src/models/Tournament.js`

#### Current Problem
User and Tournament schemas are empty, so database operations fail.

#### What You Need to Fix

1. **User Schema** (`src/models/User.js`):
   - Username field: required, unique, trimmed string
   - Password field: required string
   - CreatedAt field: default to current date
   - Virtual relationship to battles

2. **Tournament Schema** (`src/models/Tournament.js`):
   - Name field: required, trimmed string
   - Status field: enum with live/completed values, indexed
   - MaxRounds field: required number with minimum 1
   - StartTime field: required date, default to now
   - EndTime field: required date
   - HpState field: mixed type for HP tracking, default empty object
   - WinnerName field: optional string
   - Rounds field: array of Battle references
   - CreatedAt field: default to current date

#### Implementation Steps
1. Remove the empty schema definitions
2. Implement User schema with proper field types and validation
3. Implement Tournament schema with all required fields
4. Add proper indexes for performance
5. Add virtual relationships
6. **Note**: Battle schema is already working - don't modify it

#### Expected Result
- User registration should work and store data in database
- Tournament creation should work and store data in database
- Database operations should work correctly
- Relationships between models should work

### Task 8: Fix Request Logging System
**File**: `src/server.js`

#### Current Problem
No request logging middleware is implemented, so no access logs are created for API requests.

#### What You Need to Fix
1. **Morgan Middleware Setup**:
   - Import morgan and fs modules
   - Create access log file path
   - Set up Morgan with combined format
   - Write logs to access.log file

2. **Log File Management**:
   - Create access.log file in project root
   - Use append mode for log file
   - Ensure logs are written for all requests

#### Implementation Steps
1. Import required modules (morgan, fs, path)
2. Create access log file path
3. Set up Morgan middleware with file stream
4. Add Morgan middleware to Express app

#### Expected Result
- access.log file should be created in project root
- All API requests should be logged to the file
- Log format should include method, URL, status, response time

## Testing Your Implementation

### Run Tests
   ```bash
npm test
```

**Note**: Tests use MongoDB Memory Server - no real database setup required. Tests run in isolation with in-memory MongoDB instances.

### Key Test Cases to Pass
1. **Authentication Middleware Test**: API endpoints should accept valid API keys
2. **Auth Controller Test**: Registration and login should work properly
3. **Rate Limiting Test**: Should allow requests within limit, block when exceeded
4. **Caching Test**: Should cache responses and return cached data
5. **Pokemon List Test**: Should return Pokemon data with proper pagination
6. **Validation Test**: Should validate input data and return proper errors for invalid input
7. **Database Test**: Should store and retrieve data correctly with proper schemas

### Manual Testing

#### 1. Test Authentication
```bash
# Test with API Key
curl -H "X-API-Key: test-api-key-123-user1" http://localhost:3000/api/pokemon/list

# Test with JWT Token (after login)
curl -H "Authorization: Bearer <your-jwt-token>" http://localhost:3000/api/pokemon/list
```

#### 2. Test User Registration and Login
```bash
# Register a new user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username": "testuser", "password": "Password123!"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "testuser", "password": "Password123!"}'
```

#### 3. Test Tournament Management
```bash
# Create a tournament
curl -X POST http://localhost:3000/api/tournaments \
  -H "Content-Type: application/json" \
  -H "X-API-Key: test-api-key-123-user1" \
  -d '{"name": "Test Tournament", "max_rounds": 3, "tournament_active_time": 10}'

# List live tournaments
curl -H "X-API-Key: test-api-key-123-user1" http://localhost:3000/api/tournaments/live

# List completed tournaments
curl -H "X-API-Key: test-api-key-123-user1" http://localhost:3000/api/tournaments/completed

# Get tournament results
curl -H "X-API-Key: test-api-key-123-user1" http://localhost:3000/api/tournaments/<tournament-id>/results
```

#### 4. Test Battle Simulation
```bash
# Add a battle to tournament
curl -X POST http://localhost:3000/api/tournaments/<tournament-id>/battle \
  -H "Content-Type: application/json" \
  -H "X-API-Key: test-api-key-123-user1" \
  -d '{"attacker": "pikachu", "defender": "bulbasaur"}'
```

#### 5. Test Pokemon List with Filtering
```bash
# Basic list
curl -H "X-API-Key: test-api-key-123-user1" "http://localhost:3000/api/pokemon/list"

# With filtering and pagination
curl -H "X-API-Key: test-api-key-123-user1" "http://localhost:3000/api/pokemon/list?type=fire&generation=1&page=1&limit=10&sortBy=name&sortOrder=asc"
```

#### 6. Test Rate Limiting
```bash
# Make multiple requests quickly - should eventually get 429 error
for i in {1..105}; do
  curl -H "X-API-Key: test-api-key-123-user1" http://localhost:3000/api/pokemon/list
done
```

#### 7. Test Caching
```bash
# First request should be slow (uncached)
time curl -H "X-API-Key: test-api-key-123-user1" "http://localhost:3000/api/pokemon/list?type=fire"

# Second identical request should be fast (cached)
time curl -H "X-API-Key: test-api-key-123-user1" "http://localhost:3000/api/pokemon/list?type=fire"
```

#### 8. Test Edge Cases
```bash
# Test same Pokemon battle (should fail)
curl -X POST http://localhost:3000/api/tournaments/<tournament-id>/battle \
  -H "Content-Type: application/json" \
  -H "X-API-Key: test-api-key-123-user1" \
  -d '{"attacker": "pikachu", "defender": "pikachu"}'

# Test invalid tournament ID
curl -X POST http://localhost:3000/api/tournaments/invalid-id/battle \
  -H "Content-Type: application/json" \
  -H "X-API-Key: test-api-key-123-user1" \
  -d '{"attacker": "pikachu", "defender": "bulbasaur"}'

# Test invalid Pokemon list parameters
curl -H "X-API-Key: test-api-key-123-user1" "http://localhost:3000/api/pokemon/list?page=0&limit=200&sortBy=invalid"

# Test missing authentication
curl http://localhost:3000/api/pokemon/list

# Test invalid user registration
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username": "test", "password": "weak"}'
```

## 📊 Expected System Behavior

### Authentication Flow
1. Request comes in with API key
2. Middleware validates the key
3. Valid key → proceed to next middleware
4. Invalid key → return 401 error

### Rate Limiting Flow
1. Request comes in
2. Check IP address against rate limit store
3. Within limit → increment counter, proceed
4. Over limit → return 429 error

### Caching Flow
1. Request comes in
2. Generate cache key from parameters
3. Check cache for existing data
4. Found & not expired → return cached data
5. Not found or expired → fetch from API, cache result

### Pokemon List Flow
1. Validate query parameters
2. Generate cache key
3. Check cache first
4. If cached → return cached data
5. If not cached → fetch from PokeAPI
6. Apply filters and sorting
7. Cache result and return response

## 🔍 Debugging Tips

1. **Check Console Logs**: Look for error messages in server logs
2. **Test Each Component**: Fix one system at a time
3. **Verify Environment Variables**: Make sure all required env vars are set
4. **Check Dependencies**: Ensure all required packages are installed

## 📝 Code Quality Requirements

- **Clean Code**: Write readable, well-structured code
- **Error Handling**: Handle edge cases and errors gracefully
- **Comments**: Add minimal, meaningful comments where necessary
- **No TODO Comments**: Remove any TODO comments from your implementation

## Success Criteria

Your implementation is successful when:
- [ ] **Task 1**: Authentication middleware accepts valid JWT tokens and API keys
- [ ] **Task 2**: User registration and login work with proper password hashing
- [ ] **Task 3**: Rate limiting allows requests within limit, blocks when exceeded
- [ ] **Task 4**: Caching system stores and retrieves data with TTL
- [ ] **Task 5**: Pokemon list endpoint returns data with filtering, sorting, pagination
- [ ] **Task 6**: Input validation works correctly for all endpoints
- [ ] **Task 7**: Database schemas are properly defined and functional
- [ ] **Task 8**: Request logging system creates access.log file
- [ ] **All Tests Pass**: `npm test` returns 0 failures
- [ ] **No Error Messages**: No "broken" error messages remain

## Assessment Completion Guide

### Step 1: Setup
1. Run `npm install` to install dependencies
2. Set up your `.env` file with required environment variables
3. Run `npm test` to see current test failures

### Step 2: Fix Systems in Order
1. **Start with Task 1** (Authentication) - This unblocks other endpoints
2. **Continue with Task 2** (Auth Controller) - Enables user registration/login
3. **Fix Task 3** (Rate Limiting) - Prevents request blocking
4. **Fix Task 4** (Caching) - Improves performance
5. **Fix Task 5** (Pokemon Controller) - Main API functionality
6. **Fix Task 6** (Validation) - Input validation for all endpoints
7. **Fix Task 7** (Database Schemas) - Data persistence
8. **Fix Task 8** (Request Logging) - Access log file creation

### Step 3: Testing
1. Run `npm test` to verify all tests pass
2. Test each endpoint manually with curl commands
3. Verify caching, rate limiting, and authentication work
4. Check database operations work correctly

### Step 4: Final Verification
1. All 8 tasks completed successfully
2. All tests passing
3. No broken system error messages
4. API endpoints working with proper authentication
5. Database operations functional

## Assessment Evaluation

**AntStack will evaluate your submission based on:**

### Technical Skills (40%)
- **Code Quality**: Clean, readable, well-structured code
- **Error Handling**: Proper error handling and validation
- **Security**: Secure authentication and input validation
- **Performance**: Efficient caching and rate limiting

### Problem Solving (30%)
- **Debugging**: Ability to identify and fix broken systems
- **System Integration**: Understanding how components work together
- **Testing**: Thorough testing of implemented solutions

### Best Practices (20%)
- **API Design**: RESTful API design principles
- **Database Design**: Proper schema design and relationships
- **Middleware Usage**: Proper use of Express middleware
- **Environment Configuration**: Proper use of environment variables

### Documentation (10%)
- **Code Comments**: Minimal but meaningful comments
- **README Understanding**: Following instructions correctly
- **Testing**: Proper testing of implemented features

## Getting Started

1. **Clone the repository**
2. **Install dependencies**: `npm install`
3. **Set up environment variables** (see `.env.example`)
4. **Start fixing systems** in order (Task 1 → Task 8)
5. **Test frequently** with `npm test`
6. **Submit your working solution`

## Complete API Reference Summary

### Endpoints Overview
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | User registration | No |
| POST | `/api/auth/login` | User login | No |
| GET | `/api/pokemon/list` | Pokemon list with filtering | Yes |
| POST | `/api/tournaments` | Create tournament | Yes |
| GET | `/api/tournaments/live` | List live tournaments | Yes |
| GET | `/api/tournaments/completed` | List completed tournaments | Yes |
| GET | `/api/tournaments/:id/results` | Get tournament results | Yes |
| POST | `/api/tournaments/:id/battle` | Add battle to tournament | Yes |

### Key Response Formats
- **Tournament Creation**: Returns tournament with `tournament_ends_in` in human-readable format
- **Battle Responses**: Pokemon names as simple strings (`"attacker1": "pikachu"`)
- **Tournament Lists**: Auto-complete expired tournaments to "completed" status
- **Pokemon List**: Include pagination, caching status, and execution time
- **Error Responses**: Consistent JSON format with appropriate HTTP status codes

### Critical Requirements
- All endpoints require authentication (API key or JWT token)
- Time formatting: "2h 30m 45s", "45m 30s", "30s", or "Expired"
- Auto-complete expired tournaments
- Battle details show only essential information
- Proper validation for all inputs
- Rate limiting and caching implementation

## Additional Resources

- **Express.js**: [Express Documentation](https://expressjs.com/)
- **Mongoose**: [Mongoose Documentation](https://mongoosejs.com/)
- **JWT**: [JWT.io](https://jwt.io/)
- **Joi Validation**: [Joi Documentation](https://joi.dev/)
- **bcrypt**: [bcrypt Documentation](https://www.npmjs.com/package/bcrypt)

---

**Good luck with your AntStack assessment! Show us your problem-solving skills and attention to detail.** 🎉