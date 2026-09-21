import next from "eslint-config-next/core-web-vitals";

// Next.js 16 removed `next lint`; linting now runs through the ESLint CLI.
// eslint-config-next 16 ships a native ESLint flat-config array, so we spread
// it directly (no FlatCompat needed).
const eslintConfig = [
  { ignores: [".next/**", "node_modules/**", "next-env.d.ts"] },
  ...next,
  {
    rules: {
      "@next/next/no-img-element": "off",
    },
  },
];

export default eslintConfig;
