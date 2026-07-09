import { mkdir, writeFile } from "node:fs/promises";
import { join, basename } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const fontsDir = join(root, "assets", "fonts");
await mkdir(fontsDir, { recursive: true });

const cssUrl =
  "https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;500&family=Syne:wght@400;500;600;700;800&display=swap";

const css = await fetch(cssUrl, {
  headers: {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  },
}).then((r) => r.text());

const faces = [];
const seen = new Set();
const blocks = css.split("@font-face").slice(1);

for (const block of blocks) {
  const family = block.match(/font-family:\s*'([^']+)'/)?.[1];
  const weight = block.match(/font-weight:\s*(\d+)/)?.[1] || "400";
  const style = block.match(/font-style:\s*(\w+)/)?.[1] || "normal";
  const url = block.match(/url\((https:\/\/[^)]+)\)/)?.[1];
  if (!family || !url) continue;

  const slug = family.toLowerCase().replace(/\s+/g, "-");
  const filename = `${slug}-${style}-${weight}.woff2`;
  const key = `${family}|${weight}|${style}`;
  if (seen.has(key)) continue;
  seen.add(key);
  const filePath = join(fontsDir, filename);

  const buf = await fetch(url).then((r) => r.arrayBuffer());
  await writeFile(filePath, Buffer.from(buf));

  faces.push({ family, weight, style, file: `assets/fonts/${filename}` });
  console.log(`saved ${filename}`);
}

const cssOut = faces
  .map(
    ({ family, weight, style, file }) => `@font-face {
  font-family: '${family}';
  src: url('${file}') format('woff2');
  font-weight: ${weight};
  font-style: ${style};
  font-display: swap;
}`
  )
  .join("\n\n");

await writeFile(join(root, "assets", "fonts.css"), `${cssOut}\n`, "utf8");
console.log(`fonts.css → ${faces.length} faces`);
