module.exports = {
  root: true,
  extends: [
    // https://github.com/facebook/create-react-app/tree/master/packages/eslint-config-react-app
    "react-app",
    // https://eslint.org/docs/rules/
    "eslint:recommended",
    // https://github.com/typescript-eslint/typescript-eslint/tree/master/packages/eslint-plugin/src/configs
    "plugin:@typescript-eslint/eslint-recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:@typescript-eslint/recommended-requiring-type-checking",
    // https://github.com/prettier/eslint-config-prettier
    "prettier/@typescript-eslint",
    // https://github.com/prettier/eslint-plugin-prettier
    "plugin:prettier/recommended",
  ],
  plugins: [
    // https://github.com/prettier/eslint-plugin-prettier
    "prettier",
    // https://github.com/typescript-eslint/typescript-eslint
    "@typescript-eslint",
    // https://github.com/benmosher/eslint-plugin-import
    "import",
  ],
  rules: {
    "prettier/prettier": "error",

    "@typescript-eslint/explicit-function-return-type": "off",
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/no-non-null-assertion": "off",

    "sort-imports": [
      "error",
      {
        ignoreCase: true,
        ignoreDeclarationSort: true, // handled by import/order alphabetize
      },
    ],
    "import/order": [
      "error",
      {
        groups: [
          "builtin",
          "external",
          "internal",
          "parent",
          ["sibling", "index"],
        ],
        pathGroups: [{ pattern: "~/**", group: "internal" }],
        "newlines-between": "always",
        alphabetize: {
          order: "asc",
          caseInsensitive: true,
        },
      },
    ],
  },
  parser: "@typescript-eslint/parser",
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: ["./tsconfig.json"],
  },
}
