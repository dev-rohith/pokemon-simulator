const express = require('express');
const { listBattles } = require('../controllers/battleController');
const { authenticate } = require('../middleware/auth');
const router = express.Router();

router.use(authenticate);

router.post('/', '' );
router.get('/', listBattles);

module.exports = router;
