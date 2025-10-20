module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/server.js',
    '!src/config/*.js',
    '!src/services/pokeapi.service.js',
  ],
  testMatch: [
    '**/tests/**/*.test.js',
    '**/tests/**/*.spec.js',
  ],
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 70,
      lines: 80,
      statements: 80,
    },
  },
  testTimeout: 30000,
  verbose: true,
};
