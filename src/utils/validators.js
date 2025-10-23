const Joi = require('joi');

const pokemonListSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  type: Joi.string().lowercase().optional(),
  generation: Joi.number().integer().min(1).max(8).optional(),
  minStats: Joi.number().integer().min(0).optional(),
  maxStats: Joi.number().integer().min(0).optional(),
  sortBy: Joi.string().valid('id', 'name').optional(),
  sortOrder: Joi.string().valid('asc', 'desc').default('asc').optional(),
});

const battleSimulateSchema = Joi.object({
  attacker1: Joi.object({
    name: Joi.string().required(),
    stats: Joi.object({
      hp: Joi.number().required(),
      attack: Joi.number().required(),
      defense: Joi.number().required(),
      specialAttack: Joi.number().required(),
      specialDefense: Joi.number().required(),
      speed: Joi.number().required(),
      total: Joi.number().required(),
    }).required(),
  }).required(),
  attacker2: Joi.object({
    name: Joi.string().required(),
    stats: Joi.object({
      hp: Joi.number().required(),
      attack: Joi.number().required(),
      defense: Joi.number().required(),
      specialAttack: Joi.number().required(),
      specialDefense: Joi.number().required(),
      speed: Joi.number().required(),
      total: Joi.number().required(),
    }).required(),
  }).required(),
});


const pokemonDetailsSchema = Joi.object({
  name: Joi.string().trim().required(),
});


const registerSchema = Joi.object({
  username: Joi.string().trim().min(3).max(30).required(),
  password: Joi.string().min(6).required(),
});

const loginSchema = Joi.object({
  username: Joi.string().trim().required(),
  password: Joi.string().required(),
});

function validate(data, schema) {
  const { value, error } = schema.validate(data, { abortEarly: false, stripUnknown: true });
  if (error) {
    error.isJoi = true;
    throw error;
  }
  return value;
}

module.exports = {
  pokemonListSchema,
  pokemonDetailsSchema,
  battleSimulateSchema,
  registerSchema,
  loginSchema,
  validate,
};
