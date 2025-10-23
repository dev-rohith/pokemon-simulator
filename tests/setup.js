require('dotenv').config();
const mongoose = require('mongoose');
const { connectDatabase } = require('../src/config/database');
const cache = require('../src/utils/cache');
let mem;


beforeAll(async () => {
  try {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    mem = await MongoMemoryServer.create({
      instance: {
        port: 27018,
      },
      binary: {
        version: '4.4.0', 
      }
    });
    process.env.MONGODB_URI = mem.getUri();
    process.env.DATABASE_URL = mem.getUri();
    await connectDatabase();
  } catch (error) {
    console.error('Test database connection failed:', error);
    process.env.MONGODB_URI = 'mongodb://localhost:27017/pokemon-battle-simulator-test';
    await connectDatabase();
  }
}, 60000); 

beforeEach(() => {
  cache.clear();
});

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
