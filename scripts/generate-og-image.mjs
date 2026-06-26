import { chromium } from "playwright";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

const ROOT = fileURLToPath(new URL(".", import.meta.url));
const REPO = join(ROOT, "..");
const TEMPLATE = join(ROOT, "og-template.html");
const OUT = join(REPO, "assets", "og-image.jpg");

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.goto(`file:///${TEMPLATE.replace(/\\/g, "/")}`, { waitUntil: "networkidle" });
await page.screenshot({ path: OUT, type: "jpeg", quality: 92 });
await browser.close();

console.log(`saved ${OUT}`);
