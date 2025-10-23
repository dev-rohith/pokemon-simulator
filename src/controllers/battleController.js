const Battle = require('../models/Battle');
const { validate, battleSimulateSchema } = require('../utils/validators');
const cache = require('../utils/cache');


function calculateDamage(attacker, defender, typeModifier) {
  const level = 50;
  const basePower = 60;

  const damage = Math.floor(
    ((2 * level + 10) / 250) *
    (attacker.stats.attack / defender.stats.defense) *
    basePower *
    (typeModifier || 1)
  );

  return Math.max(1, damage);
}

function simulateBattle(pokemon1, pokemon2) {
  console.log(`🔥 BATTLE START: ${pokemon1.name} vs ${pokemon2.name}`);
  
  const fighter1 = {
    ...pokemon1,
    currentHp: pokemon1.currentHp !== undefined ? pokemon1.currentHp : pokemon1.stats.hp,
  };

  const fighter2 = {
    ...pokemon2,
    currentHp: pokemon2.currentHp !== undefined ? pokemon2.currentHp : pokemon2.stats.hp,
  };

  const battleLog = [];
  let round = 0;

  let [attacker, defender] = [fighter1, fighter2];

  console.log(`⚡ First attacker: ${attacker.name} (Speed: ${attacker.stats.speed})`);

  if (fighter1.currentHp <= 0) {
    console.log(`💀 ${fighter1.name} fainted!`);
    return {
      winner: { ...fighter2, remainingHp: fighter2.currentHp },
      loser: { ...fighter1, remainingHp: fighter1.currentHp },
      rounds: 0,
      battleLog: []
    };
  }
  if (fighter2.currentHp <= 0) {
    console.log(`💀 ${fighter2.name} fainted!`);
    return {
      winner: { ...fighter1, remainingHp: fighter1.currentHp },
      loser: { ...fighter2, remainingHp: fighter2.currentHp },
      rounds: 0,
      battleLog: []
    };
  }

  while (fighter1.currentHp > 0 && fighter2.currentHp > 0) {
    round++;

    const damage = calculateDamage(attacker, defender, 1);
    defender.currentHp = Math.max(0, defender.currentHp - damage);

    battleLog.push({ round, attacker: attacker.name, defender: defender.name, damage, defenderHpAfter: defender.currentHp });

    if (defender.currentHp <= 0) {
      console.log(`💀 ${defender.name} fainted!`);
      break;
    }

    [attacker, defender] = [defender, attacker];
  }

  const winner = fighter1.currentHp > 0 ? fighter1 : fighter2;
  const loser = fighter1.currentHp > 0 ? fighter2 : fighter1;

  return {
    winner: {
      id: winner.id,
      name: winner.name,
      remainingHp: winner.currentHp,
    },
    loser: {
      id: loser.id,
      name: loser.name,
    },
    rounds: round,
    battleLog,
  };
}

const simulateBattle = async (req, res) => {
  try {
    const { attacker1, attacker2 } = validate(req.body, battleSimulateSchema);
    const result = simulateBattle(attacker1, attacker2);
    
    const battle = new Battle({
      attacker1: attacker1.name,
      attacker2: attacker2.name,
      winner: result.winner.name,
      userId: req.user.id
    });
    
    await battle.save();
    
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
    if (error.message.includes('Validation error')) {
      return res.status(400).json({ 
        message: 'Invalid input data',
        errors: error.message.split(': ')[1].split(', ')
      });
    }
    res.status(500).json({ message: 'Internal server error' });
  }
};

const listBattles = async (req, res) => {
  res.status(501).json({ message: 'Not implemented' });
};

module.exports = {
  simulateBattle,
  listBattles
};