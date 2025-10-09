const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  cache: false,
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    // Specific mocks for server/db modules used in API routes
    '^next/server(\\.js)?$': '<rootDir>/__mocks__/next-server.ts',
  '^@/lib/mongodb$': '<rootDir>/__mocks__/lib/mongodb.ts',
  // Also map potential bundler-resolved bare or relative specifiers
  '^lib/mongodb(\\.ts)?$': '<rootDir>/__mocks__/lib/mongodb.ts',
  '(.*/)?lib/mongodb(\\.ts)?$': '<rootDir>/__mocks__/lib/mongodb.ts',
  '^@/models/Chat$': '<rootDir>/__mocks__/models/Chat.ts',
  '^models/Chat(\\.ts)?$': '<rootDir>/__mocks__/models/Chat.ts',
  '(.*/)?models/Chat(\\.ts)?$': '<rootDir>/__mocks__/models/Chat.ts',
  '^@/models/VoiceAgent$': '<rootDir>/__mocks__/models/VoiceAgent.ts',
  '^models/VoiceAgent(\\.ts)?$': '<rootDir>/__mocks__/models/VoiceAgent.ts',
  '(.*/)?models/VoiceAgent(\\.ts)?$': '<rootDir>/__mocks__/models/VoiceAgent.ts',
    // Handle module aliases
    '^@/(.*)$': '<rootDir>/$1',
    '^mongoose$': '<rootDir>/__mocks__/mongoose.js',
  },
  collectCoverageFrom: [
    'app/**/*.{js,jsx,ts,tsx}',
    'components/**/*.{js,jsx,ts,tsx}',
    'hooks/**/*.{js,jsx,ts,tsx}',
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
    '/__tests__/app/',
    '<rootDir>/__tests__/app/',
    '/test-e2e.ts',
    '/test-e2e-enhanced.js',
    '/run-tests.js',
    '/test-api.js',
    '/test-ui.js',
    '/test-components-static.js',
    '/__tests__/test-utils.tsx',
    '/__tests__/mocks.tsx',
  ],
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 65,
      lines: 65,
      statements: 65,
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
