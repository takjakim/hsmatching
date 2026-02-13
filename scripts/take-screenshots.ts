import { chromium } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'http://localhost:5173';
const SCREENSHOT_DIR = path.join(__dirname, '..', 'screenshots');

async function main() {
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });
  const page = await context.newPage();

  async function screenshot(name: string) {
    await page.waitForTimeout(3000);
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, name),
      fullPage: true,
    });
    console.log(`  ✓ ${name}`);
  }

  // Full page load (for initial navigation or after clearing state)
  async function navigateFull(route: string) {
    await page.goto(`${BASE_URL}/${route}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
  }

  // Client-side SPA navigation via pushState + popstate
  async function navigateSPA(route: string) {
    await page.evaluate((r: string) => {
      window.history.pushState({}, '', '/' + r);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }, route);
    await page.waitForTimeout(2000);
    try {
      await page.waitForLoadState('networkidle', { timeout: 5000 });
    } catch {
      // networkidle timeout is fine - page may not make network requests
    }
  }

  // Dismiss bridge/sub-landing page if present, then wait for actual content
  async function dismissBridgeIfPresent() {
    await page.waitForTimeout(1500);
    // Bridge pages have a "시작하기" button - click it to get to actual content
    const bridgeButton = page.locator('button:has-text("시작하기")');
    if (await bridgeButton.isVisible({ timeout: 1000 }).catch(() => false)) {
      console.log('    → Bridge page detected, clicking through...');
      await bridgeButton.click();
      await page.waitForTimeout(2000);
      try {
        await page.waitForLoadState('networkidle', { timeout: 5000 });
      } catch {
        // ok
      }
    }
  }

  try {
    console.log('📸 Starting screenshot capture...\n');

    // ===== GROUP 1: PUBLIC PAGES =====
    console.log('Group 1: Public Pages');

    // Load the app first, then use SPA navigation for public pages
    // (full page load has a race condition between URL sync and page sync useEffects)
    await navigateFull('login');
    await page.waitForTimeout(1000);

    await navigateSPA('landing');
    await screenshot('01-landing.png');

    await navigateSPA('login');
    await screenshot('02-login.png');

    await navigateSPA('riasec');
    await screenshot('03-riasec.png');

    // ===== GROUP 2: STUDENT PAGES =====
    console.log('\nGroup 2: Student Pages');
    console.log('  Logging in as student (60251001)...');

    // Go to login page and fill form
    await navigateFull('login');
    const studentIdInput = page.locator('input:not([type="password"]):not([type="hidden"]):not([type="submit"])').first();
    await studentIdInput.fill('60251001');
    const passwordInput = page.locator('input[type="password"]');
    await passwordInput.fill('test1234');
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();
    await page.waitForTimeout(3000);
    await page.waitForLoadState('networkidle');
    console.log('  Login successful, on dashboard');

    // Dashboard (already here after login)
    await screenshot('04-dashboard.png');

    // Navigate within SPA for remaining student pages
    await navigateSPA('insight');
    await screenshot('05-insight.png');

    await navigateSPA('competency');
    await dismissBridgeIfPresent();
    await screenshot('06-competency.png');

    await navigateSPA('roadmap-explorer');
    await dismissBridgeIfPresent();
    await screenshot('07-roadmap-explorer.png');

    await navigateSPA('roadmap-rolemodels');
    await dismissBridgeIfPresent();
    await screenshot('08-roadmap-rolemodels.png');

    await navigateSPA('roadmap-planner');
    await dismissBridgeIfPresent();
    await screenshot('09-roadmap-planner.png');

    await navigateSPA('grades');
    await screenshot('10-grades.png');

    await navigateSPA('courses');
    await screenshot('11-courses.png');

    // ===== GROUP 3: ADMIN PAGES =====
    console.log('\nGroup 3: Admin Pages');
    console.log('  Logging out student...');

    // Clear auth state and reload to login
    await page.evaluate(() => localStorage.clear());
    await navigateFull('login');

    console.log('  Logging in as admin...');
    const adminIdInput = page.locator('input:not([type="password"]):not([type="hidden"]):not([type="submit"])').first();
    await adminIdInput.fill('admin');
    const adminPwInput = page.locator('input[type="password"]');
    await adminPwInput.fill('admin123');
    const adminSubmit = page.locator('button[type="submit"]');
    await adminSubmit.click();
    await page.waitForTimeout(3000);
    await page.waitForLoadState('networkidle');

    await screenshot('12-admin-dashboard.png');

    console.log('\n✅ All 12 screenshots captured successfully!');
    console.log(`📁 Saved to: ${SCREENSHOT_DIR}`);
  } catch (error) {
    console.error('\n❌ Error:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
