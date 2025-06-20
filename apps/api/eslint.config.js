import ts from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";

export default [
  {
    files: ["**/*.ts"],
    languageOptions: {
      parser: ts
    },
    plugins: {
      "@typescript-eslint": tsPlugin
    },
    rules: {
      "semi": ["error", "always"],
      "no-unused-vars": "warn",
      "@typescript-eslint/no-explicit-any": "warn"
    }
  }
];
