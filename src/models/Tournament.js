const mongoose = require('mongoose');

const tournamentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  status: { type: String, enum: ['live', 'completed'], default: 'live' },
  maxRounds: { type: Number, required: true, min: 1, max: 20 },
  currentRound: { type: Number, default: 0 },
  tournamentActiveTime: { type: Number, required: true, min: 1, max: 1440 },
  endTime: { type: Date, required: true },
  rounds: [{ type: mongoose.Schema.Types.Mixed }],
  hpState: { type: mongoose.Schema.Types.Mixed, default: {} },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
});

const Tournament = mongoose.model('Tournament', tournamentSchema);

module.exports = Tournament;