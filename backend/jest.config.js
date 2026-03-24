module.exports = {
  projects: [
    {
      displayName: 'unit',
      testEnvironment: 'node',
      rootDir: 'src',
      testRegex: '(?<!integration)\\.spec\\.ts$', // excludes *.integration.spec.ts
      transform: { '^.+\\.(t|j)s$': 'ts-jest' },
      moduleNameMapper: {
        '^@domain/(.*)$': '<rootDir>/domain/$1',
        '^@data/(.*)$': '<rootDir>/data/$1',
        '^@infrastructure/(.*)$': '<rootDir>/infrastructure/$1',
        '^@presentation/(.*)$': '<rootDir>/presentation/$1',
      },
      setupFilesAfterEnv: ['<rootDir>/../jest.setup.ts'],
      coverageDirectory: '../coverage',
      collectCoverageFrom: [
        'src/**/*.ts',
        '!src/**/*.spec.ts',
        '!src/**/*.integration.spec.ts',
        '!src/main.ts',
      ],
    },
    {
      displayName: 'integration',
      testEnvironment: 'node',
      rootDir: 'src',
      testRegex: '\\.integration\\.spec\\.ts$',
      transform: { '^.+\\.(t|j)s$': 'ts-jest' },
      moduleNameMapper: {
        '^@domain/(.*)$': '<rootDir>/domain/$1',
        '^@data/(.*)$': '<rootDir>/data/$1',
        '^@infrastructure/(.*)$': '<rootDir>/infrastructure/$1',
        '^@presentation/(.*)$': '<rootDir>/presentation/$1',
      },
      setupFilesAfterEnv: ['<rootDir>/../jest.setup.ts'],
      coverageDirectory: '../coverage',
    },
    {
      displayName: 'e2e',
      testEnvironment: 'node',
      rootDir: 'src',
      testRegex: '\\.e2e-spec\\.ts$',
      transform: { '^.+\\.(t|j)s$': 'ts-jest' },
      moduleNameMapper: {
        '^@domain/(.*)$': '<rootDir>/domain/$1',
        '^@data/(.*)$': '<rootDir>/data/$1',
        '^@infrastructure/(.*)$': '<rootDir>/infrastructure/$1',
        '^@presentation/(.*)$': '<rootDir>/presentation/$1',
      },
      globals: {
        'ts-jest': {
          tsconfig: {
            testPathIgnorePatterns: [],
          },
        },
      },
      testTimeout: 30000,
    },
  ],
  coverageThreshold: {
    global: { lines: 60 },
  },
};
