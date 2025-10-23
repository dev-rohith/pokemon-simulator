const { fetchPokemonListPaginated, fetchPokemonDetails } = require('../services/pokeapi.service');
const { validate, pokemonListSchema, pokemonDetailsSchema } = require('../utils/validators');
const cache = require('../utils/cache');

// GET /api/pokemon/names - List Pokemon names with pagination, filtering, and sorting
const getPokemonNames = async (req, res) => {
  const start = Date.now();
  try {
    const params = validate(req.query, pokemonListSchema);

    const page = params.page || 1;
    const limit = params.limit || 20;
    const offset = (page - 1) * limit;

    const filters = {
      type: params.type,
      generation: params.generation,
      minStats: params.minStats,
      maxStats: params.maxStats,
      sortBy: params.sortBy,
      sortOrder: params.sortOrder,
    };

    const cacheKey = `pokemon_names_${page}_${limit}_${JSON.stringify(filters)}`;
    const cached = cache.get(cacheKey);
    if (cached) {
      const execTime = Date.now() - start;
      return res.json({ ...cached, cached: true, executionTime: execTime });
    }

    const { data, totalCount } = await fetchPokemonListPaginated(limit, offset, filters);

    // Extract names and IDs from the data
    const pokemons = data.map(pokemon => ({
      id: pokemon.id,
      name: pokemon.name
    }));

    const totalPages = Math.ceil(totalCount / limit) || 1;
    const response = {
      pokemons: pokemons,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages,
      },
    };

    cache.set(cacheKey, response, parseInt(process.env.CACHE_TTL) || 300000);

    const execTime = Date.now() - start;
    return res.json({ ...response, cached: false, executionTime: execTime });
  } catch (error) {
    if (error.isJoi) {
      return res.status(400).json({ message: 'Invalid parameters' });
    }
    return res.status(500).json({ message: 'Failed to fetch Pokemon names' });
  }
};

// GET /api/pokemon/:name - Get detailed Pokemon information
const getPokemonDetails = async (req, res) => {
  const start = Date.now();
  try {
    const { name } = validate(req.params, pokemonDetailsSchema);

    const cacheKey = `pokemon_details_${name.toLowerCase()}`;
    const cached = cache.get(cacheKey);
    if (cached) {
      const execTime = Date.now() - start;
      return res.json({ ...cached, cached: true, executionTime: execTime });
    }

    const pokemonData = await fetchPokemonDetails(name);

    const response = {
      data: pokemonData
    };

    cache.set(cacheKey, response, parseInt(process.env.CACHE_TTL) || 300000);

    const execTime = Date.now() - start;
    return res.json({ ...response, cached: false, executionTime: execTime });
  } catch (error) {
    if (error.isJoi) {
      return res.status(400).json({ message: 'Invalid Pokemon name' });
    }
    if (error.message.includes('not found')) {
      return res.status(404).json({ message: 'Pokemon not found' });
    }
    return res.status(500).json({ message: 'Failed to fetch Pokemon details' });
  }
};

module.exports = {
  getPokemonNames,
  getPokemonDetails,
};