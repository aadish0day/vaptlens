import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

// Classic JSX runtime keeps React.createElement semantics identical to the original build.
export default defineConfig({
  base: "./",
  plugins: [react({ jsxRuntime: "classic" })],
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  server: {
    host: "0.0.0.0",
    port: 5173,
    allowedHosts: true,
    proxy: { "/api": process.env.SYNC_URL || "http://localhost:8787" },
  },
  build: {
    target: "es2019",
    sourcemap: true,
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      /* "/" is the landing page (src/landing/); the app is its own page at /app/ */
      input: {
        main: fileURLToPath(new URL("./index.html", import.meta.url)),
        app: fileURLToPath(new URL("./app/index.html", import.meta.url)),
      },
      output: {
        manualChunks: {
          react: ["react", "react-dom", "react-grid-layout"],
          export: ["jspdf", "html2canvas"],
          csv: ["papaparse"],
        },
      },
    },
  },
});
