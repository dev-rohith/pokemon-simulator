const mongoose = require('mongoose');

const tournamentSchema = new mongoose.Schema({});

const Tournament = mongoose.model('Tournament', tournamentSchema);

module.exports = Tournament;


