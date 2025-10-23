const express = require('express');
const { simulateBattleController, listBattlesController } = require('../controllers/battleController');
const { authenticate } = require('../middleware/auth');
const { rateLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.use(authenticate);
router.use(rateLimiter);

router.post('/', simulateBattleController);
router.get('/', listBattlesController);

module.exports = router;
