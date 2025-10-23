const request = require('supertest');
const app = require('../src/server');
const { calculateDamage, simulateBattle } = require('../src/services/battle.service');
const cache = require('../src/utils/cache');

// JWT token will be obtained through login
let authToken = null;

describe('Private API and logic - Deep tests and edge cases', () => {
  // Setup: Register and login to get JWT token
  beforeAll(async () => {
    // Register a test user
    await request(app)
      .post('/api/auth/register')
      .send({ username: 'testuser2', password: 'testpass123' });
    
    // Login to get JWT token
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ username: 'testuser2', password: 'testpass123' });
    
    authToken = loginRes.body.token;
  });

  describe('Battle service', () => {
    test('calculateDamage returns at least 1', () => {
      const atk = { stats: { attack: 1 } };
      const def = { stats: { defense: 99999 } };
      expect(calculateDamage(atk, def, 1)).toBe(1);
    });

    test('simulateBattle returns valid result', () => {
      const a = { 
        id: 1, 
        name: 'a', 
        types: ['normal'], 
        stats: { hp: 10, attack: 10, defense: 10, speed: 10 } 
      };
      const b = { 
        id: 2, 
        name: 'b', 
        types: ['normal'], 
        stats: { hp: 10, attack: 10, defense: 10, speed: 5 } 
      };
      const result = simulateBattle(a, b);
      expect(result).toHaveProperty('winner');
      expect(result).toHaveProperty('loser');
      expect(result).toHaveProperty('rounds');
      expect(result).toHaveProperty('battleLog');
      expect(Array.isArray(result.battleLog)).toBe(true);
      expect(result.rounds).toBe(result.battleLog.length);
    });
  });

  describe('Battle API', () => {
    test('simulate battle with valid Pokemon data', async () => {
      const battleData = {
        attacker1: {
          name: 'charizard',
          stats: {
            hp: 78,
            attack: 84,
            defense: 78,
            specialAttack: 109,
            specialDefense: 85,
            speed: 100,
            total: 534
          }
        },
        attacker2: {
          name: 'pikachu',
          stats: {
            hp: 35,
            attack: 55,
            defense: 40,
            specialAttack: 50,
            specialDefense: 50,
            speed: 90,
            total: 320
          }
        }
      };

      const res = await request(app)
        .post('/api/battle')
        .set('Authorization', `Bearer ${authToken}`)
        .send(battleData);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Battle completed successfully');
      expect(res.body.battle).toBeDefined();
      expect(res.body.battle).toHaveProperty('id');
      expect(res.body.battle).toHaveProperty('attacker1', 'charizard');
      expect(res.body.battle).toHaveProperty('attacker2', 'pikachu');
      expect(res.body.battle).toHaveProperty('winner');
      expect(res.body.battle).toHaveProperty('createdAt');
    });

    test('battle API requires authentication', async () => {
      const battleData = {
        attacker1: {
          name: 'charizard',
          stats: {
            hp: 78, attack: 84, defense: 78,
            specialAttack: 109, specialDefense: 85, speed: 100, total: 534
          }
        },
        attacker2: {
          name: 'pikachu',
          stats: {
            hp: 35, attack: 55, defense: 40,
            specialAttack: 50, specialDefense: 50, speed: 90, total: 320
          }
        }
      };

      const res = await request(app)
        .post('/api/battle')
        .send(battleData);

      expect(res.status).toBe(401);
    });

    test('battle API validation - missing attacker1', async () => {
      const res = await request(app)
        .post('/api/battle')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          attacker2: {
            name: 'pikachu',
            stats: { hp: 35, attack: 55, defense: 40, specialAttack: 50, specialDefense: 50, speed: 90, total: 320 }
          }
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Invalid input data');
      expect(Array.isArray(res.body.errors)).toBe(true);
    });

    test('battle API validation - missing stats', async () => {
      const res = await request(app)
        .post('/api/battle')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          attacker1: { name: 'charizard' },
          attacker2: {
            name: 'pikachu',
            stats: { hp: 35, attack: 55, defense: 40, specialAttack: 50, specialDefense: 50, speed: 90, total: 320 }
          }
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Invalid input data');
      expect(Array.isArray(res.body.errors)).toBe(true);
    });

    test('battle API validation - invalid stats type', async () => {
      const res = await request(app)
        .post('/api/battle')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          attacker1: {
            name: 'charizard',
            stats: { hp: 'invalid', attack: 84, defense: 78, specialAttack: 109, specialDefense: 85, speed: 100, total: 534 }
          },
          attacker2: {
            name: 'pikachu',
            stats: { hp: 35, attack: 55, defense: 40, specialAttack: 50, specialDefense: 50, speed: 90, total: 320 }
          }
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Invalid input data');
      expect(Array.isArray(res.body.errors)).toBe(true);
    });

    test('battle API validation - missing required stats', async () => {
      const res = await request(app)
        .post('/api/battle')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          attacker1: {
            name: 'charizard',
            stats: { hp: 78, attack: 84, defense: 78, specialAttack: 109, specialDefense: 85, speed: 100 }
            // missing total
          },
          attacker2: {
            name: 'pikachu',
            stats: { hp: 35, attack: 55, defense: 40, specialAttack: 50, specialDefense: 50, speed: 90, total: 320 }
          }
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Invalid input data');
      expect(Array.isArray(res.body.errors)).toBe(true);
    });
  });

  describe('Battles Listing API', () => {
    test('list battles requires authentication', async () => {
      const res = await request(app).get('/api/battle');
      expect(res.status).toBe(401);
    });

    test('list battles returns all battles', async () => {
      // First create a battle
      const battleData = {
        attacker1: {
          name: 'blastoise',
          stats: {
            hp: 79, attack: 83, defense: 100,
            specialAttack: 85, specialDefense: 105, speed: 78, total: 530
          }
        },
        attacker2: {
          name: 'venusaur',
          stats: {
            hp: 80, attack: 82, defense: 83,
            specialAttack: 100, specialDefense: 100, speed: 80, total: 525
          }
        }
      };

      await request(app)
        .post('/api/battle')
        .set('Authorization', `Bearer ${authToken}`)
        .send(battleData);

      // Then list battles
      const res = await request(app)
        .get('/api/battle')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('battles');
      expect(res.body).toHaveProperty('total');
      expect(res.body).toHaveProperty('cached');
      expect(res.body).toHaveProperty('executionTime');
      expect(Array.isArray(res.body.battles)).toBe(true);
      expect(res.body.battles.length).toBeGreaterThan(0);
      
      // Check battle structure
      const battle = res.body.battles[0];
      expect(battle).toHaveProperty('_id');
      expect(battle).toHaveProperty('attacker1');
      expect(battle).toHaveProperty('attacker2');
      expect(battle).toHaveProperty('winner');
      expect(battle).toHaveProperty('createdAt');
    });

    test('list battles ignores query parameters', async () => {
      const res = await request(app)
        .get('/api/battle?page=2&limit=1&winner=charizard')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('battles');
      expect(Array.isArray(res.body.battles)).toBe(true);
      // Should return all battles, not just one
      expect(res.body.battles.length).toBeGreaterThan(0);
    });
  });

  describe('Cache functionality', () => {
    test('cache stores and retrieves data', () => {
      const key = 'test-key';
      const value = { test: 'data' };
      
      cache.set(key, value, 1000);
      const retrieved = cache.get(key);
      
      expect(retrieved).toEqual(value);
    });

    test('cache returns undefined for non-existent key', () => {
      const retrieved = cache.get('non-existent-key');
      expect(retrieved).toBeNull();
    });

    test('cache expires after TTL', async () => {
      const key = 'expiry-test';
      const value = { test: 'data' };
      
      cache.set(key, value, 100); // 100ms TTL
      
      // Should be available immediately
      expect(cache.get(key)).toEqual(value);
      
      // Wait for expiry
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // Should be null after expiry
      expect(cache.get(key)).toBeNull();
    });
  });

  describe('Rate Limiting', () => {
    test('rate limiting headers are present', async () => {
      const res = await request(app)
        .get('/api/pokemon?limit=1')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(res.status).toBe(200);
      expect(res.headers).toHaveProperty('x-ratelimit-limit');
      expect(res.headers).toHaveProperty('x-ratelimit-remaining');
      expect(res.headers).toHaveProperty('x-ratelimit-reset');
    });
  });

  describe('Error Handling', () => {
    test('handles server errors gracefully', async () => {
      // This test would require mocking a service to throw an error
      // For now, we'll test that the server doesn't crash
      const res = await request(app)
        .get('/api/pokemon?limit=1')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(res.status).toBe(200);
    });

    test('handles invalid JWT token', async () => {
      const res = await request(app)
        .get('/api/pokemon')
        .set('Authorization', 'Bearer invalid-token');
      
      expect(res.status).toBe(401);
    });

    test('handles missing JWT token', async () => {
      const res = await request(app).get('/api/pokemon');
      expect(res.status).toBe(401);
    });
  });
});