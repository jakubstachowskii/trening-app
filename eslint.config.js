// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const eslintPluginPrettierRecommended = require('eslint-plugin-prettier/recommended');

// Zero magicznych wartości: kolory tylko z design/tokens.json przez src/theme (docs/DESIGN.md).
const noColorLiterals = {
  selector: 'Literal[value=/^(#[0-9a-fA-F]{3,8}$|rgba?[(]|hsla?[(])/]',
  message: 'Kolor tylko z tokenów (useTheme), nie jako literał.',
};

module.exports = defineConfig([
  expoConfig,
  eslintPluginPrettierRecommended,
  {
    ignores: ['dist/*', '.expo/*', 'expo-env.d.ts', 'design/f1/*', 'design/f2/*'],
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/**/*.test.{ts,tsx}'],
    rules: {
      'no-restricted-syntax': ['error', noColorLiterals],
    },
  },
]);
