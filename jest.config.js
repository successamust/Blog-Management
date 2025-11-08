export default {
  testEnvironment: 'node',
  transform: {},
  extensionsToTreatAsEsm: ['.js'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  testMatch: ['**/__tests__/**/*.test.js'],
  collectCoverageFrom: [
    'v1/**/*.js',
    '!v1/**/*.test.js',
    '!v1/config/**',
  ],
  coverageDirectory: 'coverage',
  verbose: true,
};

