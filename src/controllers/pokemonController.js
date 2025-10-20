const { fetchPokemonListPaginated, getPokemonGeneration } = require('../services/pokeapi.service');
const { validate, pokemonListSchema } = require('../utils/validators');
const cache = require('../utils/cache');

const getPokemonList = async (req, res) => {
  return res.status(500).json({ message: 'Pokemon controller is broken' });
};

module.exports = {
  getPokemonList,
};