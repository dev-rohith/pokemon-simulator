const axios = require('axios');
const cache = require('../utils/cache');

const POKEAPI_BASE_URL = process.env.POKEAPI_BASE_URL || 'https://pokeapi.co/api/v2';
const CACHE_TTL = parseInt(process.env.CACHE_TTL) || 300000; // 5 minutes

/**
 * Fetch all Pokemon with pagination
 * @param {number} limit - Number of Pokemon to fetch
 * @param {number} offset - Offset for pagination
 * @returns {Promise<Array>} Array of Pokemon data
 */
async function fetchPokemonList(limit = 1000, offset = 0) {
  try {
    const cacheKey = `pokemonList:${limit}:${offset}`;
    const cached = cache.get(cacheKey);

    if (cached) {
      return { data: cached, cached: true };
    }

    const response = await axios.get(`${POKEAPI_BASE_URL}/pokemon`, {
      params: { limit, offset },
      timeout: 10000,
    });

    // Fetch detailed data for each Pokemon
    const detailedPromises = response.data.results.map(pokemon =>
      fetchPokemonDetails(pokemon.url)
    );

    const detailedData = await Promise.all(detailedPromises);

    cache.set(cacheKey, detailedData, CACHE_TTL);

    return { data: detailedData, cached: false };
  } catch (error) {
    console.error('PokeAPI fetch error:', error.message);
    if (error.code === 'ECONNABORTED') {
      throw new Error('PokeAPI request timed out. Please try again later.');
    }
    if (error.response?.status === 429) {
      throw new Error('PokeAPI rate limit exceeded. Please try again later.');
    }
    throw new Error('Failed to fetch Pokemon data from PokeAPI');
  }
}

/**
 * Fetch Pokemon list with pagination and filtering
 * @param {number} limit - Number of Pokemon to fetch per page
 * @param {number} offset - Offset for pagination
 * @param {object} filters - Filter options
 * @returns {Promise<{data: Array, totalCount: number}>} Pokemon data with total count
 */
async function fetchPokemonListPaginated(limit = 20, offset = 0, filters = {}) {
  try {
    const cacheKey = `pokemonListPaginated:${limit}:${offset}:${JSON.stringify(filters)}`;
    const cached = cache.get(cacheKey);

    if (cached) {
      return { data: cached.data, totalCount: cached.totalCount, cached: true };
    }

    // First, get the total count by fetching a small sample to determine total available
    const countResponse = await axios.get(`${POKEAPI_BASE_URL}/pokemon`, {
      params: { limit: 1, offset: 0 },
      timeout: 10000,
    });

    // Get the total count from the API (PokeAPI doesn't provide total count directly)
    // We'll fetch a reasonable number and filter client-side for now
    const maxFetch = 1000; // Reasonable limit to avoid timeouts
    const response = await axios.get(`${POKEAPI_BASE_URL}/pokemon`, {
      params: { limit: maxFetch, offset: 0 },
      timeout: 15000,
    });

    // Fetch detailed data for all Pokemon
    const detailedPromises = response.data.results.map(pokemon =>
      fetchPokemonDetails(pokemon.url)
    );

    const allPokemon = await Promise.all(detailedPromises);

    // Apply filters
    let filteredPokemon = allPokemon;

    if (filters.type) {
      filteredPokemon = filteredPokemon.filter(p =>
        p.types.includes(filters.type.toLowerCase())
      );
    }

    if (filters.generation) {
      filteredPokemon = filteredPokemon.filter(p =>
        getPokemonGeneration(p.id) === filters.generation
      );
    }

    if (filters.minStats) {
      filteredPokemon = filteredPokemon.filter(p =>
        p.stats.total >= filters.minStats
      );
    }

    if (filters.maxStats) {
      filteredPokemon = filteredPokemon.filter(p =>
        p.stats.total <= filters.maxStats
      );
    }

    // Apply sorting
    if (filters.sortBy) {
      filteredPokemon.sort((a, b) => {
        let aValue, bValue;

        switch (filters.sortBy) {
        case 'name':
          aValue = a.name;
          bValue = b.name;
          break;
        case 'height':
          aValue = a.height;
          bValue = b.height;
          break;
        case 'weight':
          aValue = a.weight;
          bValue = b.weight;
          break;
        case 'base_experience':
          aValue = a.baseExperience || 0;
          bValue = b.baseExperience || 0;
          break;
        default:
          aValue = a.name;
          bValue = b.name;
        }

        if (typeof aValue === 'string') {
          return filters.sortOrder === 'asc'
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        }

        return filters.sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
      });
    }

    // Apply pagination
    const totalCount = filteredPokemon.length;
    const paginatedPokemon = filteredPokemon.slice(offset, offset + limit);

    const result = {
      data: paginatedPokemon,
      totalCount
    };

    cache.set(cacheKey, result, CACHE_TTL);

    return { data: paginatedPokemon, totalCount, cached: false };
  } catch (error) {
    console.error('PokeAPI paginated fetch error:', error.message);
    if (error.code === 'ECONNABORTED') {
      throw new Error('PokeAPI request timed out. Please try again later.');
    }
    if (error.response?.status === 429) {
      throw new Error('PokeAPI rate limit exceeded. Please try again later.');
    }
    throw new Error('Failed to fetch Pokemon data from PokeAPI');
  }
}

/**
 * Fetch detailed Pokemon data
 * @param {string} urlOrId - Pokemon URL or ID
 * @returns {Promise<object>} Pokemon details
 */
async function fetchPokemonDetails(urlOrId) {
  try {
    const cacheKey = `pokemon:${urlOrId}`;
    const cached = cache.get(cacheKey);

    if (cached) {
      return cached;
    }

    let url;
    if (typeof urlOrId === 'number') {
      url = `${POKEAPI_BASE_URL}/pokemon/${urlOrId}`;
    } else if (urlOrId.startsWith('http')) {
      // It's a full URL
      url = urlOrId;
    } else {
      // It's a Pokemon name
      url = `${POKEAPI_BASE_URL}/pokemon/${urlOrId}`;
    }

    const response = await axios.get(url, { timeout: 10000 });
    const pokemon = response.data;

    // Transform to simplified format
    const simplified = transformPokemonData(pokemon);

    cache.set(cacheKey, simplified, CACHE_TTL);

    return simplified;
  } catch (error) {
    if (error.response?.status === 404) {
      throw new Error(`Pokemon not found: ${urlOrId}`);
    }
    console.error('Pokemon details fetch error:', error.message);
    throw new Error('Failed to fetch Pokemon details');
  }
}

/**
 * Transform Pokemon data to simplified format
 * @param {object} pokemon - Raw Pokemon data from PokeAPI
 * @returns {object} Simplified Pokemon data
 */
function transformPokemonData(pokemon) {
  const stats = pokemon.stats.reduce((acc, stat) => {
    acc[stat.stat.name] = stat.base_stat;
    return acc;
  }, {});

  const totalStats = pokemon.stats.reduce((sum, stat) => sum + stat.base_stat, 0);

  return {
    id: pokemon.id,
    name: pokemon.name,
    height: pokemon.height,
    weight: pokemon.weight,
    baseExperience: pokemon.base_experience,
    types: pokemon.types.map(t => t.type.name),
    stats: {
      hp: stats.hp,
      attack: stats.attack,
      defense: stats.defense,
      specialAttack: stats['special-attack'],
      specialDefense: stats['special-defense'],
      speed: stats.speed,
      total: totalStats,
    },
    abilities: pokemon.abilities.map(a => a.ability.name),
    sprite: pokemon.sprites.front_default,
  };
}

/**
 * Get Pokemon generation based on ID
 * @param {number} id - Pokemon ID
 * @returns {number} Generation number
 */
function getPokemonGeneration(id) {
  if (id <= 151) return 1;
  if (id <= 251) return 2;
  if (id <= 386) return 3;
  if (id <= 493) return 4;
  if (id <= 649) return 5;
  if (id <= 721) return 6;
  if (id <= 809) return 7;
  return 8;
}

module.exports = {
  fetchPokemonList,
  fetchPokemonListPaginated,
  fetchPokemonDetails,
  transformPokemonData,
  getPokemonGeneration,
};
