import { chromium } from 'playwright';

const BASE = 'http://127.0.0.1:3211';
const VIEWPORT = { width: 393, height: 852 };
const log = (...a) => console.log(...a);

const browser = await chromium.launch({
  executablePath: '/Users/macbook/Library/Caches/ms-playwright/chromium-1223/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing',
  args: ['--no-sandbox','--disable-dev-shm-usage'],
});
const ctx = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: 2 });
await ctx.route('**://127.0.0.1:54321/**', (route) => route.abort());
const page = await ctx.newPage();
page.on('console', (msg) => { if (msg.type() === 'error') log('PAGE-ERR:', msg.text()); });
page.on('pageerror', (err) => log('PAGE-EXC:', err.message));

await page.goto(`${BASE}/app`, { waitUntil: 'domcontentloaded' });
await page.waitForSelector('button:has-text("Enter Mooday")', { timeout: 30_000 });
await page.click('button:has-text("Enter Mooday")');
await page.waitForSelector('[data-testid="app-header"]', { timeout: 30_000 });

// Take high-res screenshot
const header = await page.locator('[data-testid="app-header"]');
await header.screenshot({ path: '/tmp/mooday-header.png' });
const navBar = await page.locator('[data-testid="bottom-navigation"]');
await navBar.screenshot({ path: '/tmp/mooday-bottomnav.png' });
await page.screenshot({ path: '/tmp/mooday-home.png', fullPage: false });

const detail = await page.evaluate(() => {
  const header = document.querySelector('[data-testid="app-header"]');
  const cs = getComputedStyle(header);
  const titleBtn = header.querySelector('h1 button');
  const titleRect = titleBtn?.getBoundingClientRect();
  return {
    headerPaddingTop: cs.paddingTop,
    headerPaddingBottom: cs.paddingBottom,
    headerHeight: header.getBoundingClientRect().height,
    headerGrid: cs.gridTemplateColumns,
    titleRect: titleRect ? { x: titleRect.x, y: titleRect.y, w: titleRect.width, h: titleRect.height } : null,
    titleScrollWidth: titleBtn ? titleBtn.scrollWidth : null,
    titleClientWidth: titleBtn ? titleBtn.clientWidth : null,
    titleOverflow: titleBtn ? titleBtn.scrollWidth > titleBtn.clientWidth : null,
    logoLetter: titleBtn ? titleBtn.textContent : null,
  };
});
log('Header detail:', JSON.stringify(detail, null, 2));

// Click "Settings" once, log what happens (header should be hidden because settings is a HIDE_CHROME view).
await page.locator('[data-testid="app-header"] button[aria-label="Settings"]').first().click();
await page.waitForTimeout(800);
const afterSettings = await page.evaluate(() => {
  const header = document.querySelector('[data-testid="app-header"]');
  const nav = document.querySelector('[data-testid="bottom-navigation"]');
  const main = document.querySelector('main#main-content');
  return {
    headerCount: header ? 1 : 0,
    navCount: nav ? 1 : 0,
    mainText: main ? main.textContent.replace(/\s+/g, ' ').trim().slice(0, 300) : '',
  };
});
log('After Settings click:', JSON.stringify(afterSettings, null, 2));
await page.screenshot({ path: '/tmp/mooday-after-settings.png' });

// Bottom-nav buttons: confirm each one changes the view
const bottomTabs = [
  { name: 'Home',     expectedHeader: 1, expectedNav: 1 },
  { name: 'Search',   expectedHeader: 1, expectedNav: 1 },
  { name: 'Activity', expectedHeader: 1, expectedNav: 1 },
  { name: 'Vault',    expectedHeader: 1, expectedNav: 1 },
  { name: 'Sell',     expectedHeader: 1, expectedNav: 1 },
];
for (const tab of bottomTabs) {
  await page.goto(`${BASE}/app`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('button:has-text("Enter Mooday")', { timeout: 30_000 });
  await page.click('button:has-text("Enter Mooday")');
  await page.waitForSelector('[data-testid="app-header"]', { timeout: 30_000 });
  await page.locator(`[data-testid="bottom-navigation"] button[aria-label="${tab.name}"]`).first().click();
  await page.waitForTimeout(800);
  const headerCount = await page.locator('[data-testid="app-header"]').count();
  const navCount = await page.locator('[data-testid="bottom-navigation"]').count();
  const activeTab = await page.locator('[data-testid="bottom-navigation"] button[aria-current="page"]').first().getAttribute('aria-label').catch(() => null);
  log(`Bottom ${tab.name}: header=${headerCount} nav=${navCount} active=${activeTab}`);
}

await browser.close();
