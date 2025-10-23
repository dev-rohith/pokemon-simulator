const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { validate, registerSchema, loginSchema } = require('../utils/validators');

const register = async (req, res) => {
  try {
    const { username, password } = validate(req.body, registerSchema);

    const existing = await User.findOne({ username });
    if (existing) {
      return res.status(409).json({ message: 'Username already exists' });
    }

    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10);
    const hashed = await bcrypt.hash(password, saltRounds);
    const user = await User.create({ username, password: hashed });

    return res.status(201).json({ user: { id: user._id, username: user.username, createdAt: user.createdAt } });
  } catch (error) {
    if (error.isJoi) {
      return res.status(400).json({ message: 'Invalid registration data' });
    }
    return res.status(500).json({ message: 'Registration failed' });
  }
};

const login = async (req, res) => {
  try {
    const { username, password } = validate(req.body, loginSchema);
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const payload = { userId: user._id.toString(), username: user.username };
    const token = jwt.sign(payload, process.env.JWT_SECRET || 'test-secret', { expiresIn: '1h' });
    return res.json({ token, user: { id: user._id, username: user.username } });
  } catch (error) {
    if (error.isJoi) {
      return res.status(400).json({ message: 'Invalid login data' });
    }
    return res.status(500).json({ message: 'Login failed' });
  }
};

module.exports = { register, login };


