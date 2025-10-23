const axios = require('axios');
const cache = require('../utils/cache');

const POKEAPI_BASE_URL = process.env.POKEAPI_BASE_URL || 'https://pokeapi.co/api/v2';
const CACHE_TTL = parseInt(process.env.CACHE_TTL) || 300000; // 5 minutes


async function fetchPokemonList(limit = 1000, offset = 0) {
  try {
    const cacheKey = `pokemonList_${limit}_${offset}`;
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


async function fetchPokemonListPaginated(limit = 20, offset = 0, filters = {}) {
  try {
    const cacheKey = `pokemonListPaginated_${limit}_${offset}_${JSON.stringify(filters)}`;
    const cached = cache.get(cacheKey);

    if (cached) {
      return { data: cached.data, totalCount: cached.totalCount, cached: true };
    }

    // Fetch the specific range of Pokemon based on offset and limit
    // For offset 0 with limit 10, fetch Pokemon 1-10
    const fetchLimit = limit;
    const fetchOffset = offset;
    const response = await axios.get(`${POKEAPI_BASE_URL}/pokemon`, {
      params: { limit: fetchLimit, offset: fetchOffset },
      timeout: 15000,
    });

    // Fetch detailed data for the batch
    const detailedPromises = response.data.results.map(pokemon =>
      fetchPokemonDetails(pokemon.url)
    );

    const pokemonBatch = await Promise.all(detailedPromises);

    // Apply filters to the batch
    let filteredPokemon = pokemonBatch;

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
        case 'id':
          aValue = a.id;
          bValue = b.id;
          break;
        case 'name':
          aValue = a.name;
          bValue = b.name;
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

    const paginatedPokemon = filteredPokemon;

    const totalCount = 1000; 

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

    const cached = cache.get(url);
    if (cached) {
      return cached;
    }

    const response = await axios.get(url, { timeout: 10000 });
    const pokemon = response.data;

    // Transform to simplified format
    const simplified = transformPokemonData(pokemon);

    cache.set(url, simplified, CACHE_TTL);

    return simplified;
  } catch (error) {
    if (error.response?.status === 404) {
      throw new Error(`Pokemon not found: ${urlOrId}`);
    }
    console.error('Pokemon details fetch error:', error.message);
    throw new Error('Failed to fetch Pokemon details');
  }
}


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
 