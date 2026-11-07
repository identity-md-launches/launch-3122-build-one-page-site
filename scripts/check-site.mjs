import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import AxeBuilder from '@axe-core/playwright';
import { startPreview, playwright } from './preview.mjs';

const { chromium, webkit } = await playwright();
const preview = await startPreview();
const browser = await chromium.launch({ headless: true });
const results = [];
const output = 'test/scratch/validation';
await mkdir(output, { recursive: true });
const snapshot = JSON.parse(await readFile('src/swarm-snapshot.json', 'utf8'));
const format = (value) => new Intl.NumberFormat('en-US').format(value);
const api = { swarm: 'https://api.imd.fun/swarm', models: 'https://api.flop.network/v1/models' };

async function test(name, run, optional = false) {
  const started = Date.now();
  try { const detail = await run(); results.push({ name, passed: true, milliseconds: Date.now() - started, detail }); console.log(`PASS ${name}`); }
  catch (error) {
    if (optional && /Executable doesn't exist/.test(error.message)) {
      results.push({ name, passed: null, skipped: true, reason: 'WebKit browser executable is unavailable. Chromium checks ran separately.' });
      console.log(`SKIP ${name}: WebKit executable unavailable`);
    } else { results.push({ name, passed: false, error: error.message }); console.log(`FAIL ${name}: ${error.message}`); }
  }
}

async function pageWith(mode, engine = browser) {
  const context = await engine.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  const page = await context.newPage();
  const requests = { swarm: 0, models: 0 };
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  for (const [key, url] of Object.entries(api)) {
    await page.route(url, async (route) => {
      requests[key]++;
      const behavior = typeof mode === 'string' ? mode : mode[key];
      if (behavior === 'timeout') return;
      if (behavior === 'network') return route.abort('failed');
      if (behavior === 'http') return route.fulfill({ status: 503, body: 'Unavailable' });
      if (behavior === 'malformed') return route.fulfill({ json: { health: { agentsOnline: -1, seatsEnrolled: 'many' }, data: [{ missing: true }] } });
      if (behavior === 'json') return route.fulfill({ status: 200, contentType: 'application/json', body: 'not json' });
      const data = key === 'swarm' ? { health: { agentsOnline: 2345, seatsEnrolled: 4567 } }
        : { data: [{ id: 'model-one' }, { id: 'model-two' }], total_count: 2 };
      if (behavior === 'empty') return route.fulfill({ json: key === 'swarm' ? { health: { agentsOnline: 0, seatsEnrolled: 0 } } : { data: [], total_count: 0 } });
      if (behavior === 'large') return route.fulfill({ json: key === 'swarm' ? { health: { agentsOnline: Number.MAX_SAFE_INTEGER, seatsEnrolled: Number.MAX_SAFE_INTEGER } } : { data: [], total_count: Number.MAX_SAFE_INTEGER } });
      return route.fulfill({ json: data });
    });
  }
  await page.goto(preview.url);
  await page.waitForFunction(() => document.querySelector('[role="status"]')?.textContent.includes('ready'), { timeout: 12000 });
  await page.evaluate(() => document.fonts.ready);
  return { page, context, requests, errors };
}

async function counts(page) {
  return Promise.all(['agents', 'seats', 'models'].map((name) => page.getByTestId(`${name}-count`).textContent()));
}

try {
  await test('Live counts and exactly one request per endpoint', async () => {
    const { page, context, requests, errors } = await pageWith('success');
    try {
      assert.deepEqual(await counts(page), ['2,345', '4,567', '2']);
      await page.getByRole('link', { name: 'See the worker change' }).click();
      assert.equal(new URL(page.url()).hash, '#worker');
      assert.ok(await page.locator('#worker').evaluate((el) => Math.abs(el.getBoundingClientRect().top - 32) < 3));
      await page.getByRole('link', { name: 'Open questions', exact: true }).click();
      assert.equal(new URL(page.url()).hash, '#questions');
      await page.getByRole('link', { name: 'Back to top' }).click();
      assert.equal(new URL(page.url()).hash, '#main');
      assert.deepEqual(requests, { swarm: 1, models: 1 });
      assert.deepEqual(errors, []);
      return 'Live values, three anchor actions, no reruns or script errors';
    } finally { await context.close(); }
  });

  for (const mode of ['http', 'network', 'malformed', 'json', 'timeout']) {
    await test(`Dated fallbacks after ${mode} failure`, async () => {
      const { page, context, requests } = await pageWith(mode);
      try {
        assert.deepEqual(await counts(page), [format(snapshot.agentsOnline), format(snapshot.seatsEnrolled), '1']);
        assert.equal(await page.getByText('Snapshot · 7 Nov 2026', { exact: true }).count(), 2);
        assert.equal(await page.getByText('Report · 7 Nov 2026', { exact: true }).count(), 1);
        assert.equal(await page.getByText('Live on load', { exact: true }).count(), 0);
        assert.deepEqual(requests, { swarm: 1, models: 1 });
        return 'Complete snapshots with dates, correct sources, no retry';
      } finally { await context.close(); }
    });
  }

  await test('Independent endpoint state and valid zero counts', async () => {
    for (const mode of [{ swarm: 'success', models: 'http' }, { swarm: 'http', models: 'success' }, 'empty']) {
      const { page, context } = await pageWith(mode);
      try {
        const expected = mode === 'empty' ? ['0', '0', '0'] : mode.swarm === 'success' ? ['2,345', '4,567', '1'] : [format(snapshot.agentsOnline), format(snapshot.seatsEnrolled), '2'];
        assert.deepEqual(await counts(page), expected);
      } finally { await context.close(); }
    }
    return 'Either source can fail independently; zero remains a live value';
  });

  await test('Telegram and report primary destinations', async () => {
    const { page, context } = await pageWith('http');
    try {
      const telegram = 'https://imd.fun/telegram/';
      const report = 'https://github.com/Identity-md/research/blob/main/jobs/4bb06f36-c8da-4925-8e4d-378ed76cff68/files/artifacts/report.md';
      await page.route(telegram, (route) => route.fulfill({ body: '<h1>Telegram destination reached</h1>', contentType: 'text/html' }));
      await page.getByRole('link', { name: 'Say you’d opt in' }).click();
      await page.waitForURL(telegram);
      await page.goBack();
      await page.getByRole('link', { name: 'Say so in Telegram' }).click();
      await page.waitForURL(telegram);
      await page.goBack();
      await page.route(`${report}*`, (route) => route.fulfill({ body: '<h1>Report destination reached</h1>', contentType: 'text/html' }));
      await page.getByRole('link', { name: 'Read the CLI spec' }).click();
      await page.waitForURL(`${report}#f-stopgap-imd-flop-companion-cli-spec-i`);
      return 'Both Telegram calls to action and CLI anchor navigate to the supplied destinations; external services mocked';
    } finally { await context.close(); }
  });

  await test('Largest accepted counts reflow at narrow widths', async () => {
    const { page, context } = await pageWith('large');
    try {
      assert.deepEqual(await counts(page), Array(3).fill(format(Number.MAX_SAFE_INTEGER)));
      for (const width of [320, 390, 1440]) {
        await page.setViewportSize({ width, height: 844 });
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `large count overflow at ${width}`);
      }
      return 'Maximum safe integer counts stay complete and wrap without horizontal scroll';
    } finally { await context.close(); }
  });

  await test('Responsive export, metadata, links, local assets and copy', async () => {
    const { page, context, errors } = await pageWith('http');
    try {
      const localFailures = [];
      page.on('response', (response) => { if (response.url().startsWith(preview.url) && response.status() >= 400) localFailures.push(response.url()); });
      const widths = [320, 390, 560, 784, 1040, 1440];
      for (const width of widths) {
        await page.setViewportSize({ width, height: 844 });
        await page.evaluate(() => window.scrollTo(0, 0));
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `overflow at ${width}`);
        const cta = await page.getByRole('link', { name: 'Say you’d opt in' }).boundingBox();
        assert.ok(cta && cta.y + cta.height < 844, `primary action below fold at ${width}`);
        await page.screenshot({ path: `${output}/${width}.png`, fullPage: width === 1440 || width === 390 });
      }
      const audit = await page.evaluate(async () => {
        const brokenAnchors = [...document.querySelectorAll('a[href^="#"]')].filter((a) => !document.getElementById(a.getAttribute('href').slice(1))).map((a) => a.getAttribute('href'));
        const metadata = ['description', 'og:title', 'og:image'].map((name) => document.querySelector(`meta[name="${name}"],meta[property="${name}"]`)?.getAttribute('content'));
        const image = document.querySelector('meta[property="og:image"]').content;
        const imageResponse = await fetch(image);
        const favicon = await fetch(document.querySelector('link[rel="icon"]').getAttribute('href'));
        const fontFaces = [...document.fonts].filter((font) => font.status === 'loaded').map((font) => `${font.family} ${font.weight}`);
        return { brokenAnchors, metadata, socialStatus: imageResponse.status, faviconStatus: favicon.status, title: document.title, prohibitedDashes: /[\u2013\u2014]/.test(document.body.innerText), h1s: document.querySelectorAll('h1').length, forms: document.querySelectorAll('form,input').length, fontFaces };
      });
      assert.deepEqual(audit.brokenAnchors, []);
      assert.ok(audit.metadata.every(Boolean));
      assert.equal(audit.socialStatus, 200);
      assert.equal(audit.faviconStatus, 200);
      assert.equal(audit.prohibitedDashes, false);
      assert.equal(audit.h1s, 1);
      assert.equal(audit.forms, 0);
      assert.ok(audit.fontFaces.some((face) => face.includes('Geist Mono')));
      assert.deepEqual(localFailures, []);
      assert.deepEqual(errors, []);
      return { widths, audit };
    } finally { await context.close(); }
  });

  await test('Keyboard, visible focus, semantic accessibility and text enlargement', async () => {
    const { page, context } = await pageWith('http');
    try {
      await page.keyboard.press('Tab');
      assert.equal(await page.evaluate(() => document.activeElement.textContent), 'Skip to content');
      await page.screenshot({ path: `${output}/focus-skip.png` });
      await page.keyboard.press('Enter');
      assert.equal(await page.evaluate(() => document.activeElement.id), 'main');
      await page.keyboard.press('Tab');
      assert.equal(await page.evaluate(() => document.activeElement.textContent), 'Say you’d opt in');
      const focus = await page.evaluate(() => ({ outline: getComputedStyle(document.activeElement).outlineStyle, width: getComputedStyle(document.activeElement).outlineWidth }));
      assert.equal(focus.outline, 'solid');
      assert.equal(focus.width, '2px');
      await page.screenshot({ path: `${output}/focus-primary.png` });
      const scan = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
      await writeFile(`${output}/axe.json`, JSON.stringify({ violations: scan.violations, passes: scan.passes.map((p) => p.id), incomplete: scan.incomplete.map((p) => ({ id: p.id, impact: p.impact })) }, null, 2));
      assert.deepEqual(scan.violations.map((v) => ({ id: v.id, impact: v.impact })), []);
      await page.setViewportSize({ width: 390, height: 844 });
      await page.addStyleTag({ content: 'html { font-size: 200% !important; }' });
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'overflow with 200% text');
      await page.screenshot({ path: `${output}/text-200.png`, fullPage: true });
      return { axeViolations: scan.violations.length, axePasses: scan.passes.length, focus, textEnlargement: '200% at 390, no horizontal scroll; not native browser zoom' };
    } finally { await context.close(); }
  });

  await test('WebKit navigation and fallback rendering', async () => {
    const safari = await webkit.launch({ headless: true });
    try {
      const { page, context, errors } = await pageWith('http', safari);
      try {
        await page.getByRole('link', { name: 'See the worker change' }).click();
        assert.equal(new URL(page.url()).hash, '#worker');
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
        assert.deepEqual(await counts(page), [format(snapshot.agentsOnline), format(snapshot.seatsEnrolled), '1']);
        assert.deepEqual(errors, []);
        await page.screenshot({ path: `${output}/webkit-worker.png` });
        return 'WebKit at 390: anchor action, fallback counts, no overflow or script errors';
      } finally { await context.close(); }
    } finally { await safari.close(); }
  }, true);
} finally {
  await browser.close();
  await preview.close();
}
await writeFile(`${output}/results.json`, JSON.stringify(results, null, 2) + '\n');
console.log(JSON.stringify(results, null, 2));
if (results.some((result) => result.passed === false)) process.exitCode = 1;
