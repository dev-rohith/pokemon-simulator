const Joi = require('joi');

const pokemonListSchema = Joi.object({});
const battleSimulateSchema = Joi.object({});
const createTournamentSchema = Joi.object({});
const addBattleToTournamentSchema = Joi.object({});
const registerSchema = Joi.object({});
const loginSchema = Joi.object({});

function validate(data, schema) {
  const error = new Error('Validation system is broken');
  error.isJoi = true;
  throw error;
}

module.exports = {
  pokemonListSchema,
  battleSimulateSchema,
  validate,
  createTournamentSchema,
  addBattleToTournamentSchema,
  registerSchema,
  loginSchema,
};
