import { cp, rm, stat } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const dist = path.join(root, "dist");

try {
  await stat(path.join(dist, "index.html"));
} catch {
  console.error("No existe dist/index.html. Ejecuta primero: npm run build");
  process.exit(1);
}

await cp(path.join(dist, "index.html"), path.join(root, "index.html"));
await rm(path.join(root, "assets"), { recursive: true, force: true });
await cp(path.join(dist, "assets"), path.join(root, "assets"), {
  recursive: true,
});

console.log("Build publicado en la raiz del proyecto.");
console.log("Laragon: http://juego.test/");
console.log("Servidor local: npm run serve");
