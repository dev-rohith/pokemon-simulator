const mongoose = require('mongoose');

async function connectDatabase() {
  try {
    await mongoose.connect(process.env.DATABASE_URL);
    console.log('Database connected');
    return mongoose;
  } catch (error) {
    console.error('Database connection failed:', error.message);
    throw error;
  }
}

module.exports = {
  connectDatabase
};
