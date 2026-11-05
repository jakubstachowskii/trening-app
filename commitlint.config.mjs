/** @type {import('@commitlint/types').UserConfig} */
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Opisy commitów po polsku — bez wymuszania wielkości liter
    'subject-case': [0],
  },
};
