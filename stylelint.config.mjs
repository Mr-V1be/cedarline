/**
 * Styles use design tokens only: colour literals are allowed in the token sheet and nowhere
 * else, so a component can never drift from the palette or break the dark theme.
 */
export default {
  extends: ['stylelint-config-standard'],
  ignoreFiles: ['**/node_modules/**', '**/.next/**', 'apps/web/src/app/(payload)/**'],
  rules: {
    'color-no-hex': true,
    'color-named': 'never',
    'function-disallowed-list': [
      'rgb',
      'rgba',
      'hsl',
      'hsla',
      'hwb',
      'lab',
      'lch',
      'oklab',
      'oklch',
    ],
    'selector-class-pattern': [
      '^[a-z][a-zA-Z0-9]*$',
      { message: 'CSS module classes are camelCase' },
    ],
    'custom-property-pattern': null,
    'keyframes-name-pattern': null,
    'selector-pseudo-class-no-unknown': [true, { ignorePseudoClasses: ['global'] }],
  },
  overrides: [
    {
      files: ['apps/web/src/ui/tokens/tokens.css'],
      rules: { 'color-no-hex': null, 'function-disallowed-list': null },
    },
    {
      files: ['apps/web/src/ui/tokens/base.css'],
      rules: { 'selector-class-pattern': null },
    },
  ],
}
