import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        environment: "node",
        fileParallelism: false,
        hookTimeout: 300_000,
        setupFiles: ["./tests/setup.ts"],
    },
});
