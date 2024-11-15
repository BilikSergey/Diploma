import globals from "globals";
import pluginJs from "@eslint/js";

/** @type {import('eslint').Linter.Config[]} */
export default [
  { files: ["**/*"] },
  { languageOptions: { globals: globals.browser } },
  pluginJs.configs.recommended,
  {
    rules: {
      "no-undef": "warn",
      "no-case-declarations": "off",
    },
  },
];
