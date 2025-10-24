const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    // Handle module aliases
    '^@/(.*)$': '<rootDir>/$1',
    '^mongoose$': '<rootDir>/__tests__/mocks/mongoose.js',
    '^mongodb$': '<rootDir>/__tests__/mocks/mongodb.js',
    '^bson$': '<rootDir>/__tests__/mocks/bson.js',
  },
  collectCoverageFrom: [
    'app/**/*.{js,jsx,ts,tsx}',
    'components/**/*.{js,jsx,ts,tsx}',
    'hooks/**/*.{js,jsx,ts,tsx}',
    'lib/**/*.{js,jsx,ts,tsx}',
    'models/**/*.{js,jsx,ts,tsx}',
    'types/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/.next/**',
    '!**/coverage/**',
    '!**/jest.config.js',
  ],
  testMatch: [
    '**/__tests__/**/*.[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)',
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/.next/',
    '/test-e2e.ts',
    '/test-e2e-enhanced.js',
    '/run-tests.js',
    '/test-api.js',
    '/test-ui.js',
    '/test-components-static.js',
    '/__tests__/test-utils.tsx',
    '/__tests__/mocks.tsx',
    '/__tests__/mocks/',
  ],
  coverageThreshold: {
    global: {
      branches: 89,
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },
  moduleDirectories: ['node_modules', '<rootDir>/'],
  transformIgnorePatterns: [
    'node_modules/(?!(framer-motion|lucide-react)/)',
  ],
  coverageReporters: ['text', 'lcov', 'json', 'json-summary'],
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig)
