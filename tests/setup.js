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
  fetchPokemonListPaginated: jest.fn().mockImplementation((limit, offset, filters) => {
    const allPokemon = [
      { id: 1, name: 'bulbasaur', types: ['grass', 'poison'], height: 7, weight: 69, baseExperience: 64, 
        stats: { hp: 45, attack: 49, defense: 49, specialAttack: 65, specialDefense: 65, speed: 45, total: 318 },
        abilities: ['overgrow', 'chlorophyll'], sprite: 'https://example.com/1.png' },
      { id: 4, name: 'charmander', types: ['fire'], height: 6, weight: 85, baseExperience: 62,
        stats: { hp: 39, attack: 52, defense: 43, specialAttack: 60, specialDefense: 50, speed: 65, total: 309 },
        abilities: ['blaze', 'solar-power'], sprite: 'https://example.com/4.png' },
      { id: 7, name: 'squirtle', types: ['water'], height: 5, weight: 90, baseExperience: 63,
        stats: { hp: 44, attack: 48, defense: 65, specialAttack: 50, specialDefense: 64, speed: 43, total: 314 },
        abilities: ['torrent', 'rain-dish'], sprite: 'https://example.com/7.png' },
      { id: 25, name: 'pikachu', types: ['electric'], height: 4, weight: 60, baseExperience: 112,
        stats: { hp: 35, attack: 55, defense: 40, specialAttack: 50, specialDefense: 50, speed: 90, total: 320 },
        abilities: ['static', 'lightning-rod'], sprite: 'https://example.com/25.png' },
      { id: 39, name: 'jigglypuff', types: ['normal', 'fairy'], height: 5, weight: 55, baseExperience: 95,
        stats: { hp: 115, attack: 45, defense: 20, specialAttack: 45, specialDefense: 25, speed: 20, total: 270 },
        abilities: ['cute-charm', 'competitive'], sprite: 'https://example.com/39.png' },
      { id: 133, name: 'eevee', types: ['normal'], height: 3, weight: 65, baseExperience: 65,
        stats: { hp: 55, attack: 55, defense: 50, specialAttack: 45, specialDefense: 65, speed: 55, total: 325 },
        abilities: ['run-away', 'adaptability'], sprite: 'https://example.com/133.png' },
      { id: 150, name: 'mewtwo', types: ['psychic'], height: 20, weight: 1220, baseExperience: 306,
        stats: { hp: 106, attack: 110, defense: 90, specialAttack: 154, specialDefense: 90, speed: 130, total: 680 },
        abilities: ['pressure', 'unnerve'], sprite: 'https://example.com/150.png' }
    ];
    
    let filtered = [...allPokemon];
    
    // Apply filters
    if (filters?.type) {
      filtered = filtered.filter(p => p.types.includes(filters.type));
    }
    if (filters?.generation) {
      filtered = filtered.filter(p => p.id <= 151);
    }
    if (filters?.minStats) {
      filtered = filtered.filter(p => p.stats.total >= filters.minStats);
    }
    if (filters?.maxStats) {
      filtered = filtered.filter(p => p.stats.total <= filters.maxStats);
    }
    
    // Apply sorting
    if (filters?.sortBy) {
      filtered.sort((a, b) => {
        let aVal = a[filters.sortBy] || a.stats[filters.sortBy] || 0;
        let bVal = b[filters.sortBy] || b.stats[filters.sortBy] || 0;
        if (filters.sortBy === 'name') {
          return filters.sortOrder === 'desc' ? bVal.localeCompare(aVal) : aVal.localeCompare(bVal);
        }
        if (filters.sortBy === 'base_experience') {
          aVal = a.baseExperience;
          bVal = b.baseExperience;
        }
        return filters.sortOrder === 'desc' ? bVal - aVal : aVal - bVal;
      });
    }
    
    // Apply pagination
    const paginated = filtered.slice(offset, offset + limit);
    
    return Promise.resolve({
      data: paginated,
      totalCount: filtered.length,
      cached: false
    });
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
