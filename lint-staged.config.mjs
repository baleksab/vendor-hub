export default {
  "*.{ts,tsx,js,jsx,mjs,cjs}": ["oxfmt", "oxlint --type-aware --fix"],
  "*.{json,md,css,html,yml,yaml}": "oxfmt",
  // tsc cannot check single files, so the whole project is checked once.
  "*.{ts,tsx}": () => "pnpm typecheck",
};
