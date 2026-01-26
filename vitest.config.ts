import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      enabled: true,
    },
    exclude: ["**/out/**", "**/node_modules/**", "**/.vscode-test/**"],
  },
});
