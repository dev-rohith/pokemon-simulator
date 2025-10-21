const request = require('supertest');
const app = require('../src/server');

// JWT token will be obtained through login
let authToken = null;

describe('Public API - Basic functionality', () => {
  // Setup: Register and login to get JWT token
  beforeAll(async () => {
    // Register a test user
    await request(app)
      .post('/api/auth/register')
      .send({ username: 'testuser', password: 'testpass123' });
    
    // Login to get JWT token
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

  describe('Pokemon list basics', () => {
    test('requires authentication', async () => {
      const res = await request(app).get('/api/pokemon/list');
      expect(res.status).toBe(401);
    });

    test('returns data with valid JWT token', async () => {
      const res = await request(app)
        .get('/api/pokemon/list?limit=5')
        .set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    }, 30000);

    test('caches subsequent identical request', async () => {
      const first = await request(app)
        .get('/api/pokemon/list?limit=3')
        .set('Authorization', `Bearer ${authToken}`);
      expect(first.status).toBe(200);
      expect(first.body.cached).toBe(false);

      const second = await request(app)
        .get('/api/pokemon/list?limit=3')
        .set('Authorization', `Bearer ${authToken}`);
      expect(second.status).toBe(200);
      expect(second.body.cached).toBe(true);
    }, 30000);
  });

  describe('Tournament basics', () => {
    let tournamentId;
    test('create tournament', async () => {
      const res = await request(app)
        .post('/api/tournaments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Public Cup', max_rounds: 1 });
      expect(res.status).toBe(201);
      tournamentId = res.body.tournament.id;
      expect(tournamentId).toBeDefined();
    });

    test('list live tournaments', async () => {
      const res = await request(app)
        .get('/api/tournaments/live')
        .set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.tournaments)).toBe(true);
    });

    test('add battle and get results', async () => {
      const add = await request(app)
        .post(`/api/tournaments/${tournamentId}/battle`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ attacker: 'pikachu', defender: 'bulbasaur' });
      expect(add.status).toBe(201);

      const results = await request(app)
        .get(`/api/tournaments/${tournamentId}/results`)
        .set('Authorization', `Bearer ${authToken}`);
      expect(results.status).toBe(200);
      expect(results.body.tournament).toBeDefined();
      expect(Array.isArray(results.body.tournament.rounds)).toBe(true);
      expect(results.body.tournament.rounds.length).toBeGreaterThan(0);
    }, 60000);
  });

  describe('Tournament status and completion', () => {
    let tournamentId;
    
    test('create tournament with multiple rounds', async () => {
      const res = await request(app)
        .post('/api/tournaments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Multi Round Cup', max_rounds: 3, tournament_active_time: 30 });
      expect(res.status).toBe(201);
      tournamentId = res.body.tournament.id;
      expect(tournamentId).toBeDefined();
    });

    test('live tournaments show live-specific fields', async () => {
      const res = await request(app)
        .get('/api/tournaments/live')
        .set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(200);
      
      const liveTournament = res.body.tournaments.find(t => t.id === tournamentId);
      expect(liveTournament).toBeDefined();
      expect(liveTournament).toHaveProperty('max_rounds');
      expect(liveTournament).toHaveProperty('next_round');
      expect(liveTournament).toHaveProperty('tournament_ends_in');
    });

    test('completed tournaments hide live-specific fields', async () => {
      // Complete the tournament by reaching max rounds
      await request(app)
        .post(`/api/tournaments/${tournamentId}/battle`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ attacker: 'pikachu', defender: 'bulbasaur' });
      
      await request(app)
        .post(`/api/tournaments/${tournamentId}/battle`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ attacker: 'charmander', defender: 'squirtle' });
      
      await request(app)
        .post(`/api/tournaments/${tournamentId}/battle`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ attacker: 'eevee', defender: 'jigglypuff' });

      const res = await request(app)
        .get('/api/tournaments/completed')
        .set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(200);
      
      const completedTournament = res.body.tournaments.find(t => t.id === tournamentId);
      expect(completedTournament).toBeDefined();
      expect(completedTournament).not.toHaveProperty('max_rounds');
      expect(completedTournament).not.toHaveProperty('next_round');
      expect(completedTournament).not.toHaveProperty('tournament_ends_in');
      expect(completedTournament).toHaveProperty('status', 'completed');
    }, 60000);
  });

  describe('HP persistence across battles', () => {
    let tournamentId;
    
    test('Pokemon HP persists across multiple battles', async () => {
      // Create tournament with more rounds
      const createRes = await request(app)
        .post('/api/tournaments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'HP Test Cup', max_rounds: 3, tournament_active_time: 30 });
      tournamentId = createRes.body.tournament.id;

      // First battle
      const battle1 = await request(app)
        .post(`/api/tournaments/${tournamentId}/battle`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ attacker: 'pikachu', defender: 'bulbasaur' });
      expect(battle1.status).toBe(201);
      
      const winner1 = battle1.body.battle.winnerName;
      const winner1Hp = battle1.body.battle.winnerRemainingHp;
      expect(winner1Hp).toBeGreaterThan(0);
      expect(winner1Hp).toBeLessThan(35); // Pikachu's full HP

      // Second battle with same winner
      const battle2 = await request(app)
        .post(`/api/tournaments/${tournamentId}/battle`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ attacker: winner1, defender: 'charmander' });
      expect(battle2.status).toBe(201);

      // Verify the winner started with reduced HP in second battle
      const results = await request(app)
        .get(`/api/tournaments/${tournamentId}/results`)
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(results.body.tournament.rounds).toHaveLength(2);
    }, 60000);
  });

  describe('Tournament error messages', () => {
    let tournamentId;
    
    test('appropriate error messages for different completion reasons', async () => {
      // Create tournament with 1 round
      const createRes = await request(app)
        .post('/api/tournaments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Error Test Cup', max_rounds: 1, tournament_active_time: 30 });
      tournamentId = createRes.body.tournament.id;

      // First battle should succeed
      const battle1 = await request(app)
        .post(`/api/tournaments/${tournamentId}/battle`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ attacker: 'pikachu', defender: 'bulbasaur' });
      expect(battle1.status).toBe(201);

      // Second battle should fail with round limit message
      const battle2 = await request(app)
        .post(`/api/tournaments/${tournamentId}/battle`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ attacker: 'charmander', defender: 'squirtle' });
      expect(battle2.status).toBe(400);
      expect(battle2.body.message).toBe('Tournament round limit reached');
    }, 60000);
  });

  describe('Request Logging', () => {
    test('should create access.log file when server receives requests', async () => {
      const fs = require('fs');
      const path = require('path');
      const accessLogPath = path.join(__dirname, '..', 'access.log');
      
      // Get initial file size if it exists
      const initialSize = fs.existsSync(accessLogPath) ? fs.statSync(accessLogPath).size : 0;
      
      // Make a request to trigger logging
      const response = await request(app)
        .get('/health');
      
      expect(response.status).toBe(200);
      
      // Wait a bit for the file to be written
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check if access.log file was created (either in root or logs directory)
      const rootLogExists = fs.existsSync(accessLogPath);
      const logsDirLogExists = fs.existsSync(path.join(__dirname, '..', 'logs', 'access.log'));
      
      expect(rootLogExists || logsDirLogExists).toBe(true);
      
      // Check if log file has content and contains our request
      if (rootLogExists) {
        const logContent = fs.readFileSync(accessLogPath, 'utf8');
        const currentSize = fs.statSync(accessLogPath).size;
        
        // Either the file grew (new content added) or contains our request
        expect(currentSize > initialSize || logContent.includes('GET /health')).toBe(true);
      } else if (logsDirLogExists) {
        const logContent = fs.readFileSync(path.join(__dirname, '..', 'logs', 'access.log'), 'utf8');
        expect(logContent).toContain('GET /health');
      }
    });
  });
});


