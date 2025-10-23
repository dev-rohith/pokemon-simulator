const request = require('supertest');
const app = require('../src/server');
const cache = require('../src/utils/cache');
const { calculateDamage, runBattle } = require('../src/controllers/battleController');

let authToken = null;

describe('Private API and logic - Deep tests and edge cases', () => {
  beforeAll(async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ username: 'testuser2', password: 'testpass123' });

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
      const result = runBattle(a, b);
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
      
      cache.set(key, value, 100); 
      
      expect(cache.get(key)).toEqual(value);
      
      await new Promise(resolve => setTimeout(resolve, 150));
      
      expect(cache.get(key)).toBeNull();
    });
  });


  describe('Error Handling', () => {
    test('handles server errors gracefully', async () => {
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

  describe('Request Logging', () => {
    test('morgan creates access.log file and logs API calls', async () => {
      const fs = require('fs');
      const path = require('path');
      const accessLogPath = path.join(__dirname, '..', 'access.log');
      
      // Make some API calls to generate log entries
      await request(app)
        .get('/health')
        .set('Authorization', `Bearer ${authToken}`);
      
      await request(app)
        .get('/api/pokemon?limit=1')
        .set('Authorization', `Bearer ${authToken}`);
      
      await request(app)
        .post('/api/battle')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          attacker1: {
            name: 'test1',
            stats: { hp: 50, attack: 50, defense: 50, specialAttack: 50, specialDefense: 50, speed: 50, total: 300 }
          },
          attacker2: {
            name: 'test2',
            stats: { hp: 50, attack: 50, defense: 50, specialAttack: 50, specialDefense: 50, speed: 50, total: 300 }
          }
        });
      
      await new Promise(resolve => setTimeout(resolve, 200));
      
      expect(fs.existsSync(accessLogPath)).toBe(true);
      
      const logContent = fs.readFileSync(accessLogPath, 'utf8');
      expect(logContent.length).toBeGreaterThan(0);
      
      expect(logContent).toContain('GET /health');
      expect(logContent).toContain('GET /api/pokemon');
      expect(logContent).toContain('POST /api/battle');
      
      expect(logContent).toContain('200');
    });
  });
});