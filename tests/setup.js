require('dotenv').config();
const { mongoose } = require('../src/config/database');
const { connectDatabase } = require('../src/config/database');
const cache = require('../src/utils/cache');
let mem;

// Mock axios for PokeAPI calls
jest.mock('axios', () => ({
  get: jest.fn()
}));

// Global test setup
beforeAll(async () => {
  try {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    mem = await MongoMemoryServer.create();
    process.env.DATABASE_URL = mem.getUri();
    await connectDatabase();
  } catch (error) {
    console.error('Test database connection failed:', error);
    throw error;
  }
});

// Clear cache before each test
beforeEach(() => {
  cache.clear();
});

// Global test teardown
afterAll(async () => {
  try {
    await mongoose.disconnect();
    if (mem) await mem.stop();
  } catch (error) {
    console.error('Test database disconnection failed:', error);
  }
});
