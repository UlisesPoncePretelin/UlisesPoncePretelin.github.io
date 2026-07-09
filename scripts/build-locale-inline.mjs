import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const es = await readFile(join(root, "locales", "es.json"), "utf8");
const out = `window.__LOCALE_ES__=${es};\n`;
await writeFile(join(root, "locales", "es.inline.js"), out, "utf8");
console.log(`es.inline.js → ${(out.length / 1024).toFixed(1)} KB`);
