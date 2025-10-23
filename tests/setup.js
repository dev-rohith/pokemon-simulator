require('dotenv').config();
const mongoose = require('mongoose');
const { connectDatabase } = require('../src/config/database');
const cache = require('../src/utils/cache');
let mem;

// Use real PokeAPI for integration testing
// No mocking - let's test the real API calls

// Global test setup
beforeAll(async () => {
  try {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    mem = await MongoMemoryServer.create({
      instance: {
        port: 27018, // Use a different port to avoid conflicts
      },
      binary: {
        version: '4.4.0', // Use a specific version
      }
    });
    process.env.MONGODB_URI = mem.getUri();
    process.env.DATABASE_URL = mem.getUri();
    await connectDatabase();
  } catch (error) {
    console.error('Test database connection failed:', error);
    // Fallback to local MongoDB if memory server fails
    process.env.MONGODB_URI = 'mongodb://localhost:27017/pokemon-battle-simulator-test';
    await connectDatabase();
  }
}, 60000); // Increase timeout to 60 seconds

// Clear cache before each test
beforeEach(() => {
  cache.clear();
});

// Global test teardown
afterAll(async () => {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    if (mem) {
      await mem.stop();
    }
  } catch (error) {
    console.error('Test database disconnection failed:', error);
  }
}, 30000);
