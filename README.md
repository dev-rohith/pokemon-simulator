# Pokemon Battle Simulator - Technical Assessment

## 🚀 Starter Template Overview

This is a **starter template** for a Pokemon Battle Simulator backend assessment. The codebase contains basic structure and placeholder implementations. Your task is to implement the missing functionality to make all tests pass.

### What's Already Implemented ✅
- Basic Express server setup with middleware
- Database connection configuration
- Complete route structure for all endpoints
- **Battle simulation logic** (`src/services/battle.service.js`) - fully functional
- Comprehensive test suite with 43 test cases
- Project structure and dependencies

### What You Need to Implement 🔧
- **Authentication System** - JWT-based registration/login
- **Pokemon API** - List and details endpoints with filtering, sorting, pagination
- **Battle API** - Simulate battles and store results in database
- **Caching System** - In-memory caching for performance optimization
- **Input Validation** - Joi schemas for all endpoints
- **Error Handling** - Centralized error management
- **Database Models** - Complete Mongoose schemas

### Quick Start
```bash
npm install        # Install dependencies
npm test          # Run tests to see what needs implementation
npm start         # Start the server (will show placeholder responses)
```

## Assessment Overview

This is a Pokemon Battle Simulator backend where users can simulate Pokemon battles and manage Pokemon data. The system includes battle simulation, Pokemon data integration, and advanced filtering capabilities.

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
3. Simulate Pokemon battles
4. Access Pokemon data with advanced filtering

## Setup Instructions

```bash
npm install        # Install all project dependencies
npm test          # Run tests to see current status (all should fail initially)
npm start         # Start the development server
```

**Current State**: The codebase contains placeholder implementations that return "Not implemented" responses. All controllers, models, and services need to be implemented according to the specifications below.

You've been provided with a starter template that simulates a real-world scenario where you need to implement missing features from scratch. This assessment evaluates your ability to implement RESTful APIs, external API integration, database operations, and maintain code quality standards.

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
- Use bcrypt.compare() for login verification

#### JWT Token Management
- Include userId in JWT payload
- Set appropriate expiration time (24 hours recommended)
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

### 2.1 Basic Pokemon List

**Endpoint**: `GET /api/pokemon`

**Headers**: `Authorization: Bearer <token>`

**Query Parameters**:
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)
- `type` (optional): Filter by Pokemon type (e.g., "fire", "water")
- `generation` (optional): Filter by generation (1-8)
- `minStats` (optional): Minimum total stats
- `maxStats` (optional): Maximum total stats
- `sortBy` (optional): Sort field ("id" or "name")
- `sortOrder` (optional): Sort direction ("asc" or "desc", default: "asc")

**Expected Output**:
```json
{
  "pokemons": [
    {
      "id": 1,
      "name": "bulbasaur"
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

### 2.2 Get Pokemon Details

**Endpoint**: `GET /api/pokemon/:name`

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

### 2.3 Implementation Details

#### PokeAPI Integration Strategy
1. **Base API Call**: `GET https://pokeapi.co/api/v2/pokemon?limit=1000&offset=0`
2. **Response Structure**: PokeAPI returns `{count, next, previous, results: [{name, url}]}`
3. **Individual Pokemon Data**: Each Pokemon URL needs separate API call for detailed stats
4. **Batch Processing**: Use Promise.all() to fetch all Pokemon details simultaneously

#### Data Transformation Process
- **PokeAPI Response**: Contains nested objects for types, stats, abilities
- **Transform Types**: Extract type names from nested type objects
- **Transform Stats**: Convert stats array to object with stat names as keys
- **Calculate Total Stats**: Sum all base_stat values for total calculation
- **Transform Abilities**: Extract ability names from nested ability objects
- **Sprite URL**: Use front_default from sprites object

#### Caching Implementation
- **Cache Key Strategy**: Include all query parameters in key
- **Cache Check**: Check cache before making API calls
- **Cache Set**: Store transformed data with TTL
- **Cache TTL**: 5 minutes for Pokemon lists, 10 minutes for individual Pokemon

## Task 3: Battle Simulation

**Note**: The battle simulation logic is already fully implemented in `src/services/battle.service.js`. You only need to integrate it into the battle API endpoints.

### 3.1 Simulate Battle

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

### 3.2 List User's Battles

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

**Note**: Returns only battles created by the authenticated user.

### 3.3 Implementation Details

#### Battle Algorithm Strategy
- **Turn Order**: Compare Pokemon speed stats, higher speed attacks first
- **Damage Calculation**: (attacker.attack - defender.defense) + random(1-10)
- **Minimum Damage**: Ensure at least 1 damage per attack
- **HP Tracking**: Start with full HP, reduce by damage each round
- **Battle End**: When any Pokemon reaches 0 HP

## Task 4: Pokemon Filtering & Sorting

### 4.1 Filter by Type

**Endpoint**: `GET /api/pokemon?type=fire`

### 4.2 Filter by Generation

**Endpoint**: `GET /api/pokemon?generation=1`

### 4.3 Filter by Stats

**Endpoint**: `GET /api/pokemon?minStats=500&maxStats=700`

### 4.4 Sort Pokemon

**Endpoint**: `GET /api/pokemon?sortBy=name&sortOrder=asc`

**Available Sort Fields**:
- `name` (alphabetical)
- `height` (numerical)
- `weight` (numerical)
- `base_experience` (numerical)

**Sort Orders**: `asc` or `desc`

### 4.5 Combined Filters

**Endpoint**: `GET /api/pokemon?type=water&generation=1&sortBy=name&sortOrder=asc&limit=10`

### 4.6 Implementation Details

#### Filtering Strategy
- **Type Filtering**: Check if Pokemon.types array includes the filter type
- **Generation Filtering**: Use Pokemon ID ranges (Gen 1: 1-151, Gen 2: 152-251, etc.)
- **Stats Filtering**: Compare Pokemon.stats.total against minStats/maxStats
- **Client-Side Processing**: Apply filters after fetching all Pokemon data
- **Case Sensitivity**: Convert filter values to lowercase for type matching

#### Generation ID Ranges
- **Generation 1**: Pokemon IDs 1-151
- **Generation 2**: Pokemon IDs 152-251
- **Generation 3**: Pokemon IDs 252-386
- **Generation 4**: Pokemon IDs 387-493
- **Generation 5**: Pokemon IDs 494-649
- **Generation 6**: Pokemon IDs 650-721
- **Generation 7**: Pokemon IDs 722-809
- **Generation 8**: Pokemon IDs 810+

## Task 5: Error Handling & Validation

### 5.1 Error Handling

- **400**: Invalid input/validation errors
- **401**: Authentication failures
- **403**: Forbidden access
- **404**: Resource not found
- **500**: Server errors

### 5.2 Input Validation

- **Joi Schemas**: Validate all input parameters
- **Error Messages**: Descriptive validation error messages
- **Security**: Prevent injection attacks and malformed data

## Task 6: Logging & Monitoring

### 6.1 Request Logging

**Requirements**:
- Log all API requests to `access.log`
- Include: timestamp, method, URL, status code, response time
- Log format: `[timestamp] method url status responseTime`

**Example Log Entry**:
```
[2025-01-20T10:30:00.000Z] GET /api/pokemon 200 150ms
```

### 6.2 Health Check

**Endpoint**: `GET /health`

**Expected Output**:
```json
{
  "status": "ok",
  "timestamp": "2025-01-20T10:30:00.000Z",
  "uptime": 3600
}
```

## Task 7: Caching System

### 7.1 Cache Implementation

**Requirements**:
- Cache Pokemon list responses for 5 minutes
- Cache individual Pokemon details for 10 minutes
- Include cache status in response (`cached: true/false`)
- Handle cache misses gracefully

**Expected Behavior**:
- First request: `cached: false`, normal execution time
- Subsequent identical requests: `cached: true`, faster execution
- Cache key should include all query parameters

## Task 8: Testing

### 8.1 Test Implementation

- **Unit Tests**: Test individual functions and services
- **Integration Tests**: Test API endpoints and database interactions
- **Authentication Tests**: Test login, registration, and protected routes
- **Battle Logic Tests**: Test battle simulation
- **Error Handling Tests**: Test error scenarios and edge cases

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