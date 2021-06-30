const { pathsToModuleNameMapper } = require('ts-jest/utils');
const { compilerOptions } = require('./tsconfig');
const { defaults } = require('jest-config');

module.exports = {
  globals: {
    'ts-jest': {
      diagnostics: {
        ignoreCodes: [ 'TS151001' ],
      },
    },
  },
  modulePathIgnorePatterns: [ `<rootDir>/dist/.*` ],
  transformIgnorePatterns: [
    ...defaults.transformIgnorePatterns,
    `<rootDir>/dist/.*`,
  ],
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, { prefix: '<rootDir>/' }),
};
