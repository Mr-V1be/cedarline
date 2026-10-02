import js from '@eslint/js'
import eslintReact from '@eslint-react/eslint-plugin'
import nextPlugin from '@next/eslint-plugin-next'
import prettier from 'eslint-config-prettier'
import importX from 'eslint-plugin-import-x'
import jsxA11y from 'eslint-plugin-jsx-a11y-x'
import reactHooks from 'eslint-plugin-react-hooks'
import globals from 'globals'
import tseslint from 'typescript-eslint'

const WEB = 'apps/web/src'
const MODULES = `${WEB}/modules`

/** Framework and persistence packages that pure layers must never import. */
const FRAMEWORKS = [
  'react',
  'react-dom',
  'next',
  'next/*',
  'payload',
  '@payloadcms/*',
  'three',
  '@react-three/*',
]

export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/.next/**',
      '**/next-env.d.ts',
      `${WEB}/cms/generated/**`,
      `${WEB}/migrations/**`,
      `${WEB}/app/(payload)/**`,
      // Vendored Basis Universal transcoder, copied verbatim from the three package.
      `apps/web/public/scene/basis/**`,
      'docs/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: { allowDefaultProject: ['vitest.config.ts'] },
        tsconfigRootDir: import.meta.dirname,
      },
      globals: { ...globals.node },
    },
    plugins: { 'import-x': importX },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true }],
      '@typescript-eslint/consistent-type-imports': ['error', { fixStyle: 'inline-type-imports' }],
      'import-x/no-cycle': 'error',
      'import-x/no-duplicates': 'error',
      'no-console': ['error', { allow: ['error', 'warn'] }],
    },
    settings: {
      'import-x/resolver': {
        typescript: {
          project: ['apps/*/tsconfig.json', 'packages/*/tsconfig.json'],
          noWarnOnMultipleProjects: true,
        },
      },
    },
  },
  {
    files: ['**/*.{js,mjs,cjs}'],
    ...tseslint.configs.disableTypeChecked,
  },
  {
    files: [`${WEB}/**/*.tsx`],
    ...eslintReact.configs['recommended-typescript'],
  },
  {
    files: [`${WEB}/**/*.{ts,tsx}`],
    plugins: { 'react-hooks': reactHooks, '@next/next': nextPlugin, 'jsx-a11y-x': jsxA11y },
    languageOptions: { globals: { ...globals.browser } },
    rules: {
      ...reactHooks.configs.recommended.rules,
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs['core-web-vitals'].rules,
      ...jsxA11y.configs.recommended.rules,
      // Scrollable regions must be keyboard-reachable (WCAG 2.1.1), so a region may take focus.
      'jsx-a11y-x/no-noninteractive-tabindex': [
        'error',
        { tags: [], roles: ['tabpanel', 'region'] },
      ],
    },
    settings: { next: { rootDir: 'apps/web' } },
  },
  // Domain packages are framework-free: they compute, they do not render or persist.
  {
    files: ['packages/*/src/**/*.ts'],
    rules: { 'no-restricted-imports': ['error', { patterns: FRAMEWORKS }] },
  },
  // Layer boundaries inside the web app: dependencies point inwards.
  {
    files: [
      `${MODULES}/*/domain/**/*.ts`,
      `${MODULES}/*/application/**/*.ts`,
      `${MODULES}/*/ports/**/*.ts`,
    ],
    rules: { 'no-restricted-imports': ['error', { patterns: FRAMEWORKS }] },
  },
  {
    files: [`${WEB}/**/*.{ts,tsx}`],
    rules: {
      'import-x/no-restricted-paths': [
        'error',
        {
          zones: [
            {
              target: `./${MODULES}/*/domain`,
              from: [
                `./${MODULES}/*/application`,
                `./${MODULES}/*/infrastructure`,
                `./${MODULES}/*/ui`,
                `./${WEB}/cms`,
                `./${WEB}/app`,
                `./${WEB}/composition`,
              ],
            },
            {
              target: `./${MODULES}/*/application`,
              from: [
                `./${MODULES}/*/infrastructure`,
                `./${MODULES}/*/ui`,
                `./${WEB}/cms`,
                `./${WEB}/app`,
                `./${WEB}/composition`,
              ],
            },
            {
              target: `./${MODULES}/*/ui`,
              from: [`./${MODULES}/*/infrastructure`, `./${WEB}/cms`, `./${WEB}/composition`],
            },
            {
              target: `./${WEB}/ui`,
              from: [`./${MODULES}`, `./${WEB}/cms`, `./${WEB}/composition`],
            },
          ],
        },
      ],
    },
  },
  // Command-line tools report to the terminal.
  {
    files: ['tools/**/*.mjs', 'apps/web/scripts/**/*.ts', 'apps/web/src/seed/**/*.ts'],
    rules: { 'no-console': 'off' },
  },
  {
    files: ['**/*.test.ts', '**/test/**/*.ts'],
    rules: { '@typescript-eslint/no-non-null-assertion': 'off' },
  },
  prettier,
)
