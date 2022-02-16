module.exports = {
  parser: "@typescript-eslint/parser",
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:@typescript-eslint/recommended-requiring-type-checking",
    "prettier"
  ],
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: "module",
    tsconfigRootDir: __dirname,
    project: ["./tsconfig.json"],
    extraFileExtensions: [".svelte"],
  },
  env: {
    es6: true,
    browser: true,
  },
  overrides: [
    {
      files: ["*.svelte"],
      processor: "svelte3/svelte3",
    },
  ],
  settings: {
    "svelte3/typescript": require("typescript"),
    "svelte3/ignore-styles": () => true,
  },
  plugins: ["svelte3", "@typescript-eslint", "prettier"],
  ignorePatterns: ["node_modules"],
  rules: {
    indent: ["error", 2, { SwitchCase: 1 }],
    "linebreak-style": ["error", "unix"],
    quotes: ["error", "single"],
    "prefer-const": ["error"],
    semi: ["error", "always"],
    "max-len": [
      "warn",
      {
        code: 80,
      },
    ],
    "prettier/prettier": 2
  },
};