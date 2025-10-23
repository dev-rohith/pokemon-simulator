const { simulateBattle } = require('../services/battle.service');
const Battle = require('../models/Battle');
const { validate, battleSimulateSchema } = require('../utils/validators');


const simulateBattleController = async (req, res) => {
  try {
    // Validate request body using Joi
    const { attacker1, attacker2 } = validate(req.body, battleSimulateSchema);

    // Simulate the battle
    const battleResult = simulateBattle(attacker1, attacker2);

    // Create battle record in database
    const battle = new Battle({
      attacker1: attacker1.name,
      attacker2: attacker2.name,
      winner: battleResult.winner.name,
      userId: req.user.id // Get userId from JWT token (set by auth middleware)
    });

    await battle.save();

    // Return the battle result
    res.json({
      message: 'Battle completed successfully',
      battle: {
        id: battle._id,
        attacker1: battle.attacker1,
        attacker2: battle.attacker2,
        winner: battle.winner,
        createdAt: battle.createdAt
      }
    });

  } catch (error) {
    console.error('Battle simulation error:', error);
    if (error.isJoi) {
      return res.status(400).json({ 
        message: 'Invalid input data',
        errors: error.details.map(detail => detail.message)
      });
    }
    res.status(500).json({ 
      message: 'Failed to simulate battle',
      error: error.message 
    });
  }
};

const listBattlesController = async (req, res) => {
  try {
    const start = Date.now();
    
    // Get battles for the authenticated user only, sorted by newest first
    const battles = await Battle.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .select('attacker1 attacker2 winner createdAt')
      .lean();
    
    const response = {
      battles: battles,
      total: battles.length,
      cached: false,
      executionTime: Date.now() - start
    };
    
    res.json(response);
    
  } catch (error) {
    console.error('List battles error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch battles',
      error: error.message 
    });
  }
};

module.exports = {
  simulateBattleController,
  listBattlesController
};
