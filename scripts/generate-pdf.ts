import { chromium } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BASE_URL = 'http://localhost:5173';
const OUTPUT_DIR = path.join(__dirname, '..', 'screenshots');

async function main() {
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    acceptDownloads: true,
  });
  const page = await context.newPage();

  // Clear state
  await page.goto(`${BASE_URL}/riasec`, { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.removeItem('pilot_survey_progress'));
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  // ===== STEP 1: Intro =====
  console.log('1. Filling intro...');
  // /riasec route uses mode='default', isMjuStudent=true by default
  // Uncheck the MJU student checkbox so we only need name+email+consent
  const mjuCheckbox = page.locator('input[type="checkbox"]').first();
  await mjuCheckbox.uncheck();
  await page.waitForTimeout(300);

  await page.fill('input[placeholder="홍길동"]', '테스트학생');
  await page.fill('input[placeholder="example@email.com"]', 'test@mju.ac.kr');
  await page.waitForTimeout(300);

  // Check the consent checkbox (last checkbox on the page)
  const consentCheckbox = page.locator('input[type="checkbox"]').last();
  await consentCheckbox.check();
  await page.waitForTimeout(500);

  await page.screenshot({ path: path.join(OUTPUT_DIR, 'step1-intro.png'), fullPage: true });
  // Click the button specifically (not the heading which has same text)
  await page.locator('button:has-text("검사 시작하기")').click();
  await page.waitForTimeout(2000);

  // ===== STEP 2: Interest Select =====
  console.log('2. Interest selection...');
  await page.screenshot({ path: path.join(OUTPUT_DIR, 'step2-before-select.png'), fullPage: true });

  // InterestSelect uses motion.button with rounded-2xl class inside a grid
  // Click first 2 cluster card buttons (they are in a grid container)
  const clusterGrid = page.locator('.grid button.rounded-2xl');
  const cc = await clusterGrid.count();
  console.log(`   Found ${cc} cluster cards`);
  if (cc >= 2) {
    await clusterGrid.nth(0).click();
    await page.waitForTimeout(300);
    await clusterGrid.nth(1).click();
    await page.waitForTimeout(500);
  } else {
    // Fallback: try any button inside the grid
    const anyGridBtn = page.locator('.grid button');
    const anyCount = await anyGridBtn.count();
    console.log(`   Fallback: Found ${anyCount} grid buttons`);
    if (anyCount >= 2) {
      await anyGridBtn.nth(0).click();
      await page.waitForTimeout(300);
      await anyGridBtn.nth(1).click();
      await page.waitForTimeout(500);
    }
  }

  await page.screenshot({ path: path.join(OUTPUT_DIR, 'step2-after-select.png'), fullPage: true });

  // Button text is "선택한 계열의 학과 살펴보기"
  await page.click('text=선택한 계열의 학과 살펴보기');
  await page.waitForTimeout(2000);

  // ===== STEP 3: Major Preview =====
  console.log('3. Major Preview...');
  await page.screenshot({ path: path.join(OUTPUT_DIR, 'step3-major-preview.png'), fullPage: true });
  // Button text is "검사 시작하기"
  await page.locator('button:has-text("검사 시작하기")').click();
  await page.waitForTimeout(1000);

  // ===== STEP 4: RIASEC 75 Questions =====
  console.log('4. RIASEC questions...');
  for (let i = 0; i < 75; i++) {
    // Wait for animation to complete before clicking
    await page.waitForTimeout(450);

    // RiasecQuestion: two motion.button elements with rounded-2xl
    // Click the first one (option A) - alternate with B for varied scores
    try {
      const options = page.locator('button.rounded-2xl');
      const optIdx = i % 3 === 0 ? 1 : 0; // Mostly A, sometimes B for variety
      await options.nth(optIdx).click({ timeout: 3000 });
    } catch {
      // Fallback: click any visible button
      const anyBtn = page.locator('button:visible').first();
      await anyBtn.click({ timeout: 2000 }).catch(() => {});
    }

    if ((i + 1) % 25 === 0) console.log(`   ... ${i + 1}/75`);
  }
  await page.waitForTimeout(3000);

  // ===== STEP 5: RIASEC Result =====
  console.log('5. RIASEC Result...');
  await page.screenshot({ path: path.join(OUTPUT_DIR, 'step5-riasec-result.png'), fullPage: true });

  // Scroll down to find the supplementary button
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(1000);

  // Click "보완문항 응답하기" button
  const suppBtn = page.locator('button:has-text("보완문항 응답하기")');
  const suppVisible = await suppBtn.isVisible({ timeout: 5000 }).catch(() => false);
  if (suppVisible) {
    await suppBtn.click();
    await page.waitForTimeout(1500);
    console.log('   Clicked supplementary button');
  } else {
    // Try alternative text patterns
    const altBtn = page.locator('button:has-text("보완"), button:has-text("심층")').first();
    const altVisible = await altBtn.isVisible({ timeout: 3000 }).catch(() => false);
    if (altVisible) {
      await altBtn.click();
      await page.waitForTimeout(1500);
      console.log('   Clicked alt supplementary button');
    } else {
      console.log('   No supplementary button found');
      await page.screenshot({ path: path.join(OUTPUT_DIR, 'step5-debug.png'), fullPage: true });
    }
  }

  // ===== STEP 6: Supplementary =====
  console.log('6. Supplementary questions...');
  for (let q = 0; q < 50; q++) {
    await page.waitForTimeout(400);

    // Check for complete phase (PDF button or complete result)
    if (await page.locator('text=PDF').first().isVisible({ timeout: 300 }).catch(() => false)) {
      console.log(`   Complete! (after ${q} supplementary questions)`);
      break;
    }
    // Also check for the complete page elements
    if (await page.locator('text=더 정확한 분석을 원하시나요').isVisible({ timeout: 200 }).catch(() => false)) {
      console.log(`   Complete (result page)! (after ${q} supplementary questions)`);
      break;
    }

    // Check for loading spinner
    if (await page.locator('.animate-spin').isVisible({ timeout: 100 }).catch(() => false)) {
      console.log('   Waiting for loading...');
      await page.waitForTimeout(3000);
      continue;
    }

    // PRIORITY 1: Check for ranking question (순서대로/순위 선택)
    const isRanking = await page.locator('text=순서대로').first().isVisible({ timeout: 150 }).catch(() => false);
    if (isRanking) {
      // Ranking: need to click N options (usually 3) before submit
      const rankOpts = page.locator('button.rounded-2xl.text-left, button.rounded-2xl:has(span)');
      const rankOptCount = await rankOpts.count();
      const needed = 3; // Most ranking questions need top 3
      for (let r = 0; r < Math.min(needed, rankOptCount); r++) {
        await rankOpts.nth(r).click();
        await page.waitForTimeout(300);
      }
      await page.waitForTimeout(500);
      // Now click the submit button (should be active after selections)
      const rankSubmit = page.locator('button:has-text("다음으로"), button:has-text("다음"):not(:has-text("이전"))').first();
      if (await rankSubmit.isVisible({ timeout: 500 }).catch(() => false)) {
        await rankSubmit.click();
      }
      await page.waitForTimeout(400);
      if (q % 10 === 0) console.log(`   Q${q}: ranking (${rankOptCount} opts)`);
      continue;
    }

    // PRIORITY 2: Check for "다음으로" or "다음" button → multi-select or freetext
    const nextBtn = page.locator('button:has-text("다음으로"), button:has-text("다음"):not(:has-text("이전"))').first();
    const hasNextBtn = await nextBtn.isVisible({ timeout: 200 }).catch(() => false);

    if (hasNextBtn) {
      // Check for freetext (textarea) first
      const textarea = page.locator('textarea').first();
      if (await textarea.isVisible({ timeout: 150 }).catch(() => false)) {
        await textarea.fill('테스트 응답입니다. 저는 이 분야에 관심이 있습니다.');
        await page.waitForTimeout(300);
        await nextBtn.click();
        if (q % 10 === 0) console.log(`   Q${q}: freetext`);
        continue;
      }

      // Multi-select: click first option then "다음으로"
      const opts = page.locator('button.rounded-2xl:not(:has-text("다음")):not(:has-text("이전"))');
      const optCount = await opts.count();
      if (optCount >= 1) {
        await opts.nth(0).click();
        await page.waitForTimeout(200);
      }
      await page.waitForTimeout(200);
      await nextBtn.click();
      await page.waitForTimeout(300);
      if (q % 10 === 0) console.log(`   Q${q}: multi (${optCount} opts)`);
      continue;
    }

    // PRIORITY 2: Likert - 5 aspect-square buttons (auto-advance)
    const likertBtns = page.locator('button.aspect-square');
    const likertCount = await likertBtns.count();
    if (likertCount === 5) {
      await likertBtns.nth(3).click(); // "그렇다"
      await page.waitForTimeout(200);
      if (q % 10 === 0) console.log(`   Q${q}: likert`);
      continue;
    }

    // PRIORITY 3: SingleSelect - auto-advance options (no "다음" button present)
    const singleBtns = page.locator('button.rounded-2xl:not(.aspect-square)');
    const singleCount = await singleBtns.count();
    if (singleCount >= 2 && singleCount <= 8) {
      await singleBtns.first().click();
      await page.waitForTimeout(400);
      if (q % 10 === 0) console.log(`   Q${q}: single (${singleCount} options)`);
      continue;
    }

    // Fallback: click any enabled button
    const fb = page.locator('button:not([disabled])').first();
    if (await fb.isVisible({ timeout: 300 }).catch(() => false)) {
      await fb.click();
      await page.waitForTimeout(300);
      if (q % 10 === 0) console.log(`   Q${q}: fallback`);
    }
  }

  await page.waitForTimeout(3000);

  // ===== STEP 7: PDF Export =====
  console.log('7. Exporting PDF...');
  await page.screenshot({ path: path.join(OUTPUT_DIR, 'step7-complete-page.png'), fullPage: true });
  console.log('   ✓ step7-complete-page.png');

  const pdfBtn = page.locator('text=PDF').first();
  if (await pdfBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
    const dlPromise = page.waitForEvent('download', { timeout: 30000 });
    await pdfBtn.click();
    console.log('   Generating PDF...');

    try {
      const dl = await dlPromise;
      const fname = dl.suggestedFilename() || 'result.pdf';
      const saveTo = path.join(OUTPUT_DIR, fname);
      await dl.saveAs(saveTo);
      console.log(`   ✓ PDF: ${saveTo}`);
    } catch {
      // jsPDF uses file-saver/saveAs which triggers a blob download
      console.log('   Download event timeout, checking Downloads folder...');
      await page.waitForTimeout(10000);
      const homeDir = process.env.HOME || '';
      const dlDir = path.join(homeDir, 'Downloads');
      if (fs.existsSync(dlDir)) {
        const pdfs = fs.readdirSync(dlDir)
          .filter(f => f.endsWith('.pdf') && (f.includes('RIASEC') || f.includes('테스트') || f.includes('Career')))
          .map(f => ({ n: f, t: fs.statSync(path.join(dlDir, f)).mtimeMs }))
          .sort((a, b) => b.t - a.t);
        if (pdfs.length > 0 && (Date.now() - pdfs[0].t) < 60000) {
          const src = path.join(dlDir, pdfs[0].n);
          const dst = path.join(OUTPUT_DIR, pdfs[0].n);
          fs.copyFileSync(src, dst);
          console.log(`   ✓ PDF copied: ${dst}`);
        } else {
          console.log('   ✗ No recent PDF found in Downloads');
        }
      }
    }
  } else {
    console.log('   ✗ PDF button not found');
    await page.screenshot({ path: path.join(OUTPUT_DIR, 'step7-debug.png'), fullPage: true });
  }

  await browser.close();
  console.log('\nDone!');
}

main().catch(e => {
  console.error('Error:', e);
  process.exit(1);
});
