// @ts-check
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';

// TypeScript files that belong to one of the two tsconfig "projects" (see
// tsconfig.json's references): app source + its unit tests, and the
// Node-side tooling configs + e2e tests. Both are covered by
// projectService, which walks the project graph from tsconfigRootDir.
const typedProjectFiles = ['src/**/*.ts', 'tests/unit/**/*.ts', 'tests/e2e/**/*.ts', '*.config.ts'];

const nodeGlobals = {
  process: 'readonly',
  console: 'readonly',
  Buffer: 'readonly',
  __dirname: 'readonly',
  __filename: 'readonly',
  module: 'readonly',
};

export default tseslint.config(
  {
    ignores: [
      'dist/**',
      'dev-dist/**',
      'node_modules/**',
      'public/content/**',
      'public/icons/**',
      'playwright-report/**',
      'test-results/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked.map((config) => ({
    ...config,
    files: typedProjectFiles,
  })),
  {
    files: typedProjectFiles,
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  {
    // Small standalone Node scripts (not part of either tsconfig project):
    // plain JS linting with Node globals, no type-aware rules needed.
    files: ['eslint.config.js', 'scripts/**/*.mjs'],
    languageOptions: { sourceType: 'module', globals: nodeGlobals },
  },
  prettier,
);
