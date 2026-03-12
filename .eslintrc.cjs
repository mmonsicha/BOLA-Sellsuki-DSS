module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: ['./tsconfig.app.json'],
    tsconfigRootDir: __dirname,
  },
  plugins: [
    '@typescript-eslint',
    'react-hooks',
    'react-refresh',
  ],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
  ],
  rules: {
    // TypeScript strict rules
    // NOTE: no-explicit-any is 'warn' — upgrade to 'error' once all violations are fixed
    '@typescript-eslint/no-explicit-any': 'warn',
    // NOTE: no-unused-vars is 'warn' — upgrade to 'error' once all violations are fixed
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    '@typescript-eslint/explicit-function-return-type': 'off',
    // NOTE: no-floating-promises is 'warn' — upgrade to 'error' once all violations are fixed
    '@typescript-eslint/no-floating-promises': 'warn',
    // NOTE: no-misused-promises is 'warn' — upgrade to 'error' once all violations are fixed
    '@typescript-eslint/no-misused-promises': 'warn',
    '@typescript-eslint/no-empty-object-type': 'off',

    // React rules
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
    'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],

    // General best practices
    // NOTE: no-empty is 'warn' — upgrade to 'error' once all violations are fixed
    'no-empty': 'warn',
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'no-debugger': 'error',
    'prefer-const': 'error',
    'no-var': 'error',
  },
  ignorePatterns: ['dist', 'node_modules', '*.config.*', 'vite.config.ts'],
};
