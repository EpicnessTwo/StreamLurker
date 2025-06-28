import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import pluginVue from "eslint-plugin-vue";
import { defineConfig } from "eslint/config";


export default defineConfig([
  { files: ["src/**/*.{js,mjs,cjs,ts,mts,cts,vue}"], plugins: { js }, extends: ["js/recommended"] },
  { files: ["src/**/*.{js,mjs,cjs,ts,mts,cts,vue}"], languageOptions: { globals: globals.node } },
  tseslint.configs.recommended,
  pluginVue.configs["flat/essential"],
  { files: ["src/**/*.vue"], languageOptions: { parserOptions: { parser: tseslint.parser } } },
]);
