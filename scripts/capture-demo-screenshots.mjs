import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const BASE = process.env.DEMO_BASE_URL || "http://localhost:3002";
const OUT = path.resolve("assets/demo");
const EMAIL = process.env.DEMO_EMAIL || "admin@local.com";
const PASS = process.env.DEMO_PASS || "Admin12345!";

const PATIENT_VALERIA = "a9e4c2a1-3f3d-4e89-bc1a-2d4f6a8b0e42";
const EPISODE_VALERIA = "88074fee-53de-4cfd-abc8-119befad5e94";
const EPISODE_MANUEL = "08258b25-8c95-4951-ba45-5a4f4901547f";
const SESSION_VALERIA = "7cab2e9a-7ddf-4ee7-ab32-6b239bfb8938";

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

async function screenshot(page, name) {
  const file = path.join(OUT, `${name}.png`);
  await page.screenshot({ path: file, fullPage: false });
  console.log(`saved ${name}.png`);
}

async function dismissDraftModal(page) {
  for (const btn of [/Descartar copia/i, /^Descartar$/i]) {
    const b = page.getByRole("button", { name: btn });
    if (await b.count()) {
      await b.first().click();
      await page.waitForTimeout(800);
    }
  }
}

async function capturePatientRecord(page) {
  await page.goto(`${BASE}/patients/${PATIENT_VALERIA}`, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(3000);
  await screenshot(page, "06-patient-record");

  await page.goto(`${BASE}/episodes/${EPISODE_VALERIA}`, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(3000);
  await screenshot(page, "07-episode");
}

async function captureSoapNote(page) {
  await page.goto(`${BASE}/episodes/${EPISODE_VALERIA}/sessions/${SESSION_VALERIA}/edit`, {
    waitUntil: "networkidle",
    timeout: 60000,
  });
  await page.waitForTimeout(3500);

  const moreBtn = page.getByRole("button", { name: /^Más$/i }).first();
  if (await moreBtn.count()) {
    await moreBtn.click();
    await page.waitForTimeout(600);
  }

  await page.evaluate(() => window.scrollTo(0, 0));
  await screenshot(page, "08-soap-note");
}

async function captureTerminologyCorrector(page) {
  await page.goto(`${BASE}/episodes/${EPISODE_VALERIA}/sessions/new`, {
    waitUntil: "networkidle",
    timeout: 60000,
  });
  await page.waitForTimeout(3000);
  await dismissDraftModal(page);

  for (let step = 0; step < 8; step++) {
    const found = await page.locator("div.relative.overflow-hidden textarea").count();
    if (found > 0) break;
    const next = page.getByRole("button", { name: /Siguiente/i }).first();
    if (await next.count()) {
      await next.click();
      await page.waitForTimeout(900);
    } else break;
  }

  const ta = page.locator("div.relative.overflow-hidden textarea").first();
  await ta.scrollIntoViewIfNeeded();
  const text =
    "Paciente refiere dolor crónico en región cervical con limitación funcional progresiva.";
  await ta.click();
  await ta.fill(text);
  await page.waitForTimeout(400);
  await ta.click();
  await page.keyboard.press("Control+Home");
  for (let i = 0; i < 18; i++) await page.keyboard.press("ArrowRight");
  await page.keyboard.down("Shift");
  for (let i = 0; i < 13; i++) await page.keyboard.press("ArrowRight");
  await page.keyboard.up("Shift");
  await page.waitForTimeout(1200);

  await page.getByText(/Corrector clínico/i).first().scrollIntoViewIfNeeded().catch(() => {});
  await screenshot(page, "09-terminology-corrector");
}

async function captureSafetyAlerts(page) {
  await page.goto(`${BASE}/episodes/${EPISODE_MANUEL}/edit`, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(2500);
  await dismissDraftModal(page);

  await page.getByRole("button", { name: /Cribado y función/i }).click();
  await page.waitForTimeout(1200);
  await page.getByText("1. Antecedentes Clínicos y Médicos").click();
  await page.waitForTimeout(600);

  const medQuestion = page.getByText("¿Registrar medicamentos o alergias activas?");
  await medQuestion.scrollIntoViewIfNeeded();
  await medQuestion.locator("xpath=following::button[normalize-space()='Sí'][1]").click();
  await page.waitForTimeout(500);

  const surgQuestion = page.getByText(/quirúrgicos o traumáticos|quirurgicos o traumaticos/i);
  await surgQuestion.scrollIntoViewIfNeeded();
  await surgQuestion.locator("xpath=following::button[normalize-space()='Sí'][1]").click();
  await page.waitForTimeout(500);

  await page.getByPlaceholder(/Medicamentos actuales/i).fill(
    "Warfarina 5 mg/día, Metformina 850 mg c/12h, Aspirina 100 mg"
  );
  await page
    .getByPlaceholder(/Marcapasos Medtronic|Cirugías|lesiones/i)
    .first()
    .fill("Marcapasos Medtronic Advisa DR MRI SureScan, implante 2019");

  await page.waitForTimeout(6000);
  await page.getByText(/Integraciones clínicas activas/i).first().scrollIntoViewIfNeeded().catch(() => {});
  await screenshot(page, "10-safety-alerts");
}

async function captureImaging(page) {
  await page.goto(
    `${BASE}/settings/imaging?patientId=${PATIENT_VALERIA}&episodeId=${EPISODE_VALERIA}`,
    { waitUntil: "networkidle", timeout: 60000 }
  );
  await page.waitForTimeout(3500);
  await screenshot(page, "11-imaging");
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
      await screenshot(page, shot.name);
    }

    await capturePatientRecord(page);
    await captureSoapNote(page);
    await captureTerminologyCorrector(page);
    await captureSafetyAlerts(page);
    await captureImaging(page);
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
