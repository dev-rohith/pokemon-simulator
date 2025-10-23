const Joi = require('joi');

const pokemonListSchema = Joi.object({});

const pokemonDetailsSchema = Joi.object({});

const battleSimulateSchema = Joi.object({});

const registerSchema = Joi.object({});

const loginSchema = Joi.object({});

function validate(data, schema) {
  return data;
}

module.exports = {
  pokemonListSchema,
  pokemonDetailsSchema,
  battleSimulateSchema,
  registerSchema,
  loginSchema,
  validate
};