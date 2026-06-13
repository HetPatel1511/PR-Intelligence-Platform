// Root ESLint flat config (ESLint 9). Shared by every workspace.
// App-specific overrides live in apps/*/eslint.config.js and extend this.
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

export default tseslint.config(
  {
    // Anything generated or vendored is never linted.
    ignores: [
      '**/dist/**',
      '**/build/**',
      '**/node_modules/**',
      '**/coverage/**',
      '**/*.generated.*',
    ],
  },

  // Base JS + TypeScript recommended rules for all source.
  js.configs.recommended,
  ...tseslint.configs.recommended,

  // Backend (Node) source.
  {
    files: ['apps/backend/**/*.{ts,js}'],
    languageOptions: {
      globals: { ...globals.node },
    },
  },

  // Frontend (React + browser) source.
  {
    files: ['apps/frontend/**/*.{ts,tsx}'],
    languageOptions: {
      globals: { ...globals.browser },
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    settings: { react: { version: 'detect' } },
    rules: {
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off', // Not needed with the modern JSX transform.
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },

  // Must come last so Prettier formatting wins over stylistic lint rules.
  prettier,
);
