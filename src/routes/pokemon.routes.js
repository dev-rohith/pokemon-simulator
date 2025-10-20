const express = require('express');
const router = express.Router();
const { getPokemonList } = require('../controllers/pokemonController');
const { authenticate } = require('../middleware/auth');
const { rateLimiter } = require('../middleware/rateLimiter');

// All routes require authentication and rate limiting
router.use(authenticate);
router.use(rateLimiter);

// GET /api/pokemon/list
router.get('/list', getPokemonList);

module.exports = router;
