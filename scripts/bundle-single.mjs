import { readdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const dist = path.join(root, "dist");

try {
  await stat(path.join(dist, "index.html"));
} catch {
  console.error("No existe dist/index.html. Ejecuta primero: npm run build");
  process.exit(1);
}

const entries = await readdir(path.join(dist, "assets"));
const jsName = entries.find((name) => name.endsWith(".js"));
const cssName = entries.find((name) => name.endsWith(".css"));

if (!jsName || !cssName) {
  console.error("No se encontraron los archivos JS/CSS en dist/assets.");
  process.exit(1);
}

let html = await readFile(path.join(dist, "index.html"), "utf8");
const js = (await readFile(path.join(dist, "assets", jsName), "utf8")).replaceAll(
  "</script",
  "<\\/script",
);
const css = await readFile(path.join(dist, "assets", cssName), "utf8");

html = html.replace(
  /<script[^>]*src="\.\/assets\/[^"]+"[^>]*><\/script>/,
  `<script type="module">\n${js}\n</script>`,
);
html = html.replace(
  /<link[^>]*href="\.\/assets\/[^"]+\.css"[^>]*>/,
  `<style>\n${css}\n</style>`,
);

const output = path.join(root, "CyberSlimeArcade.html");
await writeFile(output, html, "utf8");
console.log("Version de un solo archivo creada: CyberSlimeArcade.html");
console.log("Se puede enviar por correo/WhatsApp y abrir con doble clic.");
