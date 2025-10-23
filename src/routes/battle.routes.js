const express = require('express');
const { simulateBattleController, listBattlesController } = require('../controllers/battleController');
const { authenticate } = require('../middleware/auth');
const router = express.Router();

router.use(authenticate);

router.post('/', simulateBattleController);
router.get('/', listBattlesController);

module.exports = router;
