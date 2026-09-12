// @ts-check
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';

// TypeScript files that belong to one of the two tsconfig "projects" (see
// tsconfig.json's references): app source + its unit tests, and the
// Node-side tooling configs + e2e tests. Both are covered by
// projectService, which walks the project graph from tsconfigRootDir.
const typedProjectFiles = [
  'src/**/*.ts',
  'tests/unit/**/*.ts',
  'tests/e2e/**/*.ts',
  // The tour was linted by nothing: not in this list, so `npx eslint .` said
  // "File ignored because no matching configuration was supplied" and moved
  // on. It is four files that drive the whole app and write the report.
  'tests/tour/**/*.ts',
  // Same reason: the state gallery drives the whole score screen.
  'tests/states/**/*.ts',
  '*.config.ts',
];

const nodeGlobals = {
  process: 'readonly',
  console: 'readonly',
  Buffer: 'readonly',
  __dirname: 'readonly',
  __filename: 'readonly',
  module: 'readonly',
  // Web APIs that modern Node also implements, and that the build scripts use.
  URL: 'readonly',
  fetch: 'readonly',
  require: 'readonly',
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
      // `ignoreRestSiblings` and the `_` prefix are for one idiom: dropping a
      // key by destructuring it out. `const { scores: _dropped, ...rest } = row`
      // is how a row is stored without its heaviest field, and `const { folder:
      // _folder, ...score } = row` is how the stored extras come back off it.
      // Both say what they mean far better than building a new object key by
      // key, and without these two options the rule reports the deliberate name
      // as dead code.
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', ignoreRestSiblings: true },
      ],
    },
  },
  {
    // Small standalone Node scripts (not part of either tsconfig project):
    // plain JS linting with Node globals, no type-aware rules needed.
    files: ['eslint.config.js', 'scripts/**/*.mjs'],
    languageOptions: { sourceType: 'module', globals: nodeGlobals },
  },
  {
    // Service-worker source shipped as-is from public/ (the share target).
    // It runs inside the generated Workbox worker, so its globals are the
    // worker's, not the window's or Node's.
    files: ['public/*.js'],
    languageOptions: {
      sourceType: 'script',
      globals: {
        self: 'readonly',
        caches: 'readonly',
        URL: 'readonly',
        Request: 'readonly',
        Response: 'readonly',
        fetch: 'readonly',
      },
    },
  },
  prettier,
);
