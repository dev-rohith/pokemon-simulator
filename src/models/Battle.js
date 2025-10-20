const mongoose = require('mongoose');

const battleSchema = new mongoose.Schema({
  tournamentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tournament',
    required: true,
    index: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  battleNumber: {
    type: Number,
    required: true,
  },
  attacker1Id: { type: Number, required: true },
  attacker1Name: { type: String, required: true },
  attacker2Id: { type: Number, required: true },
  attacker2Name: { type: String, required: true },
  winnerName: { type: String, required: true },
  winnerRemainingHp: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
});

const Battle = mongoose.model('Battle', battleSchema);

module.exports = Battle;
