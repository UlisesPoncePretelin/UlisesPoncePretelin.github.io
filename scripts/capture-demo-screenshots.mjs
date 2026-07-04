import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const BASE = process.env.DEMO_BASE_URL || "https://poncepretelin-web.vercel.app";
const OUT = path.resolve("assets/demo");
const EMAIL = process.env.DEMO_EMAIL || "demo@poncepretelin.app";
const PASS = process.env.DEMO_PASS || "PoncePretelinDemo2026!";

const shots = [
  { name: "01-dashboard", path: "/dashboard", wait: 4000 },
  { name: "02-diagnostic-tests", path: "/settings/diagnostic-tests", wait: 3500 },
  { name: "03-evidence-atlas", path: "/settings/evidence-atlas", wait: 3500 },
  { name: "04-agenda", path: "/agenda", wait: 3500 },
  { name: "05-patients", path: "/patients", wait: 3500 },
];

async function login(page) {
  await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded", timeout: 180000 });
  await page.waitForTimeout(5000);
  const email = page.locator('input[type="email"], input[name="email"], #email').first();
  await email.waitFor({ state: "visible", timeout: 120000 });
  await email.fill(EMAIL);
  await page.locator('input[type="password"], #password').first().fill(PASS);
  await page.locator('button[type="submit"]').first().click();
  await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 180000 });
  await page.waitForTimeout(3000);
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

async function patientIdByFolio(page, folio) {
  await page.goto(`${BASE}/patients`, { waitUntil: "domcontentloaded", timeout: 120000 });
  await page.waitForTimeout(3000);
  const row = page.locator("tr, [class*='row'], li").filter({ hasText: folio }).first();
  if (await row.count()) {
    const link = row.locator('a[href*="/patients/"]').first();
    if (await link.count()) {
      const href = await link.getAttribute("href");
      const match = href?.match(/\/patients\/([^/?#]+)/);
      if (match) return match[1];
    }
  }
  const direct = page.locator(`a[href*="/patients/"]`).filter({ hasText: folio }).first();
  if (await direct.count()) {
    const href = await direct.getAttribute("href");
    return href?.match(/\/patients\/([^/?#]+)/)?.[1] ?? null;
  }
  return null;
}

async function episodeIdForPatient(page, patientId) {
  await page.goto(`${BASE}/patients/${patientId}`, { waitUntil: "domcontentloaded", timeout: 120000 });
  await page.waitForTimeout(3000);
  const link = page.locator('a[href*="/episodes/"]').first();
  if (!(await link.count())) return null;
  const href = await link.getAttribute("href");
  return href?.match(/\/episodes\/([^/?#]+)/)?.[1] ?? null;
}

async function sessionEditPath(page, episodeId) {
  await page.goto(`${BASE}/episodes/${episodeId}`, { waitUntil: "domcontentloaded", timeout: 120000 });
  await page.waitForTimeout(3000);
  let link = page.locator('a[href*="/sessions/"][href*="/edit"]').first();
  if (!(await link.count())) {
    link = page.locator('a[href*="/sessions/"]').filter({ hasNotText: /nueva|new/i }).first();
  }
  if (!(await link.count())) return null;
  const href = await link.getAttribute("href");
  if (!href || href.includes("/sessions/new")) return null;
  return href.startsWith("http") ? new URL(href).pathname : href;
}

async function fallbackDemoIds(page) {
  await page.goto(`${BASE}/patients`, { waitUntil: "domcontentloaded", timeout: 120000 });
  await page.waitForTimeout(3000);
  const links = page.locator('a[href*="/patients/"]');
  const count = await links.count();
  const ids = [];
  for (let i = 0; i < count && ids.length < 2; i++) {
    const href = await links.nth(i).getAttribute("href");
    const id = href?.match(/\/patients\/([^/?#]+)/)?.[1];
    if (id && !ids.includes(id)) ids.push(id);
  }
  if (ids.length < 2) return null;
  const episodeValeria = await episodeIdForPatient(page, ids[0]);
  const episodeManuel = await episodeIdForPatient(page, ids[1]);
  if (!episodeValeria || !episodeManuel) return null;
  const sessionPath = await sessionEditPath(page, episodeValeria);
  console.warn("using fallback demo patients", { ids, episodeValeria, episodeManuel, sessionPath });
  return {
    valeriaId: ids[0],
    manuelId: ids[1],
    episodeValeria,
    episodeManuel,
    sessionPath,
  };
}

async function resolveDemoIds(page) {
  const valeriaId = await patientIdByFolio(page, "DEMOVEST42");
  const manuelId = await patientIdByFolio(page, "DEMONEURO72");
  if (!valeriaId || !manuelId) {
    const fallback = await fallbackDemoIds(page);
    if (fallback) return fallback;
    throw new Error("No se encontraron pacientes demo (DEMOVEST42/DEMONEURO72 ni fallback)");
  }

  const episodeValeria = await episodeIdForPatient(page, valeriaId);
  const episodeManuel = await episodeIdForPatient(page, manuelId);
  if (!episodeValeria || !episodeManuel) {
    const fallback = await fallbackDemoIds(page);
    if (fallback) return fallback;
    throw new Error("No se encontraron episodios demo para Valeria o Manuel");
  }

  const sessionPath = await sessionEditPath(page, episodeValeria);
  console.log("demo ids", { valeriaId, manuelId, episodeValeria, episodeManuel, sessionPath });

  return { valeriaId, manuelId, episodeValeria, episodeManuel, sessionPath };
}

async function capturePatientRecord(page, valeriaId, episodeValeria) {
  await page.goto(`${BASE}/patients/${valeriaId}`, { waitUntil: "domcontentloaded", timeout: 120000 });
  await page.waitForTimeout(3500);
  await screenshot(page, "06-patient-record");

  await page.goto(`${BASE}/episodes/${episodeValeria}`, { waitUntil: "domcontentloaded", timeout: 120000 });
  await page.waitForTimeout(3500);
  await screenshot(page, "07-episode");
}

async function captureSoapNote(page, sessionPath) {
  if (!sessionPath) {
    console.warn("skip 08-soap-note: no session path");
    return;
  }
  await page.goto(`${BASE}${sessionPath}`, { waitUntil: "domcontentloaded", timeout: 120000 });
  await page.waitForTimeout(4000);

  const moreBtn = page.getByRole("button", { name: /^Más$/i }).first();
  if (await moreBtn.count()) {
    await moreBtn.click();
    await page.waitForTimeout(600);
  }

  await page.evaluate(() => window.scrollTo(0, 0));
  await screenshot(page, "08-soap-note");
}

async function captureTerminologyCorrector(page, episodeValeria) {
  await page.goto(`${BASE}/episodes/${episodeValeria}/sessions/new`, {
    waitUntil: "domcontentloaded",
    timeout: 120000,
  });
  await page.waitForTimeout(3500);
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
  if (!(await ta.count())) {
    console.warn("skip 09-terminology-corrector: no textarea");
    return;
  }

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

async function captureSafetyAlerts(page, episodeManuel) {
  await page.goto(`${BASE}/episodes/${episodeManuel}/edit`, { waitUntil: "domcontentloaded", timeout: 120000 });
  await page.waitForTimeout(3000);
  await dismissDraftModal(page);

  await page.getByRole("button", { name: /Cribado y función/i }).click();
  await page.waitForTimeout(1500);
  await page.getByText(/1\. Antecedentes \(NOM-004\)/i).click();
  await page.waitForTimeout(800);

  const meds = page.getByLabel("Medicamentos actuales").first();
  if (await meds.count()) {
    await meds.fill("Warfarina 5 mg/día, Metformina 850 mg c/12h, Aspirina 100 mg");
  }

  const surg = page.getByLabel(/Quirúrgicos \/ traumáticos/i).first();
  if (await surg.count()) {
    await surg.fill("Marcapasos Medtronic Advisa DR MRI SureScan, implante 2019");
  }

  await page.waitForTimeout(6000);
  await page.getByText(/Integraciones clínicas activas/i).first().scrollIntoViewIfNeeded().catch(() => {});
  await screenshot(page, "10-safety-alerts");
}

async function captureImaging(page, valeriaId, episodeValeria) {
  await page.goto(
    `${BASE}/settings/imaging?patientId=${valeriaId}&episodeId=${episodeValeria}`,
    { waitUntil: "domcontentloaded", timeout: 120000 }
  );
  await page.waitForTimeout(4000);
  await screenshot(page, "11-imaging");
}

async function main() {
  await mkdir(OUT, { recursive: true });
  console.log(`Capturing from ${BASE} as ${EMAIL}`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1.25,
  });
  const page = await context.newPage();

  try {
    await login(page);
    const ids = await resolveDemoIds(page);

    for (const shot of shots) {
      await page.goto(`${BASE}${shot.path}`, { waitUntil: "domcontentloaded", timeout: 120000 });
      await page.waitForTimeout(shot.wait);
      await screenshot(page, shot.name);
    }

    await capturePatientRecord(page, ids.valeriaId, ids.episodeValeria);
    await captureSoapNote(page, ids.sessionPath);
    await captureTerminologyCorrector(page, ids.episodeValeria);
    await captureSafetyAlerts(page, ids.episodeManuel);
    await captureImaging(page, ids.valeriaId, ids.episodeValeria);
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
