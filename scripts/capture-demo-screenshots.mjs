import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const BASE = "http://localhost:3002";
const OUT = path.resolve("assets/demo");
const EMAIL = "admin@local.com";
const PASS = "Admin12345!";

const shots = [
  { name: "01-dashboard", path: "/dashboard", wait: 2500 },
  { name: "02-diagnostic-tests", path: "/settings/diagnostic-tests", wait: 3000 },
  { name: "03-evidence-atlas", path: "/settings/evidence-atlas", wait: 2500 },
  { name: "04-agenda", path: "/agenda", wait: 2500 },
  { name: "05-patients", path: "/patients", wait: 2500 },
];

async function login(page) {
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle", timeout: 60000 });
  await page.locator('input[type="email"], input[name="email"]').first().fill(EMAIL);
  await page.locator('input[type="password"]').first().fill(PASS);
  await page.locator('button[type="submit"]').first().click();
  await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 60000 });
  await page.waitForTimeout(1500);
}

async function capturePatientDetail(page) {
  const link = page.locator('a[href*="/patients/"]').first();
  if (await link.count()) {
    await link.click();
    await page.waitForTimeout(3000);
    await page.screenshot({
      path: path.join(OUT, "06-patient-record.png"),
      fullPage: false,
    });
    console.log("saved 06-patient-record.png");

    const episodeLink = page.locator('a[href*="/episodes/"]').first();
    if (await episodeLink.count()) {
      await episodeLink.click();
      await page.waitForTimeout(3000);
      await page.screenshot({
        path: path.join(OUT, "07-episode.png"),
        fullPage: false,
      });
      console.log("saved 07-episode.png");
    }
  }
}

async function main() {
  await mkdir(OUT, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1.25,
  });
  const page = await context.newPage();

  try {
    await login(page);

    for (const shot of shots) {
      await page.goto(`${BASE}${shot.path}`, { waitUntil: "networkidle", timeout: 60000 });
      await page.waitForTimeout(shot.wait);
      const file = path.join(OUT, `${shot.name}.png`);
      await page.screenshot({ path: file, fullPage: false });
      console.log(`saved ${shot.name}.png`);
    }

    await page.goto(`${BASE}/patients`, { waitUntil: "networkidle", timeout: 60000 });
    await page.waitForTimeout(2000);
    await capturePatientDetail(page);
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
