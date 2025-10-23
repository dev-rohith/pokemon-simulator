const User = require('../models/User');
const jwt = require('jsonwebtoken');

async function authenticate(req, res, next) {
  try {
    const authHeader = req.header('Authorization') || req.header('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const token = authHeader.slice('Bearer '.length);
    try {
      const secret = process.env.JWT_SECRET || 'test-secret';
      const decoded = jwt.verify(token, secret);
      
      // Find user by ID from token
      const user = await User.findById(decoded.userId).select('-password');
      if (!user) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      
      // Set user in request object
      req.user = user;
      return next();
    } catch (err) {
      return res.status(401).json({ message: 'Authentication required' });
    }
  } catch (e) {
    return res.status(401).json({ message: 'Authentication required' });
  }
}

module.exports = { authenticate };
