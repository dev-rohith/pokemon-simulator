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

module.exports = {
  calculateDamage,
  simulateBattle,
};
