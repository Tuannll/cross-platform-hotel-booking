/** @type {import('jest').Config} */
module.exports = {
  moduleNameMapper: {
    '^src/(.*)$': '<rootDir>/src/$1',
  },
  preset: 'ts-jest',
  rootDir: '../..',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/test/e2e/**/*.spec.ts'],
};
