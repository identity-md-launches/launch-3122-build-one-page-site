import { playwright } from './preview.mjs';

const { chromium } = await playwright();
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  await page.setContent(`<!doctype html><html lang="en"><style>
    *{box-sizing:border-box}body{margin:0;background:#111310;color:#edf0e7;font-family:Arial,sans-serif}
    main{position:relative;width:1200px;height:630px;padding:60px 72px}header{display:flex;justify-content:space-between;align-items:center;padding-bottom:28px;border-bottom:1px solid #373e30;font-size:20px;color:#b6bdaf}.brand{font-size:32px;font-weight:600;color:#edf0e7}h1{font:400 84px/1.12 monospace;letter-spacing:-5px;margin:66px 0 22px;max-width:840px}h1 span{color:#d8f59a}p{font-size:25px;color:#b6bdaf;line-height:1.5;max-width:740px;margin:0}.bottom{position:absolute;bottom:54px;left:72px;right:72px;display:flex;justify-content:space-between;align-items:center;font-size:18px;color:#929b89}.arrow{color:#111310;background:#d8f59a;width:56px;height:56px;text-align:center;border-radius:3px;font-size:36px;line-height:56px}
    </style><main><header><span class="brand">imd.</span><span>A worker proposal · 7 Nov 2026</span></header><h1>FLOP, by choice<span>.</span></h1><p>An opt in provider for the IMD worker.<br>One identity per seat. A receipt beside every job.</p><div class="bottom"><span>Read the proposal. Join the discussion.</span><span class="arrow">↗</span></div></main></html>`);
  await page.screenshot({ path: 'public/social.png' });
  console.log('Wrote public/social.png: 1200 × 630');
} finally { await browser.close(); }
