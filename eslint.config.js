import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  // Never lint generated/server/video code
  globalIgnores(['dist', 'supabase/**', 'video/**', 'node_modules/**', 'src/components/ui/**']),
  {
    files: ['src/**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      // Unused vars: ignore _-prefixed intentional ones
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      // any types: widespread pre-existing debt — warn only, don't block CI
      '@typescript-eslint/no-explicit-any': 'warn',
      // Empty interfaces: warn only
      '@typescript-eslint/no-empty-object-type': 'warn',
      // Empty catch blocks: warn only
      'no-empty': 'warn',
      // Fast-refresh: off for re-export patterns (common in utility files)
      'react-refresh/only-export-components': 'warn',
      // prefer-const: error — easy to fix and prevents bugs
      'prefer-const': 'error',
      // React hooks purity: warn — some intentional patterns trigger this
      'react-hooks/exhaustive-deps': 'warn',
      // setState in effect: warn — pre-existing pattern, not a regression risk
      'react-hooks/set-state-in-effect': 'warn',
      // Memoization preservation: warn — compiler hint, not a runtime error
      'react-hooks/preserve-manual-memoization': 'warn',
    },
  },
])
