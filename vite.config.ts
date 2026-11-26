import { defineConfig } from "vite";

export default defineConfig({
  root: "src",
  base: "./",
  publicDir: false,
  server: {
    port: 5174,
    host: "localhost",
  },
  build: {
    outDir: "../dist",
    emptyOutDir: true,
    target: "es2022",
  },
});
