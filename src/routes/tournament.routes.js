const express = require('express');
const { authenticate } = require('../middleware/auth');
const {
  createTournament,
  getLiveTournaments,
  getCompletedTournaments,
  addBattleToTournament,
  getTournamentResults
} = require('../controllers/tournamentController');

const router = express.Router();

router.use(authenticate);

router.post('/', createTournament);
router.get('/live', getLiveTournaments);
router.get('/completed', getCompletedTournaments);
router.post('/:id/battle', addBattleToTournament);
router.get('/:id/results', getTournamentResults);

module.exports = router;