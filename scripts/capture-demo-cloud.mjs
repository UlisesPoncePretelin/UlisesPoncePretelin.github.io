import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const BASE = process.env.DEMO_URL || "https://poncepretelin-web.onrender.com";
const OUT = path.resolve("assets/demo");
const EMAIL = process.env.DEMO_EMAIL || "demo@poncepretelin.app";
const PASS = process.env.DEMO_PASS || "DemoCloud2026";

const shots = [
  { name: "01-dashboard", path: "/dashboard", wait: 4000 },
  { name: "04-agenda", path: "/agenda", wait: 3500 },
  { name: "05-patients", path: "/patients", wait: 3500 },
  { name: "02-diagnostic-tests", path: "/settings/diagnostic-tests", wait: 3500 },
  { name: "03-evidence-atlas", path: "/settings/evidence-atlas", wait: 3500 },
];

async function login(page) {
  await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded", timeout: 120000 });
  await page.waitForTimeout(3000);
  const email = page.locator('input[type="email"], input[name="email"]').first();
  await email.waitFor({ state: "visible", timeout: 60000 });
  await email.fill(EMAIL);
  await page.locator('input[type="password"]').first().fill(PASS);
  await page.locator('button[type="submit"]').first().click();
  await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 120000 });
  await page.waitForTimeout(2500);
}

async function capturePatientFlows(page) {
  await page.goto(`${BASE}/patients`, { waitUntil: "domcontentloaded", timeout: 120000 });
  await page.waitForTimeout(3000);

  const patientLink = page.locator('a[href*="/patients/"]').first();
  if (!(await patientLink.count())) return;

  await patientLink.click();
  await page.waitForTimeout(3500);
  await page.screenshot({ path: path.join(OUT, "06-patient-record.png") });
  console.log("saved 06-patient-record.png");

  const episodeLink = page.locator('a[href*="/episodes/"]').first();
  if (await episodeLink.count()) {
    await episodeLink.click();
    await page.waitForTimeout(3500);
    await page.screenshot({ path: path.join(OUT, "07-episode.png") });
    console.log("saved 07-episode.png");
  }

  const soapLink = page.locator('a[href*="soap"], a[href*="/notes/"]').first();
  if (await soapLink.count()) {
    await soapLink.click();
    await page.waitForTimeout(4000);
    await page.screenshot({ path: path.join(OUT, "08-soap-note.png") });
    console.log("saved 08-soap-note.png");
  }

  const imagingLink = page.locator('a[href*="imaging"], a[href*="image"], a:has-text("Imagen")').first();
  if (await imagingLink.count()) {
    await imagingLink.click();
    await page.waitForTimeout(4000);
    await page.screenshot({ path: path.join(OUT, "09-imaging.png") });
    console.log("saved 09-imaging.png");
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
      await page.goto(`${BASE}${shot.path}`, { waitUntil: "domcontentloaded", timeout: 120000 });
      await page.waitForTimeout(shot.wait);
      await page.screenshot({ path: path.join(OUT, `${shot.name}.png`) });
      console.log(`saved ${shot.name}.png`);
    }

    await capturePatientFlows(page);
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
