import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const COLOR_MESSAGE = "Hardcoded colors are not allowed. Use theme tokens (src/theme/colors.ts) or palette keys like 'primary.main'.";
const HEX = "(^|[\\s(:,'\"])#([0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\\b";
const FN = "\\b(rgba?|hsla?)\\(";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // Centralized design system: colors live only in src/theme.
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/theme/**", "src/app/global-error.tsx"],
    rules: {
      "no-restricted-syntax": [
        "error",
        { selector: `Literal[value=/${HEX}/]`, message: COLOR_MESSAGE },
        { selector: `Literal[value=/${FN}/]`, message: COLOR_MESSAGE },
        { selector: `TemplateElement[value.raw=/${HEX}/]`, message: COLOR_MESSAGE },
        { selector: `TemplateElement[value.raw=/${FN}/]`, message: COLOR_MESSAGE },
      ],
    },
  },
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
]);

export default eslintConfig;
