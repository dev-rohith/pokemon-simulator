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
      { id: 1, name: 'bulbasaur' },
      { id: 4, name: 'charmander' },
      { id: 7, name: 'squirtle' },
      { id: 25, name: 'pikachu' },
      { id: 39, name: 'jigglypuff' },
      { id: 133, name: 'eevee' },
      { id: 150, name: 'mewtwo' }
    ];
    
    let filtered = [...allPokemon];
    
    // No filtering needed - just use the pokemon list as is
    
    // Apply sorting
    if (filters?.sortBy) {
      filtered.sort((a, b) => {
        let aVal = a[filters.sortBy];
        let bVal = b[filters.sortBy];
        
        if (typeof aVal === 'string') {
          aVal = aVal.toLowerCase();
          bVal = bVal.toLowerCase();
        }
        
        if (filters.sortOrder === 'desc') {
          return bVal > aVal ? 1 : bVal < aVal ? -1 : 0;
        } else {
          return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
        }
      });
    }
    
    // Apply pagination
    const paginated = filtered.slice(offset, offset + limit);
    const total = filtered.length;
    const totalPages = Math.ceil(total / limit);
    
    return Promise.resolve({
      pokemons: paginated,
      pagination: {
        page: Math.floor(offset / limit) + 1,
        limit,
        total,
        totalPages
      },
      cached: false,
      executionTime: 100
    });
  }),
  fetchPokemonDetails: jest.fn().mockImplementation((name) => {
    const pokemonData = {
      'bulbasaur': { 
        id: 1, 
        name: 'bulbasaur', 
        height: 7, 
        weight: 69, 
        baseExperience: 64,
        types: ['grass', 'poison'], 
        stats: { hp: 45, attack: 49, defense: 49, specialAttack: 65, specialDefense: 65, speed: 45, total: 318 },
        abilities: ['overgrow', 'chlorophyll'],
        sprite: 'https://example.com/1.png'
      },
      'charmander': { 
        id: 4, 
        name: 'charmander', 
        height: 6, 
        weight: 85, 
        baseExperience: 62,
        types: ['fire'], 
        stats: { hp: 39, attack: 52, defense: 43, specialAttack: 60, specialDefense: 50, speed: 65, total: 309 },
        abilities: ['blaze', 'solar-power'],
        sprite: 'https://example.com/4.png'
      },
      'squirtle': { 
        id: 7, 
        name: 'squirtle', 
        height: 5, 
        weight: 90, 
        baseExperience: 63,
        types: ['water'], 
        stats: { hp: 44, attack: 48, defense: 65, specialAttack: 50, specialDefense: 64, speed: 43, total: 314 },
        abilities: ['torrent', 'rain-dish'],
        sprite: 'https://example.com/7.png'
      },
      'pikachu': { 
        id: 25, 
        name: 'pikachu', 
        height: 4, 
        weight: 60, 
        baseExperience: 112,
        types: ['electric'], 
        stats: { hp: 35, attack: 55, defense: 40, specialAttack: 50, specialDefense: 50, speed: 90, total: 320 },
        abilities: ['static', 'lightning-rod'],
        sprite: 'https://example.com/25.png'
      },
      'jigglypuff': { 
        id: 39, 
        name: 'jigglypuff', 
        height: 5, 
        weight: 55, 
        baseExperience: 95,
        types: ['normal', 'fairy'], 
        stats: { hp: 115, attack: 45, defense: 20, specialAttack: 45, specialDefense: 25, speed: 20, total: 270 },
        abilities: ['cute-charm', 'competitive'],
        sprite: 'https://example.com/39.png'
      },
      'eevee': { 
        id: 133, 
        name: 'eevee', 
        height: 3, 
        weight: 65, 
        baseExperience: 65,
        types: ['normal'], 
        stats: { hp: 55, attack: 55, defense: 50, specialAttack: 45, specialDefense: 65, speed: 55, total: 325 },
        abilities: ['run-away', 'adaptability'],
        sprite: 'https://example.com/133.png'
      }
    };
    
    const pokemon = pokemonData[name] || pokemonData['pikachu'];
    return Promise.resolve({
      data: pokemon,
      cached: false,
      executionTime: 100
    });
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
