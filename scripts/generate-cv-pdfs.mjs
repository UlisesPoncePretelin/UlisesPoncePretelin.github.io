import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, extname } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const ROOT = fileURLToPath(new URL(".", import.meta.url));
const REPO = join(ROOT, "..");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".pdf": "application/pdf",
  ".woff2": "font/woff2",
};

const startServer = () =>
  new Promise((resolve) => {
    const server = createServer(async (req, res) => {
      try {
        const urlPath = decodeURIComponent((req.url || "/").split("?")[0]);
        const safePath = urlPath === "/" ? "/cv.html" : urlPath;
        const filePath = join(REPO, safePath.replace(/^\//, ""));

        if (!filePath.startsWith(REPO) || !existsSync(filePath)) {
          res.writeHead(404);
          res.end("Not found");
          return;
        }

        const ext = extname(filePath).toLowerCase();
        const body = await readFile(filePath);
        res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" });
        res.end(body);
      } catch {
        res.writeHead(500);
        res.end("Server error");
      }
    });

    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address();
      resolve({ server, port });
    });
  });

const generatePdf = async (page, lang, outputPath) => {
  await page.goto(`http://127.0.0.1:${port}/cv.html?lang=${lang}`, { waitUntil: "networkidle" });
  await page.waitForFunction((l) => document.documentElement.lang === l, lang);
  await page.emulateMedia({ media: "print" });
  await page.pdf({
    path: outputPath,
    format: "A4",
    printBackground: true,
    margin: { top: "10mm", bottom: "10mm", left: "12mm", right: "12mm" },
  });
};

let port;
const { server, port: serverPort } = await startServer();
port = serverPort;

const browser = await chromium.launch();
const page = await browser.newPage();

try {
  const esPath = join(REPO, "assets", "CV_UlisesPoncePretelin.pdf");
  const enPath = join(REPO, "assets", "CV_UlisesPoncePretelin_EN.pdf");

  await generatePdf(page, "es", esPath);
  console.log("Generated:", esPath);

  await generatePdf(page, "en", enPath);
  console.log("Generated:", enPath);
} finally {
  await browser.close();
  server.close();
}
