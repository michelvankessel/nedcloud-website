const { createDefaultPreset } = require("ts-jest");

const tsJestTransformCfg = createDefaultPreset().transform;

/** @type {import("jest").Config} **/
module.exports = {
  preset: 'ts-jest',
  testEnvironment: "node",
  moduleFileExtensions: ['ts', 'js'],
  transformIgnorePatterns: ["/node_modules/(?!@types)"],
  globals: {
    "__dirname": "__dirname",
  },
  testMatch: ["**/tests/**/*.test.ts"],
  transform: {
    ...tsJestTransformCfg,
  },
};