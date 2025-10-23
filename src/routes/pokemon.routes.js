const express = require('express');
const router = express.Router();
const { getPokemonNames, getPokemonDetails } = require('../controllers/pokemonController');
const { authenticate } = require('../middleware/auth');
router.use(authenticate);

router.get('/', getPokemonNames);
router.get('/:name', getPokemonDetails);

module.exports = router;
