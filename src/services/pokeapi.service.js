const axios = require('axios');

const POKEAPI_BASE_URL = process.env.POKEAPI_BASE_URL || 'https://pokeapi.co/api/v2';
const CACHE_TTL = parseInt(process.env.CACHE_TTL) || 300000;

async function fetchPokemonListPaginated(limit = 20, offset = 0, filters = {}) {
  throw new Error('Not implemented');
}

async function fetchPokemonDetails(pokemonName) {
  throw new Error('Not implemented');
}

function getPokemonGeneration(pokemonId) {
  return 1;
}

module.exports = {
  fetchPokemonListPaginated,
  fetchPokemonDetails,
  getPokemonGeneration
};