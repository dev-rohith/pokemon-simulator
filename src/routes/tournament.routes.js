const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { rateLimiter } = require('../middleware/rateLimiter');
const { addBattleToTournament } = require('../controllers/tournamentController');

router.use(authenticate);
router.use(rateLimiter);

router.post('/:tournamentId/battle', addBattleToTournament);


module.exports = router;


