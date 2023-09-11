import { defineConfig } from "vite";

export default defineConfig({
  build: {
    lib: {
      entry: {
        core: "src/index.ts",
        react: "src/react.ts",
      },
    },
  },
  test: {
    // I'm getting `Error: [birpc] timeout on calling "onTaskUpdate"` when
    // running tests in watch mode and letting it wait a little while.
    browser: {
      enabled: true,
      provider: "playwright",
      name: "firefox", // browser name is required
      slowHijackESM: false,
    },
    threads: false,
    cache: false,
  },
});
