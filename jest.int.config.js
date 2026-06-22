/**
 * Configuración de Jest para tests de INTEGRACIÓN (APIs reales de Supabase).
 *
 * Se separa de `jest.config.js` (unitarios) porque:
 *  - corre en entorno `node` (necesita `fetch` real; jsdom no lo trae),
 *  - pega a la red, así que no debe correr en el `npm test` offline/CI,
 *  - usa timeouts más largos.
 *
 * Ejecutar con:  npm run test:int
 *
 * @type {import('jest').Config}
 */
module.exports = {
  preset: 'jest-preset-angular',
  testEnvironment: 'node',
  testMatch: ['**/*.int.spec.ts'],
  transform: {
    '^.+\\.(ts|js|mjs|html|svg)$': [
      'jest-preset-angular',
      {
        tsconfig: '<rootDir>/tsconfig.spec.json',
        stringifyContentPathRegex: '\\.(html|svg)$',
      },
    ],
  },
  testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/dist/'],
  moduleFileExtensions: ['ts', 'html', 'js', 'json', 'mjs'],
  transformIgnorePatterns: [
    'node_modules/(?!(.*\\.mjs$|@ionic|@stencil|ionicons|@supabase))',
  ],
  // Las llamadas de red pueden tardar; damos margen.
  testTimeout: 30000,
};
