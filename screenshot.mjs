// Screenshot helper for design review.
// Usage:
//   node screenshot.mjs http://localhost:3000
//   node screenshot.mjs http://localhost:3000 hero        (label suffix)
//   node screenshot.mjs http://localhost:3000 hero mobile (label + mobile viewport)
//
// Saves to "./temporary screenshots/screenshot-N.png" (auto-incremented, never overwritten).

import puppeteer from "puppeteer";
import { readdir, mkdir, access } from "node:fs/promises";
import { join } from "node:path";
import { homedir } from "node:os";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL(".", import.meta.url));
const OUT_DIR = join(ROOT, "temporary screenshots");

// Puppeteer's bundled Chrome version isn't always the one cached on this machine.
// Resolve the newest complete Chrome from the puppeteer cache and use it directly.
async function resolveChrome() {
  const base = join(homedir(), ".cache", "puppeteer", "chrome");
  let versions = [];
  try {
    versions = await readdir(base);
  } catch {
    return undefined; // no cache -> let puppeteer use its default
  }
  // Sort newest-first by numeric version segments.
  versions.sort((a, b) => {
    const na = (a.match(/[\d.]+/)?.[0] || "0").split(".").map(Number);
    const nb = (b.match(/[\d.]+/)?.[0] || "0").split(".").map(Number);
    for (let i = 0; i < Math.max(na.length, nb.length); i++) {
      if ((nb[i] || 0) !== (na[i] || 0)) return (nb[i] || 0) - (na[i] || 0);
    }
    return 0;
  });
  for (const v of versions) {
    const exe = join(base, v, "chrome-win64", "chrome.exe");
    try {
      await access(exe);
      return exe;
    } catch {
      /* incomplete download — skip */
    }
  }
  return undefined;
}

const url = process.argv[2] || "http://localhost:3000";
const label = process.argv[3] || "";
const isMobile = process.argv.includes("mobile");

const VIEWPORTS = {
  desktop: { width: 1440, height: 900, deviceScaleFactor: 2 },
  mobile: { width: 390, height: 844, deviceScaleFactor: 3, isMobile: true, hasTouch: true },
};

async function nextIndex() {
  await mkdir(OUT_DIR, { recursive: true });
  const files = await readdir(OUT_DIR).catch(() => []);
  let max = 0;
  for (const f of files) {
    const m = f.match(/^screenshot-(\d+)/);
    if (m) max = Math.max(max, Number(m[1]));
  }
  return max + 1;
}

const n = await nextIndex();
const suffix = label ? `-${label}` : "";
const outPath = join(OUT_DIR, `screenshot-${n}${suffix}.png`);

const executablePath = await resolveChrome();
const browser = await puppeteer.launch({
  headless: true,
  ...(executablePath ? { executablePath } : {}),
  args: ["--no-sandbox", "--disable-setuid-sandbox"],
});

try {
  const page = await browser.newPage();
  await page.setViewport(isMobile ? VIEWPORTS.mobile : VIEWPORTS.desktop);
  await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });
  // Give web fonts / lazy content a beat to settle.
  await new Promise((r) => setTimeout(r, 600));
  await page.screenshot({ path: outPath, fullPage: true });
  console.log(`Saved ${outPath}`);
} finally {
  await browser.close();
}
