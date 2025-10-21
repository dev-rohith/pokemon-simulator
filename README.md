# Pokemon Battle Simulator - Technical Assessment

## Overview

This is a Pokemon Battle Simulator backend where users can create tournaments, simulate Pokemon battles, and manage Pokemon data. The system includes tournament management, battle simulation with HP persistence, Pokemon data integration, and advanced filtering capabilities.

You are tasked with completing a Pokemon Battle Simulator system built with JavaScript, Node.js, Express, and MongoDB with Mongoose ODM. The system has authentication with specific permissions and capabilities.

**Technology Stack:** JavaScript, Node.js, Express, MongoDB with Mongoose ODM, External API Integration (PokeAPI)

## Submission Requirements
- Check out to `dev` branch and solve the assessment.
- Ensure all existing tests pass.
- Document any assumptions or design decisions made.
- Push the code to github `dev` branch.
- Raise a PR to `main` branch.
- Finally click on the submission button.
- Complete the implementation within the given timeframe - 3 days.

<p style="color: #d9534f; font-family: Arial, sans-serif;">
  <strong>Note:</strong> Please read all the instructions before starting the assessment. Do not modify anything here (README file) and workflows/scripts/tests; any changes will result in automatic disqualification. Ignore @llm-instructions comments on files and dont modify them. Please <strong>do not use AI tools (LLMs)</strong> to complete this assessment.It wastes both <strong>your time</strong> and <strong>ours</strong>. Thank you for understanding.
</p>

### Task Requirements
Authenticated users can:
1. Register and login with JWT authentication
2. Fetch Pokemon data with filtering, sorting, and pagination
3. Create and manage tournaments
4. Simulate Pokemon battles with HP persistence
5. View tournament results and statistics
6. Access Pokemon data with advanced filtering

## Setup Instructions

```bash
npm install        # Install all project dependencies
npm run dev        # Start the development server
npm test           # Run all tests
```

You've been provided with a partially implemented API codebase that simulates a real-world scenario where you need to debug existing functionality and complete missing features. This assessment evaluates your ability to work with existing code, implement RESTful APIs, external API integration, and maintain code quality standards.

## Task Description

Fix existing issues and implement missing Pokemon Battle Simulator features in the provided repository.

## Implementation Requirements

## Task 1: Authentication System

### 1.1 User Registration

**Endpoint**: `POST /api/auth/register`

**Input**:
```json
{
  "username": "trainer123",
  "password": "password123"
}
```

**Expected Output**:
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "username": "trainer123",
    "createdAt": "2025-01-20T10:30:00.000Z"
  }
}
```

**Validation Rules**:
- Username: 3-30 characters, required
- Password: minimum 6 characters, required
- Username must be unique

**Error Cases**:
- Invalid credentials: `401 Unauthorized`
- Missing fields: `400 Bad Request`

### 1.2 User Login

**Endpoint**: `POST /api/auth/login`

**Input**:
```json
{
  "username": "trainer123",
  "password": "password123"
}
```

**Expected Output**:
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "username": "trainer123"
  }
}
```

**Error Cases**:
- Invalid credentials: `401 Unauthorized`
- Missing fields: `400 Bad Request`

#### Validation Schemas (`src/utils/validators.js`)

- **registerSchema**: Add username (3-30 chars), password (min 6 chars)
- **loginSchema**: Add username and password validation
- **pokemonListSchema**: Add pagination (page/limit), type filter, generation filter, stats filters, sorting (sortBy/sortOrder)
- **createTournamentSchema**: Add name (required), max_rounds (1-20), tournament_active_time (1-1440 minutes)
- **addBattleToTournamentSchema**: Add attacker and defender validation

#### User Model (`src/models/User.js`)

- **Schema Fields**: username (required, unique, trimmed), password (required, hashed), createdAt
- **Schema Options**: Enable timestamps
- **Password Hashing**: Use bcrypt for password security
- **Indexes**: Create unique index on username

#### Authentication Middleware (`src/middleware/auth.js`)

- **Token Validation**: Check if token exists, return 401 if missing
- **JWT Secret**: Verify JWT_SECRET is configured, return 500 if missing
- **User Lookup**: Find user by decoded userId, return 401 if not found
- **Error Handling**: Catch JWT errors and return 401

## Task 2: Pokemon List API

### 2.1 Basic Pokemon List

**Endpoint**: `GET /api/pokemon/list`

**Headers**: `Authorization: Bearer <token>`

**Query Parameters**:
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)

**Expected Output**:
```json
{
  "data": [
    {
      "id": 1,
      "name": "bulbasaur",
      "height": 7,
      "weight": 69,
      "baseExperience": 64,
      "types": ["grass", "poison"],
      "stats": {
        "hp": 45,
        "attack": 49,
        "defense": 49,
        "specialAttack": 65,
        "specialDefense": 65,
        "speed": 45,
        "total": 318
      },
      "abilities": ["overgrow", "chlorophyll"],
      "sprite": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/1.png"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1000,
    "totalPages": 50
  },
  "cached": false,
  "executionTime": 150
}
```

**Requirements**:
- Fetch data from PokeAPI (https://pokeapi.co/api/v2)
- Calculate total stats (sum of all stat values)
- Include pagination metadata
- Track execution time

#### Pokemon Service (`src/services/pokeapi.service.js`)

- **External API Integration**: Fetch data from PokeAPI (https://pokeapi.co/api/v2)
- **Data Transformation**: Convert PokeAPI format to your format
- **Stats Calculation**: Calculate total stats (hp + attack + defense + specialAttack + specialDefense + speed)
- **Pagination Logic**: Implement offset-based pagination
- **Error Handling**: Handle API timeouts and failures gracefully

#### Pokemon Controller (`src/controllers/pokemonController.js`)

- **Authentication**: Protect all endpoints with auth middleware
- **Validation**: Validate query parameters using Joi schemas
- **Response Format**: Include data, pagination, cached status, execution time
- **Error Handling**: Return appropriate HTTP status codes

## Task 3: Caching System

### 3.1 Cache Implementation

**Requirements**:
- Cache Pokemon list responses for 5 minutes
- Cache individual Pokemon details for 10 minutes
- Include cache status in response (`cached: true/false`)
- Handle cache misses gracefully

**Expected Behavior**:
- First request: `cached: false`, normal execution time
- Subsequent identical requests: `cached: true`, faster execution
- Cache key should include all query parameters

**Example Cache Key**: `pokemon:list:page=1:limit=20:type=fire`

**Cache Response Example**:
```json
{
  "data": [...],
  "pagination": {...},
  "cached": true,
  "executionTime": 5
}
```

#### Cache Implementation (`src/utils/cache.js`)

- **In-Memory Cache**: Use Map or object for caching (no Redis required)
- **Cache Key Generation**: Include all query parameters in cache key
- **TTL Implementation**: Implement time-to-live with timestamps
- **Cache Hit/Miss Logic**: Track cache statistics
- **Memory Management**: Prevent memory leaks with proper cleanup

#### Cache Integration

- **Pokemon List Caching**: Cache Pokemon list responses for 5 minutes
- **Individual Pokemon Caching**: Cache Pokemon details for 10 minutes
- **Cache Status**: Include cached status in responses
- **Cache Key Pattern**: `pokemon:list:page=1:limit=20:type=fire`

## Task 4: Tournament Management

### 4.1 Create Tournament

**Endpoint**: `POST /api/tournaments`

**Headers**: `Authorization: Bearer <token>`

**Input**:
```json
{
  "name": "Elite Four Championship",
  "max_rounds": 5,
  "tournament_active_time": 60
}
```

**Expected Output**:
```json
{
  "message": "Tournament created successfully",
  "tournament": {
    "id": "507f1f77bcf86cd799439011",
    "name": "Elite Four Championship",
    "status": "live",
    "maxRounds": 5,
    "currentRound": 0,
    "tournamentActiveTime": 60,
    "endTime": "2025-01-20T11:30:00.000Z",
    "tournamentEndsIn": "59m 30s",
    "createdAt": "2025-01-20T10:30:00.000Z"
  }
}
```

**Validation Rules**:
- Name: required, string
- max_rounds: 1-20, required
- tournament_active_time: 1-1440 minutes (1 day), optional (default: 30)

### 4.2 List Live Tournaments

**Endpoint**: `GET /api/tournaments/live`

**Headers**: `Authorization: Bearer <token>`

**Expected Output**:
```json
{
  "tournaments": [
    {
      "id": "507f1f77bcf86cd799439011",
      "name": "Elite Four Championship",
      "status": "live",
      "maxRounds": 5,
      "currentRound": 2,
      "tournamentActiveTime": 60,
      "endTime": "2025-01-20T11:30:00.000Z",
      "tournamentEndsIn": "45m 15s",
      "createdAt": "2025-01-20T10:30:00.000Z"
    }
  ]
}
```

### 4.3 List Completed Tournaments

**Endpoint**: `GET /api/tournaments/completed`

**Headers**: `Authorization: Bearer <token>`

**Expected Output**:
```json
{
  "tournaments": [
    {
      "id": "507f1f77bcf86cd799439011",
      "name": "Elite Four Championship",
      "status": "completed",
      "totalRounds": 5,
      "completedAt": "2025-01-20T11:30:00.000Z",
      "createdAt": "2025-01-20T10:30:00.000Z"
    }
  ]
}
```

#### Tournament Model (`src/models/Tournament.js`)

- **Schema Fields**: name (required), status (live/completed), maxRounds (1-20), currentRound, tournamentActiveTime, endTime, rounds (array), hpState (object), userId (ObjectId)
- **Schema Options**: Enable timestamps
- **Indexes**: Create indexes for userId, status, endTime
- **Status Logic**: Auto-update status based on time and rounds

#### Tournament Controller (`src/controllers/tournamentController.js`)

- **Create Tournament**: Validate input, calculate endTime, set default values
- **List Tournaments**: Separate endpoints for live and completed tournaments
- **Time Formatting**: Human-readable time format ("59m 30s", "2h 15m", "Expired")
- **Status Updates**: Auto-complete tournaments on time expiry or max rounds

## Task 5: Battle Simulation

### 5.1 Add Battle to Tournament

**Endpoint**: `POST /api/tournaments/:tournamentId/battle`

**Headers**: `Authorization: Bearer <token>`

**Input**:
```json
{
  "attacker": "pikachu",
  "defender": "bulbasaur"
}
```

**Expected Output**:
```json
{
  "message": "Battle added successfully",
  "battle": {
    "id": "507f1f77bcf86cd799439012",
    "tournamentId": "507f1f77bcf86cd799439011",
    "battleNumber": 1,
    "attacker1Name": "pikachu",
    "attacker2Name": "bulbasaur",
    "winnerName": "pikachu",
    "winnerRemainingHp": 37,
    "loserName": "bulbasaur",
    "loserRemainingHp": 0,
    "rounds": 3,
    "battleLog": [
      {
        "round": 1,
        "attacker": "pikachu",
        "defender": "bulbasaur",
        "damage": 15,
        "defenderHpAfter": 30
      }
    ],
    "createdAt": "2025-01-20T10:35:00.000Z"
  }
}
```

**Battle Logic Requirements**:
- Pokemon with higher speed attacks first
- Damage = (attacker.attack - defender.defense) + random(1-10)
- Minimum damage = 1
- Track HP changes across battles
- Pokemon with 0 HP cannot battle
- Log each round with damage and remaining HP

### 5.2 Get Tournament Results

**Endpoint**: `GET /api/tournaments/:tournamentId/results`

**Headers**: `Authorization: Bearer <token>`

**Expected Output**:
```json
{
  "tournament": {
    "id": "507f1f77bcf86cd799439011",
    "name": "Elite Four Championship",
    "status": "completed",
    "maxRounds": 5,
    "totalRounds": 3,
    "rounds": [
      {
        "battleNumber": 1,
        "attacker1": "pikachu",
        "attacker2": "bulbasaur",
        "winner": {
          "name": "pikachu",
          "remainingHp": 37
        },
        "createdAt": "2025-01-20T10:35:00.000Z"
      }
    ],
    "completedAt": "2025-01-20T10:45:00.000Z"
  }
}
```

#### Battle Service (`src/services/battle.service.js`)

- **Battle Algorithm**: Turn-based combat with speed-based turn order
- **Damage Calculation**: (attacker.attack - defender.defense) + random(1-10)
- **HP Persistence**: Track Pokemon HP across multiple battles
- **Battle Logging**: Log each round with damage and remaining HP
- **Winner Determination**: Pokemon with 0 HP loses

#### Battle Model (`src/models/Battle.js`)

- **Schema Fields**: tournamentId (ObjectId), battleNumber, attacker1Name, attacker2Name, winnerName, winnerRemainingHp, loserName, loserRemainingHp, rounds, battleLog (array)
- **Schema Options**: Enable timestamps
- **Indexes**: Create indexes for tournamentId, battleNumber

#### Battle Controller

- **Add Battle**: Validate Pokemon names, check tournament status, simulate battle
- **HP State Management**: Update tournament hpState with remaining HP
- **Round Validation**: Ensure battles don't exceed max rounds
- **Error Handling**: Handle invalid Pokemon names, completed tournaments

## Task 6: Pokemon Filtering & Sorting

### 6.1 Filter by Type

**Endpoint**: `GET /api/pokemon/list?type=fire`

**Expected Output**: Only fire-type Pokemon

### 6.2 Filter by Generation

**Endpoint**: `GET /api/pokemon/list?generation=1`

**Expected Output**: Only generation 1 Pokemon (IDs 1-151)

### 6.3 Filter by Stats

**Endpoint**: `GET /api/pokemon/list?minStats=500&maxStats=700`

**Expected Output**: Pokemon with total stats between 500-700

### 6.4 Sort Pokemon

**Endpoint**: `GET /api/pokemon/list?sortBy=name&sortOrder=asc`

**Available Sort Fields**:
- `name` (alphabetical)
- `height` (numerical)
- `weight` (numerical)
- `base_experience` (numerical)

**Sort Orders**: `asc` or `desc`

### 6.5 Combined Filters

**Endpoint**: `GET /api/pokemon/list?type=water&generation=1&sortBy=name&sortOrder=asc&limit=10`

**Expected Output**: Water-type Pokemon from generation 1, sorted by name, limited to 10 results

#### Filtering Implementation

- **Type Filtering**: `pokemon.types.includes(filterType)`
- **Generation Filtering**: Pokemon ID ranges (Gen 1: 1-151, Gen 2: 152-251, etc.)
- **Stats Filtering**: `pokemon.stats.total >= minStats && pokemon.stats.total <= maxStats`
- **Combined Filters**: Apply all filters in sequence
- **Client-Side Processing**: Filter and sort in memory after fetching data

#### Sorting Implementation

- **Sort Fields**: name (alphabetical), height, weight, base_experience (numerical)
- **Sort Orders**: asc or desc
- **Sorting Algorithm**: Proper string/number comparison
- **Pagination**: Apply pagination after filtering and sorting

## Task 7: Rate Limiting

### 7.1 Rate Limiting Rules

**Requirements**:
- 100 requests per 15 minutes per IP
- 10 requests per minute per authenticated user
- Return appropriate HTTP status codes and headers

**Rate Limit Headers**:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

**Rate Limit Exceeded Response**:
```json
{
  "error": "Rate limit exceeded",
  "message": "Too many requests, please try again later",
  "retryAfter": 900
}
```

#### Rate Limiting Middleware (`src/middleware/rateLimiter.js`)

- **IP-Based Limiting**: 100 requests per 15 minutes per IP
- **User-Based Limiting**: 10 requests per minute per authenticated user
- **Rate Limit Headers**: Include X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset
- **Error Responses**: Return 429 with retry information
- **Storage**: Use in-memory storage for rate limit tracking

## Task 8: Error Handling & Validation

#### Error Handling Middleware

- **Centralized Error Handling**: Catch all errors and return appropriate responses
- **HTTP Status Codes**: 400 (validation), 401 (auth), 403 (forbidden), 404 (not found), 500 (server)
- **Error Response Format**: Standardized error message format
- **Logging**: Log errors for debugging and monitoring

#### Input Validation

- **Joi Schemas**: Validate all input parameters
- **Error Messages**: Descriptive validation error messages
- **Security**: Prevent injection attacks and malformed data

## Task 9: Logging & Monitoring

### 9.1 Request Logging

**Requirements**:
- Log all API requests to `access.log`
- Include: timestamp, method, URL, status code, response time
- Log format: `[timestamp] method url status responseTime`

**Example Log Entry**:
```
[2025-01-20T10:30:00.000Z] GET /api/pokemon/list 200 150ms
```

### 9.2 Health Check

**Endpoint**: `GET /health`

**Expected Output**:
```json
{
  "status": "ok",
  "timestamp": "2025-01-20T10:30:00.000Z",
  "uptime": 3600
}
```

#### Request Logging

- **Access Logs**: Log all API requests to access.log
- **Log Format**: `[timestamp] method url status responseTime`
- **Log Rotation**: Prevent large log files
- **Response Time**: Track and log response times

#### Health Check

- **Health Endpoint**: GET /health
- **Response Format**: Include status, timestamp, uptime
- **Monitoring**: Basic system health monitoring

## Task 10: Testing

#### Test Implementation

- **Unit Tests**: Test individual functions and services
- **Integration Tests**: Test API endpoints and database interactions
- **Authentication Tests**: Test login, registration, and protected routes
- **Battle Logic Tests**: Test battle simulation and HP persistence
- **Error Handling Tests**: Test error scenarios and edge cases

### API Endpoints

| **Endpoint** | **Method** | **Description** | **Validations & Behavior** | **Response** |
|--------------|------------|-----------------|----------------------------|--------------|
| `/api/auth/register` | `POST` | User registration | Validate username/password, hash password | `201 Created` + user object |
| `/api/auth/login` | `POST` | User login | Validate credentials, return JWT | `200 OK` + token + user |
| `/api/pokemon/list` | `GET` | List Pokemon with filters | Support pagination, filtering, sorting | `200 OK` + Pokemon array + pagination |
| `/api/tournaments` | `POST` | Create tournament | Validate input, set defaults | `201 Created` + tournament object |
| `/api/tournaments/live` | `GET` | List live tournaments | Return live tournaments only | `200 OK` + tournaments array |
| `/api/tournaments/completed` | `GET` | List completed tournaments | Return completed tournaments only | `200 OK` + tournaments array |
| `/api/tournaments/:id/battle` | `POST` | Add battle to tournament | Validate Pokemon names, simulate battle | `201 Created` + battle object |
| `/api/tournaments/:id/results` | `GET` | Get tournament results | Return tournament with all battles | `200 OK` + tournament results |
| `/health` | `GET` | Health check | Return system status | `200 OK` + health object |

### Error Handling

- **400**: Invalid input/validation errors
- **401**: Authentication failures
- **403**: Forbidden access
- **404**: Resource not found
- **429**: Rate limit exceeded
- **500**: Server errors

### Response Formats

- **Success**: Include relevant data object
- **Error**: Include error message string
- **Pagination**: { total, page, pages, limit }
- **Tournament**: Include status, rounds, HP state
- **Battle**: Include winner, loser, HP, battle log

## Environment Setup

Ensure you have the following configured in your `.env` file:

```bash
PORT=3000
MONGODB_URI=your_database_connection_string
JWT_SECRET=your_jwt_secret_key
POKEAPI_BASE_URL=https://pokeapi.co/api/v2
CACHE_TTL=300000
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## Project Structure

```
src/
├── config/         # Database configuration
├── controllers/    # Route controllers
├── middleware/     # Auth, rate limiting, error handling
├── models/         # Database models
├── routes/         # Express routes
├── services/       # Business logic services
├── utils/          # Utilities, validation, cache
└── tests/          # Test suites
```

## What We're Looking For

- **Problem-solving skills** - Debug and fix existing authentication issues
- **API design knowledge** - Implement RESTful endpoints following best practices
- **External API integration** - Work with PokeAPI and handle external data
- **JavaScript proficiency** - Write clean, maintainable JavaScript code
- **Error handling** - Proper HTTP status codes and error responses
- **Code quality** - Clean, readable, and maintainable code
- **Testing awareness** - Ensure all provided tests pass
- **System design** - Tournament management and battle simulation logic

## Evaluation Criteria

- Complete and correct functionality
- Proper error handling and status codes
- Clean code structure and JavaScript best practices
- Readable and maintainable code
- Consistent with existing patterns
- Good validation and security practices
- All tests passing
- Clear commit messages and comments
- External API integration working correctly
- Battle simulation logic implemented properly

## Support

If you encounter any setup issues or have questions about requirements, please reach out to the technical team. Focus on implementing the core functionality first, then optimize and refine as time permits.