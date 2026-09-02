// Quick hydration error check using Playwright
import { chromium } from "playwright";

const URLS = [
  "https://app.daneg.ae/",
  "https://app.daneg.ae/app",
  "https://app.daneg.ae/app?view=category&category=Shoes",
];

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });

for (const url of URLS) {
  console.log("\n========================================");
  console.log(`URL: ${url}`);
  console.log("========================================");
  const page = await context.newPage();
  const errors = [];
  const warnings = [];
  
  page.on("pageerror", (err) => errors.push(err.message));
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(`[console.error] ${msg.text()}`);
    if (msg.type() === "warning") warnings.push(`[console.warn] ${msg.text()}`);
  });
  
  try {
    const start = Date.now();
    await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
    const loadTime = Date.now() - start;
    await page.waitForTimeout(2000);
    
    console.log(`  Load time: ${loadTime}ms`);
    
    if (errors.length > 0) {
      console.log("\n  === ERRORS ===");
      errors.forEach(e => console.log("    " + e.substring(0, 300)));
    } else {
      console.log("\n  No JavaScript errors");
    }
    
    if (warnings.length > 0) {
      console.log("\n  === WARNINGS (first 5) ===");
      warnings.slice(0, 5).forEach(w => console.log("    " + w.substring(0, 300)));
    }
  } catch (e) {
    console.log(`  ERROR loading page: ${e.message}`);
  }
  
  await page.close();
}

await browser.close();
