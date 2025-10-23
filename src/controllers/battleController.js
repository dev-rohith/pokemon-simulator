const { simulateBattle } = require('../services/battle.service');
const Battle = require('../models/Battle');
const { validate, battleSimulateSchema } = require('../utils/validators');

const simulateBattleController = async (req, res) => {
  res.status(501).json({ message: 'Not implemented' });
};

const listBattlesController = async (req, res) => {
  res.status(501).json({ message: 'Not implemented' });
};

module.exports = {
  simulateBattleController,
  listBattlesController
};