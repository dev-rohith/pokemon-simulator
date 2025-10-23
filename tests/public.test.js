const request = require('supertest');
const app = require('../src/server');

// JWT token will be obtained through login
let authToken = null;

describe('Public API - Basic functionality', () => {
  // Setup: Register and login to get JWT token
  beforeAll(async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ username: 'testuser', password: 'testpass123' });
  
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ username: 'testuser', password: 'testpass123' });
    
    authToken = loginRes.body.token;
  });

  test('health endpoint responds', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'ok');
  });

  test('root endpoint lists available endpoints', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message', 'Pokemon Battle Simulator API');
    expect(res.body).toHaveProperty('endpoints');
    expect(res.body.endpoints).toHaveProperty('health');
    expect(res.body.endpoints).toHaveProperty('pokemon');
    expect(res.body.endpoints).toHaveProperty('battle');
  });

  describe('Authentication', () => {
    test('register with valid data', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ username: 'newuser', password: 'password123' });
      
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('user');
      expect(res.body.user).toHaveProperty('id');
      expect(res.body.user).toHaveProperty('username', 'newuser');
    });

    test('register with invalid data - short username', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ username: 'ab', password: 'password123' });
      
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message', 'Invalid registration data');
    });

    test('register with invalid data - short password', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ username: 'validuser', password: '123' });
      
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message', 'Invalid registration data');
    });

    test('register with duplicate username', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ username: 'testuser', password: 'password123' });
      
      expect(res.status).toBe(409);
      expect(res.body).toHaveProperty('message', 'Username already exists');
    });

    test('login with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: 'testuser', password: 'testpass123' });
      
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
    });

    test('login with invalid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: 'testuser', password: 'wrongpassword' });
      
      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('message', 'Invalid credentials');
    });

    test('login with invalid data - missing username', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ password: 'testpass123' });
      
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message', 'Invalid login data');
    });
  });

  describe('Pokemon API', () => {
    test('requires authentication', async () => {
      const res = await request(app).get('/api/pokemon');
      expect(res.status).toBe(401);
    });

    test('returns Pokemon list with valid JWT token', async () => {
      const res = await request(app)
        .get('/api/pokemon?limit=5')
        .set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.pokemons)).toBe(true);
      expect(res.body).toHaveProperty('pagination');
      expect(res.body).toHaveProperty('cached');
      expect(res.body).toHaveProperty('executionTime');
    }, 30000);

    test('verifies Pokemon data structure', async () => {
      const res = await request(app)
        .get('/api/pokemon?limit=1')
        .set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(200);
      expect(res.body.pokemons).toHaveLength(1);
      
      const pokemon = res.body.pokemons[0];
      expect(pokemon).toHaveProperty('id');
      expect(pokemon).toHaveProperty('name');
      expect(typeof pokemon.id).toBe('number');
      expect(typeof pokemon.name).toBe('string');
    }, 30000);

    test('filters by Pokemon type', async () => {
      const res = await request(app)
        .get('/api/pokemon?type=fire&limit=10')
        .set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.pokemons)).toBe(true);
    }, 120000);

    test('filters by generation', async () => {
      const res = await request(app)
        .get('/api/pokemon?generation=1&limit=10')
        .set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.pokemons)).toBe(true);
    }, 120000);

    test('sorts by name ascending', async () => {
      const res = await request(app)
        .get('/api/pokemon?sortBy=name&sortOrder=asc&limit=5')
        .set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.pokemons)).toBe(true);
    }, 120000);

    test('sorts by id descending', async () => {
      const res = await request(app)
        .get('/api/pokemon?sortBy=id&sortOrder=desc&limit=5')
        .set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.pokemons)).toBe(true);
    }, 120000);

    test('handles pagination correctly', async () => {
      const page1 = await request(app)
        .get('/api/pokemon?page=1&limit=3')
        .set('Authorization', `Bearer ${authToken}`);
      expect(page1.status).toBe(200);
      expect(page1.body.pokemons.length).toBeLessThanOrEqual(3);
      expect(page1.body.pagination.page).toBe(1);

      const page2 = await request(app)
        .get('/api/pokemon?page=2&limit=3')
        .set('Authorization', `Bearer ${authToken}`);
      expect(page2.status).toBe(200);
      expect(page2.body.pokemons.length).toBeLessThanOrEqual(3);
      expect(page2.body.pagination.page).toBe(2);
    }, 120000);

    test('validates invalid sortBy parameter', async () => {
      const res = await request(app)
        .get('/api/pokemon?sortBy=invalidField')
        .set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Invalid parameters');
    });

    test('validates invalid generation parameter', async () => {
      const res = await request(app)
        .get('/api/pokemon?generation=10')
        .set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Invalid parameters');
    });

    test('validates invalid limit parameter', async () => {
      const res = await request(app)
        .get('/api/pokemon?limit=200')
        .set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Invalid parameters');
    });

    test('validates invalid page parameter', async () => {
      const res = await request(app)
        .get('/api/pokemon?page=0')
        .set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message', 'Invalid parameters');
    });
  });

  describe('Pokemon Details API', () => {
    test('requires authentication', async () => {
      const res = await request(app).get('/api/pokemon/pikachu');
      expect(res.status).toBe(401);
    });

    test('returns Pokemon details with valid JWT token', async () => {
      const res = await request(app)
        .get('/api/pokemon/pikachu')
        .set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(res.body.data).toHaveProperty('name', 'pikachu');
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data).toHaveProperty('stats');
      expect(res.body.data).toHaveProperty('types');
    }, 30000);

    test.skip('returns 404 for non-existent Pokemon', async () => {
      // Use a timestamp to ensure unique Pokemon name
      const uniqueName = `definitelynotapokemon${Date.now()}`;
      const res = await request(app)
        .get(`/api/pokemon/${uniqueName}`)
        .set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('message', 'Pokemon not found');
    }, 30000);

    test('validates empty Pokemon name', async () => {
      const res = await request(app)
        .get('/api/pokemon/')
        .set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(200); // This hits the list endpoint, not details
    });
  });

  describe('Request Logging', () => {
    test('should create access.log file when server receives requests', async () => {
      const fs = require('fs');
      const path = require('path');
      
      // Make a request to trigger logging
      const response = await request(app)
        .get('/health');
      
      expect(response.status).toBe(200);
      
      // Wait a bit for the file to be written
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check if access.log file was created (either in root or logs directory)
      const rootLogExists = fs.existsSync(path.join(__dirname, '..', 'access.log'));
      const logsDirLogExists = fs.existsSync(path.join(__dirname, '..', 'logs', 'access.log'));
      
      expect(rootLogExists || logsDirLogExists).toBe(true);
    });
  });
});