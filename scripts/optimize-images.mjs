import sharp from "sharp";
import { readdir, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(fileURLToPath(new URL(".", import.meta.url)), "..");

const targets = [
  { input: join(root, "assets", "portrait.jpg"), quality: 82 },
  ...(
    await readdir(join(root, "assets", "demo"))
  )
    .filter((name) => name.endsWith(".png"))
    .map((name) => ({ input: join(root, "assets", "demo", name), quality: 78 })),
];

for (const { input, quality } of targets) {
  const output = input.replace(/\.(png|jpg|jpeg)$/i, ".webp");
  const meta = await sharp(input)
    .webp({ quality, effort: 4 })
    .toFile(output);
  const before = (await sharp(input).metadata()).size || 0;
  console.log(`${input.replace(root + "\\", "")} → ${(before / 1024).toFixed(0)}KB → ${(meta.size / 1024).toFixed(0)}KB`);
}
