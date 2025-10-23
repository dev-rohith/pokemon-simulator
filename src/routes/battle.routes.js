const express = require('express');
const { listBattles, simulateBattle } = require('../controllers/battleController');
const { authenticate } = require('../middleware/auth');
const router = express.Router();

router.use(authenticate);

router.post('/', simulateBattle);
router.get('/', listBattles);

module.exports = router;
