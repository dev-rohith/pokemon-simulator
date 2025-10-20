require('dotenv').config();
const { mongoose } = require('../src/config/database');
const { connectDatabase } = require('../src/config/database');
const cache = require('../src/utils/cache');
let mem;

// Mock PokeAPI service to avoid timeouts in tests
jest.mock('../src/services/pokeapi.service', () => ({
  fetchPokemonList: jest.fn().mockResolvedValue({
    data: [
      { id: 1, name: 'bulbasaur', types: ['grass', 'poison'], stats: { hp: 45, attack: 49, defense: 49, speed: 45 } },
      { id: 4, name: 'charmander', types: ['fire'], stats: { hp: 39, attack: 52, defense: 43, speed: 65 } },
      { id: 7, name: 'squirtle', types: ['water'], stats: { hp: 44, attack: 48, defense: 65, speed: 43 } },
      { id: 25, name: 'pikachu', types: ['electric'], stats: { hp: 35, attack: 55, defense: 40, speed: 90 } },
      { id: 39, name: 'jigglypuff', types: ['normal', 'fairy'], stats: { hp: 115, attack: 45, defense: 20, speed: 20 } },
      { id: 133, name: 'eevee', types: ['normal'], stats: { hp: 55, attack: 55, defense: 50, speed: 55 } }
    ],
    cached: false
  }),
  fetchPokemonListPaginated: jest.fn().mockResolvedValue({
    data: [
      { id: 1, name: 'bulbasaur', types: ['grass', 'poison'], stats: { hp: 45, attack: 49, defense: 49, speed: 45 } },
      { id: 4, name: 'charmander', types: ['fire'], stats: { hp: 39, attack: 52, defense: 43, speed: 65 } },
      { id: 7, name: 'squirtle', types: ['water'], stats: { hp: 44, attack: 48, defense: 65, speed: 43 } },
      { id: 25, name: 'pikachu', types: ['electric'], stats: { hp: 35, attack: 55, defense: 40, speed: 90 } },
      { id: 39, name: 'jigglypuff', types: ['normal', 'fairy'], stats: { hp: 115, attack: 45, defense: 20, speed: 20 } },
      { id: 133, name: 'eevee', types: ['normal'], stats: { hp: 55, attack: 55, defense: 50, speed: 55 } }
    ],
    totalCount: 6,
    cached: false
  }),
  fetchPokemonDetails: jest.fn().mockImplementation((name) => {
    const pokemonData = {
      'bulbasaur': { id: 1, name: 'bulbasaur', types: ['grass', 'poison'], stats: { hp: 45, attack: 49, defense: 49, speed: 45 } },
      'charmander': { id: 4, name: 'charmander', types: ['fire'], stats: { hp: 39, attack: 52, defense: 43, speed: 65 } },
      'squirtle': { id: 7, name: 'squirtle', types: ['water'], stats: { hp: 44, attack: 48, defense: 65, speed: 43 } },
      'pikachu': { id: 25, name: 'pikachu', types: ['electric'], stats: { hp: 35, attack: 55, defense: 40, speed: 90 } },
      'jigglypuff': { id: 39, name: 'jigglypuff', types: ['normal', 'fairy'], stats: { hp: 115, attack: 45, defense: 20, speed: 20 } },
      'eevee': { id: 133, name: 'eevee', types: ['normal'], stats: { hp: 55, attack: 55, defense: 50, speed: 55 } }
    };
    return Promise.resolve(pokemonData[name] || pokemonData['pikachu']);
  }),
  transformPokemonData: jest.fn().mockImplementation((data) => data),
  getPokemonGeneration: jest.fn().mockReturnValue(1)
}));

// Global test setup
beforeAll(async () => {
  try {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    mem = await MongoMemoryServer.create();
    process.env.DATABASE_URL = mem.getUri();
    await connectDatabase();
  } catch (error) {
    console.error('Test database connection failed:', error);
    throw error;
  }
});

// Clear cache before each test
beforeEach(() => {
  cache.clear();
});

// Global test teardown
afterAll(async () => {
  try {
    await mongoose.disconnect();
    if (mem) await mem.stop();
  } catch (error) {
    console.error('Test database disconnection failed:', error);
  }
});
