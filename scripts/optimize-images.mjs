import sharp from "sharp";
import { readdir } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(fileURLToPath(new URL(".", import.meta.url)), "..");

const targets = [
  { input: join(root, "assets", "portrait.jpg"), quality: 82, avifQuality: 55 },
  ...(await readdir(join(root, "assets", "demo")))
    .filter((name) => name.endsWith(".png"))
    .map((name) => ({
      input: join(root, "assets", "demo", name),
      quality: 78,
      avifQuality: 52,
    })),
];

for (const { input, quality, avifQuality } of targets) {
  const webpOut = input.replace(/\.(png|jpg|jpeg)$/i, ".webp");
  const avifOut = input.replace(/\.(png|jpg|jpeg)$/i, ".avif");
  const beforeMeta = await sharp(input).metadata();
  const before = beforeMeta.size || 0;

  const webp = await sharp(input).webp({ quality, effort: 4 }).toFile(webpOut);
  const avif = await sharp(input).avif({ quality: avifQuality, effort: 4 }).toFile(avifOut);

  const label = input.replace(root + "\\", "").replace(root + "/", "");
  console.log(
    `${label} → src ${(before / 1024).toFixed(0)}KB · webp ${(webp.size / 1024).toFixed(0)}KB · avif ${(avif.size / 1024).toFixed(0)}KB`
  );
}
