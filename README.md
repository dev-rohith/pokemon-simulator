# Pokemon Battle Simulator - Technical Assessment

This is a Pokemon Battle Simulator backend where users can simulate Pokemon battles and manage Pokemon data. The system includes battle simulation, Pokemon data integration, and advanced filtering capabilities.

**Technology Stack:** JavaScript, Node.js, Express, MongoDB with Mongoose ODM, External API Integration (PokeAPI)



## Quick Start & Local setup

- Download MongoDB for local database connection or run it on an Atlas cluster
- Provide the connection string in the .env file to connect to database

```bash
npm install        # Install all project dependencies
npm test          # Run tests to see current status (all should fail initially)
npm run dev       # Start the development server
```

You've been provided with a starter template that simulates a scenario where you need to implement missing features from scratch. This assessment evaluates your ability to implement RESTful APIs, external API integration, database operations, and maintain code quality standards.

### What's Already Implemented 
- Basic Express server setup with middleware
- Database connection configuration
- Complete route structure for all endpoints
- **Battle simulation logic** (`src/services/battle.service.js`) 
- Project structure and dependencies

**Important**: Everything needs to be implemented  except the battle simulation logic which is already provided in `src/services/battle.service.js`.

## Submission Requirements
- Check out to `dev` branch and solve the assessment.
- Ensure all existing tests pass.
- Document any assumptions or design decisions made.
- Push the code to github `dev` branch.
- Raise a PR to `main` branch.
- Don't merge the pr this will help us review code
- Finally click on the submission button.
- Complete the implementation within the given timeframe - 3 days.

<p style="color: #d9534f; font-family: Arial, sans-serif;">
  <strong>Note:</strong> Please read all the instructions before starting the assessment. Do not modify anything here (README file) and workflows/scripts/tests; any changes will result in automatic disqualification. Ignore @llm-instructions comments on files and dont modify them. Please <strong>do not use AI tools (LLMs)</strong> to complete this assessment.It wastes both <strong>your time</strong> and <strong>ours</strong>. Thank you for understanding.
</p>

## Task Overview

The implementation follows this logical sequence:

1. **Authentication System** - User registration and login with JWT
2. **Pokemon List API** - Fetch and filter Pokemon with pagination
3. **Pokemon Details API** - Get detailed information for specific Pokemon
4. **Caching System** - Implement caching for better performance
5. **Battle Simulation** - Simulate Pokemon battles and store results
6. **Pokemon Filtering & Sorting** - Advanced filtering and sorting capabilities
7. **Error Handling & Validation** - Proper error handling and input validation
8. **Logging & Monitoring** - Request logging and health checks
9. **Testing** - Ensure all tests pass


## Task Description

Fix existing issues and implement missing Pokemon Battle Simulator features in the provided repository.

## Implementation Requirements
Authenticated users can:
1. Register and login with JWT authentication
2. Fetch Pokemon data with filtering, sorting, and pagination
3. Simulate Pokemon battles

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

### 1.3 Implementation Details

#### Password Security Strategy
- Use bcrypt for password hashing with salt rounds (10-12)
- Never store plain text passwords
- Hash password before saving to database
- Use a comparison of a password with hash for login verification

#### JWT Token Management
- Include `userId`(use `_id` from mongodb) in JWT payload
- Set appropriate expiration time (eg, 24 hours)
- Use JWT_SECRET from environment variables
- Return token in response header or body

#### User Model Structure
- Schema fields: username (unique, required), password (hashed, required), timestamps
- Create unique index on username field
- Enable mongoose timestamps for createdAt/updatedAt

#### Authentication Flow
1. **Registration**: Validate input → Check username uniqueness → Hash password → Save user → Return user data
2. **Login**: Validate input → Find user by username → Compare password → Generate JWT → Return token + user data

#### Error Handling Patterns
- Username already exists: 409 Conflict
- Invalid credentials: 401 Unauthorized  
- Missing required fields: 400 Bad Request
- Server errors: 500 Internal Server Error

## Task 2: Pokemon List API

**Endpoint**: `GET /api/pokemon` - Returns only `id` and `name` with pagination/filtering

**Headers**: `Authorization: Bearer <token>`

**Query Parameters**:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)
- `sortBy`: Sort field ("id" or "name")
- `sortOrder`: Sort direction ("asc" or "desc", default: "asc")

**Expected Output**:
```json
{
  "pokemons": [
    {
      "id": 1,
      "name": "bulbasaur"
    },
    {
      "id": 2,
      "name": "ivysaur"
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

**Important**: 
* When calling the external API for the Pokemon list, **only apply `limit` and `page` filters** (using `limit` and `offset` parameters).
* **Do NOT apply `sortBy` or `sortOrder` filters on the external API**—the external API doesn’t support sorting by those fields.
* After fetching the paged data from the external API, **perform sorting and ordering locally on your server** based on `sortBy` and `sortOrder` parameters.
* The Pokemon List API response should include **only the `id` and `name` fields** for each Pokemon — no extra data.

- `executionTime: >0` means data was fetched fresh from PokeAPI
- `executionTime: 0` means data was served from cache (instant)


## Task 3: Pokemon Details API

**Endpoint**: `GET /api/pokemon/:name`

**Purpose**: Get full detailed information for a specific Pokemon (separate from the list API)

**Expected Output**:
```json
{
  "data": {
    "id": 25,
    "name": "pikachu",
    "height": 4,
    "weight": 60,
    "baseExperience": 112,
    "types": ["electric"],
    "stats": {
      "hp": 35,
      "attack": 55,
      "defense": 40,
      "specialAttack": 50,
      "specialDefense": 50,
      "speed": 90,
      "total": 320
    },
    "abilities": ["static", "lightning-rod"],
    "sprite": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png"
  },
  "cached": false,
  "executionTime": 584
}
```
**Implementation Notes:**
* Call external API directly:
  `GET https://pokeapi.co/api/v2/pokemon/{name}`
* Transform the response by:

  * Extracting `types` as an array of type names
  * Converting `stats` array into an object with camelCase keys and adding a `total` sum
  * Extracting `abilities` as an array of ability names
  * Renaming `base_experience` to `baseExperience`
  * Extracting sprite URL from `sprites.front_default`



**Cache Performance**:
- `cached: true, executionTime: 0` - Data served from cache (instant)
- `cached: false, executionTime: 584` - Data fetched fresh from PokeAPI

## Task 4: Caching System

**Note**: Implement caching for both Pokemon List and Details APIs to improve performance.

### 4.1 Cache Implementation

**Requirements**:
- Cache Pokemon list responses for 5 minutes
- Cache individual Pokemon details for 10 minutes
- Include cache status in response (`cached: true/false`)
- Handle cache misses gracefully

**Expected Behavior**:
- First request: `cached: false`, normal execution time
- Subsequent identical requests: `cached: true`, faster execution
- Cache key should include all query parameters

### 4.2 Cache Implementation Details

#### Cache Strategy
- **Cache Key Strategy**: Include all query parameters in key
- **Cache Check**: Check cache before making API calls
- **Cache Set**: Store transformed data with TTL
- **Cache TTL**: 5 minutes for Pokemon lists, 10 minutes for individual Pokemon

#### Execution Time Tracking
- **Cached responses**: `executionTime: 0` (instant)
- **Fresh responses**: `executionTime: actual_time_taken` (e.g., 150ms)

---

## Task 5: Battle Simulation

**Note**: The battle simulation logic is already fully implemented in `src/services/battle.service.js`. You only need to integrate it into the battle API endpoints.
Find the handler logic and build api endpoint.

### 5.1 Simulate Battle

**Endpoint**: `POST /api/battle`

**Input**:
```json
{
  "attacker1": {
    "name": "charizard",
    "stats": {
      "hp": 78,
      "attack": 84,
      "defense": 78,
      "specialAttack": 109,
      "specialDefense": 85,
      "speed": 100,
      "total": 534
    }
  },
  "attacker2": {
    "name": "pikachu",
    "stats": {
      "hp": 35,
      "attack": 55,
      "defense": 40,
      "specialAttack": 50,
      "specialDefense": 50,
      "speed": 90,
      "total": 320
    }
  }
}
```

**Expected Output**:
```json
{
  "message": "Battle completed successfully",
  "battle": {
    "id": "507f1f77bcf86cd799439011",
    "attacker1": "charizard",
    "attacker2": "pikachu",
    "winner": "charizard",
    "createdAt": "2025-01-20T10:30:00.000Z"
  }
}
```

### 5.2 List User's Battles

**Endpoint**: `GET /api/battle`

**Headers**: `Authorization: Bearer <token>`

**Expected Output**:
```json
{
  "battles": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "attacker1": "charizard",
      "attacker2": "pikachu",
      "winner": "charizard",
      "createdAt": "2025-01-20T10:30:00.000Z"
    }
  ],
  "total": 1,
  "cached": false,
  "executionTime": 96
}
```

**Note**: Returns only battles created by the authenticated user. Do not return all battles, only battles created by the particular user.

### 5.3 Implementation Details

#### Battle Algorithm Strategy
- Battle algorithm is already implemented - no need to worry about this
- **Turn Order**: Compare Pokemon speed stats, higher speed attacks first
- **Damage Calculation**: (attacker.attack - defender.defense) + random(1-10)
- **Minimum Damage**: Ensure at least 1 damage per attack
- **HP Tracking**: Start with full HP, reduce by damage each round
- **Battle End**: When any Pokemon reaches 0 HP

## Task 6: Pokemon Filtering & Sorting

### 6.1 Pokemon Filtering & Sorting Strategy

**External API Call**: Only use `limit` and `page` parameters
- `GET https://pokeapi.co/api/v2/pokemon?limit={limit}&offset={offset}`
- Fetch only the requested amount from PokeAPI

**Local Processing**: Do all filtering, sorting, and ordering locally
- **Type Filtering**: Filter by Pokemon type after fetching data
- **Generation Filtering**: Filter by generation after fetching data  
- **Stats Filtering**: Filter by min/max stats after fetching data
- **Sorting**: Sort by id or name after fetching data
- **Pagination**: Apply pagination after local filtering/sorting

**Example Flow**:
1. Call PokeAPI with `limit=100&offset=0` (or requested limit/offset)
2. Fetch detailed data for all Pokemon
3. Apply local filtering (type, generation, stats)
4. Apply local sorting (id, name)
5. Apply local pagination
6. Return final results

**Available Sort Fields**:
- `id` (numeric)
- `name` (alphabetical)

**Sort Orders**: `asc` or `desc`


## Task 7: Error Handling & Validation

### 7.1 Error Handling

- **400**: Invalid input/validation errors
- **401**: Authentication failures
- **403**: Forbidden access
- **404**: Resource not found
- **500**: Server errors

### 7.2 Input Validation

- **Joi Schemas**: Validate all input parameters
- **Error Messages**: Descriptive validation error messages
- **Security**: Prevent injection attacks and malformed data

## Task 8: Logging & Monitoring

### 8.1 Request Logging

**Requirements**:
- Log all API requests to `access.log`
- Include: timestamp, method, URL, status code, response time
- Log format: `[timestamp] method url status responseTime`

**Example Log Entry**:
```
[2025-01-20T10:30:00.000Z] GET /api/pokemon 200 150ms
```

### 8.2 Health Check

**Endpoint**: `GET /health`

**Expected Output**:
```json
{
  "status": "ok",
  "timestamp": "2025-01-20T10:30:00.000Z",
  "uptime": 3600
}
```

## Task 9: Testing

### 9.1 Test Implementation

- **Unit Tests**: Test the implementation by running `npm test` to see public test cases should pass for better outcomes.

## Environment Setup

Ensure you have the following configured in your `.env` file:

```bash
PORT=3000
MONGODB_URI=your_database_connection_string
JWT_SECRET=your_jwt_secret_key
POKEAPI_BASE_URL=https://pokeapi.co/api/v2
CACHE_TTL=300000
```

## API Endpoints

| **Endpoint** | **Method** | **Description** | **Validations & Behavior** | **Response** |
|--------------|------------|-----------------|----------------------------|--------------|
| `/api/auth/register` | `POST` | User registration | Validate username/password, hash password | `201 Created` + user object |
| `/api/auth/login` | `POST` | User login | Validate credentials, return JWT | `200 OK` + token + user |
| `/api/pokemon` | `GET` | List Pokemon with filters | Support pagination, filtering, sorting | `200 OK` + Pokemon array + pagination |
| `/api/pokemon/:name` | `GET` | Get Pokemon details | Validate Pokemon name | `200 OK` + Pokemon details |
| `/api/battle` | `POST` | Simulate battle | Validate Pokemon data, simulate battle | `200 OK` + battle result |
| `/api/battle` | `GET` | List user's battles | Return user's battles sorted by newest | `200 OK` + battles array |
| `/health` | `GET` | Health check | Return system status | `200 OK` + health object |

## Project Structure

```
src/
├── config/         # Database configuration
├── controllers/    # Route controllers
├── middleware/     # Auth, error handling
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
- **System design** - Battle simulation logic and Pokemon data management

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