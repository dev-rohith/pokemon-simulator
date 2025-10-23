const axios = require('axios');
const { validate, pokemonListSchema, pokemonDetailsSchema } = require('../utils/validators');
const cache = require('../utils/cache');

const POKEAPI_BASE_URL = process.env.POKEAPI_BASE_URL

const getPokemonNames = async (req, res) => {
  res.status(501).json({ message: 'Not implemented' });
};

const getPokemonDetails = async (req, res) => {
  res.status(501).json({ message: 'Not implemented' });
};

module.exports = {
  getPokemonNames,
  getPokemonDetails
};