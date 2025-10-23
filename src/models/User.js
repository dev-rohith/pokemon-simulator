const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true, index: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

userSchema.virtual('battles', {
  ref: 'Battle',
  localField: '_id',
  foreignField: 'userId',
});

const User = mongoose.model('User', userSchema);

module.exports = User;
