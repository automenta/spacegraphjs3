import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";
import prettier from "eslint-config-prettier";

export default [
  // Base configuration for all files
  {
    ignores: ["dist", ".eslintrc.cjs"],
  },
  // Recommended JS and TS configurations
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  prettier,

  // Configuration for ES Modules (.js, .mjs, .ts)
  {
    files: ["**/*.{js,mjs,ts}"],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: "module",
      },
      globals: {
        ...globals.browser,
      },
    },
  },

  // Configuration for CommonJS Modules (.cjs)
  {
    files: ["**/*.cjs"],
    languageOptions: {
      globals: {
        ...globals.node, // Node.js globals for CJS files
      },
      parserOptions: {
        sourceType: "commonjs",
      },
    },
    rules: {
      // Allow require() in CJS files
      "@typescript-eslint/no-require-imports": "off",
      // Turn off no-undef for CJS files as globals.node covers it
      "no-undef": "off",
    },
  },

  // Custom rules (placed last to ensure they override previous configurations)
  {
    rules: {
      // Re-apply no-explicit-any to be off
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
];
