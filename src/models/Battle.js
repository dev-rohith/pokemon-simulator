const mongoose = require('mongoose');

const battleSchema = new mongoose.Schema({
  attacker1: { type: String, required: true },
  attacker2: { type: String, required: true },
  winner: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now }
});

const Battle = mongoose.model('Battle', battleSchema);

module.exports = Battle;