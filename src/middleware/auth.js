const User = require('../models/User');
const jwt = require('jsonwebtoken');

async function authenticate(req, res, next) {
  try {
    req.user = { id: 'placeholder' };
    next();
  } catch (error) {
    res.status(401).json({ message: 'Authentication required' });
  }
}

module.exports = { authenticate };