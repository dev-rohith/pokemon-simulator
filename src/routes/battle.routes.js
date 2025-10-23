const express = require('express');
const { listBattlesController } = require('../controllers/battleController');
const { authenticate } = require('../middleware/auth');
const router = express.Router();

router.use(authenticate);

router.post('/', '' );
router.get('/', listBattlesController);

module.exports = router;
