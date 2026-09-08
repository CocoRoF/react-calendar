import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import dts from "vite-plugin-dts";

export default defineConfig({
  plugins: [react(), dts({ include: ["src"], exclude: ["src/**/*.test.tsx", "src/test-setup.ts"], rollupTypes: true })],
  build: {
    lib: { entry: "src/index.ts", formats: ["es", "cjs"], fileName: (f) => (f === "es" ? "index.js" : "index.cjs") },
    rollupOptions: {
      external: ["react", "react-dom", "react/jsx-runtime"],
      output: { assetFileNames: "styles.css" },
    },
    sourcemap: true,
    cssCodeSplit: false,
  },
  test: { environment: "jsdom", globals: true, setupFiles: ["./src/test-setup.ts"] },
});
