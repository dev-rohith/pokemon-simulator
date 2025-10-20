// Removed errorHandler - using basic try-catch
const { validate, addBattleToTournamentSchema } = require('../utils/validators');
const Tournament = require('../models/Tournament');
const Battle = require('../models/Battle');
const { simulateBattle } = require('../services/battle.service');
const { fetchPokemonDetails } = require('../services/pokeapi.service');
const mongoose = require('mongoose');

// Add Battle to Tournament - POST /tournaments/:tournamentId/battle
const addBattleToTournament = async (req, res) => {
  try {
    const { tournamentId } = req.params;
    const { attacker, defender } = validate(req.body, addBattleToTournamentSchema);

    const tournament = await Tournament.findById(tournamentId);
    if (!tournament) {
      return res.status(404).json({ message: 'Tournament not found' });
    }

    // Check if tournament has passed its end time and auto-complete it
    if (Date.now() > tournament.endTime && tournament.status === 'live') {
      tournament.status = 'completed';
      await tournament.save();
    }

    // Check if tournament has reached max rounds and auto-complete it
    if (tournament.rounds.length >= tournament.maxRounds && tournament.status === 'live') {
      tournament.status = 'completed';
      await tournament.save();
    }

    if (tournament.status !== 'live') {
      // Provide more specific error message based on completion reason
      if (Date.now() > tournament.endTime) {
        return res.status(400).json({ message: 'Tournament has ended' });
      } else if (tournament.rounds.length >= tournament.maxRounds) {
        return res.status(400).json({ message: 'Tournament round limit reached' });
      } else {
        return res.status(400).json({ message: 'Tournament is not live' });
      }
    }

    // Check if both Pokemon are the same
    if (attacker === defender) {
      return res.status(400).json({ message: 'Cannot battle the same Pokemon' });
    }

    // Fetch Pokemon details
    const [pokemon1, pokemon2] = await Promise.all([
      fetchPokemonDetails(attacker),
      fetchPokemonDetails(defender),
    ]);

    // Get current HP from tournament state or use full HP if first time
    const getCurrentHp = (pokemon) => {
      const pokemonKey = `${pokemon.id}-${pokemon.name}`;
      const currentHp = tournament.hpState[pokemonKey] !== undefined ? tournament.hpState[pokemonKey] : pokemon.stats.hp;
      return currentHp;
    };

    // Set current HP for battle
    const currentHp1 = getCurrentHp(pokemon1);
    const currentHp2 = getCurrentHp(pokemon2);
    
    // Create Pokemon objects with current HP for battle
    const battlePokemon1 = { ...pokemon1, currentHp: currentHp1 };
    const battlePokemon2 = { ...pokemon2, currentHp: currentHp2 };

    // Simulate battle
    const battleResult = simulateBattle(battlePokemon1, battlePokemon2);

    // Create battle record
    const battle = await Battle.create({
      tournamentId: tournament._id,
      userId: new mongoose.Types.ObjectId(), // Generate a valid ObjectId for authenticated user
      battleNumber: tournament.rounds.length + 1,
      attacker1Id: pokemon1.id,
      attacker1Name: pokemon1.name,
      attacker2Id: pokemon2.id,
      attacker2Name: pokemon2.name,
      winnerName: battleResult.winner.name,
      winnerRemainingHp: battleResult.winner.remainingHp,
    });

    // Update HP state for both Pokemon after battle
    const updateHpState = (pokemon, finalHp) => {
      const pokemonKey = `${pokemon.id}-${pokemon.name}`;
      tournament.hpState[pokemonKey] = finalHp;
    };

    // Update HP state for both Pokemon
    updateHpState(pokemon1, battleResult.winner.id === pokemon1.id ? battleResult.winner.remainingHp : 0);
    updateHpState(pokemon2, battleResult.winner.id === pokemon2.id ? battleResult.winner.remainingHp : 0);

    // Add battle to tournament
    tournament.rounds.push(battle._id);

    // Save tournament to persist HP state
    await tournament.save();

    // Check if tournament has reached max rounds
    if (tournament.rounds.length >= tournament.maxRounds) {
      tournament.status = 'completed';
    }

    await tournament.save();

    res.status(201).json({
      battle: {
        id: battle._id,
        tournamentId: battle.tournamentId,
        battleNumber: battle.battleNumber,
        attacker1Id: battle.attacker1Id,
        attacker1Name: battle.attacker1Name,
        attacker2Id: battle.attacker2Id,
        attacker2Name: battle.attacker2Name,
        winnerName: battle.winnerName,
        winnerRemainingHp: battle.winnerRemainingHp,
        createdAt: battle.createdAt,
      },
    });
  } catch (error) {
    console.error('Add battle error:', error);
    if (error.isJoi) {
      return res.status(400).json({ message: 'Invalid battle data' });
    }
    res.status(500).json({ message: 'Failed to add battle to tournament' });
  }
};

module.exports = {
  addBattleToTournament,
};