const express = require('express');
const router = express.Router();
const { getPokemonNames, getPokemonDetails } = require('../controllers/pokemonController');
const { authenticate } = require('../middleware/auth');
const { rateLimiter } = require('../middleware/rateLimiter');

router.use(authenticate);
router.use(rateLimiter);

router.get('/', getPokemonNames);
router.get('/:name', getPokemonDetails);

module.exports = router;
