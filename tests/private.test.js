const request = require('supertest');
const app = require('../src/server');
const { calculateDamage, simulateBattle } = require('../src/services/battle.service');
const { TYPE_CHART, calculateTypeEffectiveness } = require('../src/utils/typeEffectiveness');
const cache = require('../src/utils/cache');
const Tournament = require('../src/models/Tournament');

const TEST_API_KEY = 'test-api-key-123-user1';

describe('Private API and logic - Deep tests and edge cases', () => {
  describe('Battle service', () => {
    test('calculateDamage returns at least 1', () => {
      const atk = { stats: { attack: 1 } };
      const def = { stats: { defense: 99999 } };
      expect(calculateDamage(atk, def, 1)).toBe(1);
    });

    test('simulateBattle logs rounds consistently', () => {
      const a = { id: 1, name: 'a', types: ['normal'], stats: { hp: 10, attack: 10, defense: 10, speed: 10 } };
      const b = { id: 2, name: 'b', types: ['normal'], stats: { hp: 10, attack: 10, defense: 10, speed: 5 } };
      const r = simulateBattle(a, b);
      expect(r.rounds).toBe(r.battleLog.length);
      expect(r.winner).toBeDefined();
    });
  });

  describe('Type effectiveness', () => {
    test('no-effect edge case', () => {
      expect(calculateTypeEffectiveness('normal', ['ghost'])).toBe(0);
    });
  });

  describe('Tournament battle edge cases', () => {
    test('missing battle fields', async () => {
      // First create a tournament
      const create = await request(app)
        .post('/api/tournaments')
        .set('X-API-Key', TEST_API_KEY)
        .send({ name: 'Test Cup', max_rounds: 1 });
      const id = create.body.tournament.id;

      const res = await request(app)
        .post(`/api/tournaments/${id}/battle`)
        .set('X-API-Key', TEST_API_KEY)
        .send({});
      expect(res.status).toBe(400);
    }, 30000);

    test('same pokemon in battle', async () => {
      // First create a tournament
      const create = await request(app)
        .post('/api/tournaments')
        .set('X-API-Key', TEST_API_KEY)
        .send({ name: 'Test Cup 2', max_rounds: 1 });
      const id = create.body.tournament.id;

      const res = await request(app)
        .post(`/api/tournaments/${id}/battle`)
        .set('X-API-Key', TEST_API_KEY)
        .send({ attacker: 'pikachu', defender: 'pikachu' });
      expect(res.status).toBe(400);
    }, 30000);
  });

  describe('Tournament API edge cases', () => {
    test('cannot add battle beyond max rounds', async () => {
      const create = await request(app)
        .post('/api/tournaments')
        .set('X-API-Key', TEST_API_KEY)
        .send({ name: 'Limit Cup', max_rounds: 1 });
      const id = create.body.tournament.id;

      const first = await request(app)
        .post(`/api/tournaments/${id}/battle`)
        .set('X-API-Key', TEST_API_KEY)
        .send({ attacker: 'pikachu', defender: 'bulbasaur' });
      expect(first.status).toBe(201);

      const second = await request(app)
        .post(`/api/tournaments/${id}/battle`)
        .set('X-API-Key', TEST_API_KEY)
        .send({ attacker: 'pikachu', defender: 'bulbasaur' });
      expect(second.status).toBe(400);
    }, 60000);

    test('cannot add battle after tournament end time', async () => {
      const create = await request(app)
        .post('/api/tournaments')
        .set('X-API-Key', TEST_API_KEY)
        .send({ name: 'Expired Cup', max_rounds: 3 });
      const id = create.body.tournament.id;

      // Force tournament to be expired
      await Tournament.findByIdAndUpdate(id, { endTime: new Date(Date.now() - 1000), status: 'live' });

      const res = await request(app)
        .post(`/api/tournaments/${id}/battle`)
        .set('X-API-Key', TEST_API_KEY)
        .send({ attacker: 'pikachu', defender: 'bulbasaur' });
      expect(res.status).toBe(400);
    }, 60000);

    test('tournament auto-completion on time expiry', async () => {
      const create = await request(app)
        .post('/api/tournaments')
        .set('X-API-Key', TEST_API_KEY)
        .send({ name: 'Time Expiry Cup', max_rounds: 5, tournament_active_time: 1 }); // 1 minute
      const id = create.body.tournament.id;

      // Wait for tournament to expire
      await new Promise(resolve => setTimeout(resolve, 61000)); // Wait 61 seconds

      const res = await request(app)
        .post(`/api/tournaments/${id}/battle`)
        .set('X-API-Key', TEST_API_KEY)
        .send({ attacker: 'pikachu', defender: 'bulbasaur' });
      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Tournament has ended');
    }, 70000);

    test('tournament auto-completion on max rounds', async () => {
      const create = await request(app)
        .post('/api/tournaments')
        .set('X-API-Key', TEST_API_KEY)
        .send({ name: 'Max Rounds Cup', max_rounds: 2, tournament_active_time: 30 });
      const id = create.body.tournament.id;

      // First battle
      const battle1 = await request(app)
        .post(`/api/tournaments/${id}/battle`)
        .set('X-API-Key', TEST_API_KEY)
        .send({ attacker: 'pikachu', defender: 'bulbasaur' });
      expect(battle1.status).toBe(201);

      // Second battle
      const battle2 = await request(app)
        .post(`/api/tournaments/${id}/battle`)
        .set('X-API-Key', TEST_API_KEY)
        .send({ attacker: 'charmander', defender: 'squirtle' });
      expect(battle2.status).toBe(201);

      // Third battle should fail
      const battle3 = await request(app)
        .post(`/api/tournaments/${id}/battle`)
        .set('X-API-Key', TEST_API_KEY)
        .send({ attacker: 'eevee', defender: 'jigglypuff' });
      expect(battle3.status).toBe(400);
      expect(battle3.body.message).toBe('Tournament round limit reached');
    }, 60000);
  });

  describe('HP persistence edge cases', () => {
    test('Pokemon with 0 HP cannot battle', async () => {
      const create = await request(app)
        .post('/api/tournaments')
        .set('X-API-Key', TEST_API_KEY)
        .send({ name: 'HP Zero Cup', max_rounds: 4, tournament_active_time: 30 });
      const id = create.body.tournament.id;

      // First battle
      const battle1 = await request(app)
        .post(`/api/tournaments/${id}/battle`)
        .set('X-API-Key', TEST_API_KEY)
        .send({ attacker: 'pikachu', defender: 'bulbasaur' });
      expect(battle1.status).toBe(201);

      const loser = battle1.body.battle.attacker1Name === battle1.body.battle.winnerName ? 
        battle1.body.battle.attacker2Name : battle1.body.battle.attacker1Name;

      // Try to use the loser in another battle
      const battle2 = await request(app)
        .post(`/api/tournaments/${id}/battle`)
        .set('X-API-Key', TEST_API_KEY)
        .send({ attacker: loser, defender: 'charmander' });
      expect(battle2.status).toBe(201);

      // The loser should start with 0 HP and lose immediately
      expect(battle2.body.battle.winnerName).not.toBe(loser);
    }, 60000);

    test('HP state persists across tournament queries', async () => {
      const create = await request(app)
        .post('/api/tournaments')
        .set('X-API-Key', TEST_API_KEY)
        .send({ name: 'HP State Cup', max_rounds: 3, tournament_active_time: 30 });
      const id = create.body.tournament.id;

      // First battle
      const battle1 = await request(app)
        .post(`/api/tournaments/${id}/battle`)
        .set('X-API-Key', TEST_API_KEY)
        .send({ attacker: 'pikachu', defender: 'bulbasaur' });
      expect(battle1.status).toBe(201);

      const winner1 = battle1.body.battle.winnerName;
      const winner1Hp = battle1.body.battle.winnerRemainingHp;

      // Query tournament to verify HP state is saved
      const tournament = await Tournament.findById(id);
      const pokemonKey = `${winner1 === 'pikachu' ? 25 : 1}-${winner1}`;
      expect(tournament.hpState[pokemonKey]).toBe(winner1Hp);

      // Second battle should use the saved HP
      const battle2 = await request(app)
        .post(`/api/tournaments/${id}/battle`)
        .set('X-API-Key', TEST_API_KEY)
        .send({ attacker: winner1, defender: 'charmander' });
      expect(battle2.status).toBe(201);
    }, 60000);
  });

  describe('Tournament status logic edge cases', () => {
    test('tournament status updates correctly on time expiry', async () => {
      const create = await request(app)
        .post('/api/tournaments')
        .set('X-API-Key', TEST_API_KEY)
        .send({ name: 'Status Update Cup', max_rounds: 5, tournament_active_time: 1 });
      const id = create.body.tournament.id;

      // Verify tournament is live initially
      let tournament = await Tournament.findById(id);
      expect(tournament.status).toBe('live');

      // Wait for expiry
      await new Promise(resolve => setTimeout(resolve, 61000));

      // Try to add battle (this should auto-complete the tournament)
      await request(app)
        .post(`/api/tournaments/${id}/battle`)
        .set('X-API-Key', TEST_API_KEY)
        .send({ attacker: 'pikachu', defender: 'bulbasaur' });

      // Verify tournament is now completed
      tournament = await Tournament.findById(id);
      expect(tournament.status).toBe('completed');
    }, 70000);

    test('tournament status updates correctly on max rounds', async () => {
      const create = await request(app)
        .post('/api/tournaments')
        .set('X-API-Key', TEST_API_KEY)
        .send({ name: 'Max Rounds Status Cup', max_rounds: 2, tournament_active_time: 30 });
      const id = create.body.tournament.id;

      // First battle
      await request(app)
        .post(`/api/tournaments/${id}/battle`)
        .set('X-API-Key', TEST_API_KEY)
        .send({ attacker: 'pikachu', defender: 'bulbasaur' });

      let tournament = await Tournament.findById(id);
      expect(tournament.status).toBe('live');

      // Second battle (should complete tournament)
      await request(app)
        .post(`/api/tournaments/${id}/battle`)
        .set('X-API-Key', TEST_API_KEY)
        .send({ attacker: 'charmander', defender: 'squirtle' });

      tournament = await Tournament.findById(id);
      expect(tournament.status).toBe('completed');
    }, 60000);
  });

  describe('Battle service edge cases', () => {
    test('battle with Pokemon having very low HP', () => {
      const weakPokemon = { 
        id: 1, 
        name: 'weak', 
        types: ['normal'], 
        stats: { hp: 1, attack: 1, defense: 1, speed: 1 },
        currentHp: 1
      };
      const strongPokemon = { 
        id: 2, 
        name: 'strong', 
        types: ['normal'], 
        stats: { hp: 100, attack: 100, defense: 100, speed: 100 },
        currentHp: 100
      };

      const result = simulateBattle(weakPokemon, strongPokemon);
      expect(result.winner.name).toBe('strong');
      expect(result.rounds).toBe(2); // Weak Pokemon attacks first, then strong Pokemon finishes it
    });

    test('battle with identical Pokemon stats', () => {
      const pokemon1 = { 
        id: 1, 
        name: 'identical1', 
        types: ['normal'], 
        stats: { hp: 50, attack: 50, defense: 50, speed: 50 },
        currentHp: 50
      };
      const pokemon2 = { 
        id: 2, 
        name: 'identical2', 
        types: ['normal'], 
        stats: { hp: 50, attack: 50, defense: 50, speed: 50 },
        currentHp: 50
      };

      const result = simulateBattle(pokemon1, pokemon2);
      expect(result.winner).toBeDefined();
      expect(result.loser).toBeDefined();
      expect(result.winner.name).not.toBe(result.loser.name);
      expect(result.rounds).toBeGreaterThan(0);
    });
  });

  describe('Pokemon list validation', () => {
    test('invalid sortBy triggers validation error', async () => {
      const res = await request(app)
        .get('/api/pokemon/list?sortBy=invalidField')
        .set('X-API-Key', TEST_API_KEY);
      expect(res.status).toBe(400);
    });
  });

  describe('Cache utils', () => {
    test('set/get/clear work', () => {
      cache.set('k', { v: 1 }, 1000);
      expect(cache.get('k')).toEqual({ v: 1 });
      cache.clear();
      expect(cache.get('k')).toBe(null);
    });

    test('ttl expiry works', async () => {
      cache.set('exp', 42, 10);
      expect(cache.get('exp')).toBe(42);
      await new Promise(r => setTimeout(r, 20));
      expect(cache.get('exp')).toBe(null);
    });
  });

  describe('PokeAPI service error handling', () => {
    test('handles axios timeout and 429', async () => {
      jest.resetModules();
      jest.doMock('axios', () => ({ get: jest.fn()
        .mockRejectedValueOnce(Object.assign(new Error('timeout'), { code: 'ECONNABORTED' }))
        .mockRejectedValueOnce({ response: { status: 429 } }) }));
      const service = require('../src/services/pokeapi.service');
      await expect(service.fetchPokemonList(1,0)).rejects.toThrow('timed out');
      await expect(service.fetchPokemonList(1,0)).rejects.toThrow('rate limit');
      jest.dontMock('axios');
    }, 10000);
  });
});


