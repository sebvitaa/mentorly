/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-preset-angular',
  setupFilesAfterEnv: ['<rootDir>/setup-jest.ts'],
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.(ts|js|mjs|html|svg)$': [
      'jest-preset-angular',
      {
        tsconfig: '<rootDir>/tsconfig.spec.json',
        stringifyContentPathRegex: '\\.(html|svg)$',
      },
    ],
  },
  // Los *.int.spec.ts pegan a Supabase real; corren aparte (npm run test:int).
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/dist/',
    '\\.int\\.spec\\.ts$',
  ],
  moduleFileExtensions: ['ts', 'html', 'js', 'json', 'mjs'],
  // Ionic/Supabase ship ESM; let ts-jest transform them instead of skipping.
  transformIgnorePatterns: ['node_modules/(?!(.*\\.mjs$|@ionic|@stencil|ionicons|@supabase))'],
  collectCoverageFrom: [
    'src/app/**/*.ts',
    '!src/app/**/*.spec.ts',
    '!src/**/*.d.ts',
  ],
};
