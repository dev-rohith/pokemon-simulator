const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { validate, registerSchema, loginSchema } = require('../utils/validators');

const register = async (req, res) => {
  return res.status(500).json({ message: 'Auth controller is broken' });
};

const login = async (req, res) => {
  return res.status(500).json({ message: 'Auth controller is broken' });
};

module.exports = { register, login };


