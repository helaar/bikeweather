/**
 * Verify the Safari/WebKit CORS fix for api.met.no.
 *
 * What to look for:
 *   PASS: only "Direct GET" lines — no CORS preflight, fix is working
 *   FAIL: "PREFLIGHT fired" lines — User-Agent header is still triggering OPTIONS
 *
 * Usage:
 *   node test-safari-cors.mjs
 *
 * The script opens the live site in Playwright's WebKit engine (same as Safari),
 * logs in with Strava, and watches network requests to api.met.no while the
 * weather forecast loads. Adjust STRAVA_EMAIL / STRAVA_PASSWORD below or set
 * them as environment variables.
 */

import { webkit } from 'playwright';

const STRAVA_EMAIL    = process.env.STRAVA_EMAIL    || 'YOUR_STRAVA_EMAIL';
const STRAVA_PASSWORD = process.env.STRAVA_PASSWORD || 'YOUR_STRAVA_PASSWORD';
const APP_URL         = 'https://helaar.github.io/bikeweather';

(async () => {
  console.log('Launching WebKit (Safari engine)…');
  const browser = await webkit.launch({ headless: false });
  const page = await browser.newPage();

  let preflightCount = 0;
  let directGetCount = 0;

  page.on('request', req => {
    if (!req.url().includes('api.met.no')) return;
    if (req.method() === 'OPTIONS') {
      preflightCount++;
      console.log(`[PREFLIGHT] ${req.url()}`);
    } else if (req.method() === 'GET') {
      directGetCount++;
      console.log(`[GET #${directGetCount}] ${req.url().split('?')[0]}`);
    }
  });

  page.on('requestfailed', req => {
    if (req.url().includes('api.met.no')) {
      console.log(`[FAILED] ${req.method()} ${req.url().split('?')[0]} — ${req.failure()?.errorText}`);
    }
  });

  console.log(`Opening ${APP_URL} …`);
  await page.goto(APP_URL, { waitUntil: 'networkidle' });

  // Click the Strava connect button (adjust selector if needed)
  const connectBtn = page.locator('text=Connect with Strava').first();
  if (await connectBtn.isVisible()) {
    console.log('Clicking "Connect with Strava"…');
    await connectBtn.click();

    // Fill in Strava login form
    await page.fill('#email', STRAVA_EMAIL);
    await page.fill('#password', STRAVA_PASSWORD);
    await page.click('button[type=submit]');

    // Approve the OAuth authorisation screen if it appears
    const authorizeBtn = page.locator('button[value=authorize]');
    if (await authorizeBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await authorizeBtn.click();
    }

    await page.waitForURL(`${APP_URL}/**`, { timeout: 15_000 });
    console.log('Logged in, back on app.');
  } else {
    console.log('Already logged in (no connect button visible).');
  }

  // Wait for activities to load, then click the weather button on the first one
  console.log('Waiting for activity list…');
  await page.waitForSelector('[data-testid="activity"], .activity-item, li.activity', { timeout: 20_000 })
    .catch(() => console.log('(Could not find activity list selector — update the selector above)'));

  const weatherBtn = page.locator('button:has-text("Værvarsling"), button:has-text("Weather"), button:has-text("Vær")').first();
  if (await weatherBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
    console.log('Clicking weather button…');
    await weatherBtn.click();
    // Wait up to 30 s for the weather requests to finish
    await page.waitForTimeout(30_000);
  } else {
    console.log('Weather button not found — please interact manually in the browser window.');
    console.log('Waiting 60 s for manual interaction…');
    await page.waitForTimeout(60_000);
  }

  await browser.close();

  console.log('\n--- RESULT ---');
  if (preflightCount === 0 && directGetCount > 0) {
    console.log(`PASS ✓  ${directGetCount} direct GET request(s) to api.met.no — no CORS preflights.`);
  } else if (preflightCount > 0) {
    console.log(`FAIL ✗  ${preflightCount} CORS OPTIONS preflight(s) fired. The User-Agent header fix may not be deployed.`);
  } else {
    console.log('No api.met.no requests observed — did the weather fetch trigger? Try manual interaction.');
  }
})();
