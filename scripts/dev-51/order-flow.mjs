// DEV-51 end-to-end in real Chrome: configurator + visualizer order modals → local netlify dev → TEST Drive folder.
// Places TWO real test orders (two [TEST] notification emails).
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync } from 'node:fs';
const require = createRequire('C:/Users/rohan/Claude-Code/Audial-Website/design-references/assets/3d-models/');
const puppeteer = require('puppeteer-core');

const SITE = 'C:/Users/rohan/Claude-Code/Audial-Website';
const OUT = process.argv[2];
const BASE = 'http://localhost:8888';
let failed = 0;
const ok = (label, cond, extra = '') => { console.log(`[${cond ? 'OK  ' : 'FAIL'}] ${label}${extra ? ` — ${extra}` : ''}`); if (!cond) failed++; };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const { createDrive } = await import(`file:///${SITE}/netlify/lib/drive.mjs`);
const tok = JSON.parse(readFileSync(`${SITE}/website/google-oauth-token.json`, 'utf8'));
const drive = createDrive({ clientId: tok.client_id, clientSecret: tok.client_secret, refreshToken: tok.refresh_token });

const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('response', (r) => { if (r.status() >= 400 && !/favicon/.test(r.url()) && !/\/api\/order\//.test(r.url())) errors.push(`HTTP ${r.status()} ${r.url()}`); });

// Request log + switchable interception for /api/order/*
const log = [];
let mode = 'pass';            // 'pass' | 'panel500' | 'fakeFirstPanel'
let fakedOnce = false;
await page.setRequestInterception(true);
page.on('request', (req) => {
  const m = req.url().match(/\/api\/order\/(start|panel|finish)$/);
  if (!m) return req.continue();
  if (m[1] === 'panel' && mode === 'panel500') { log.push('panel:500(fake)'); return req.respond({ status: 500, contentType: 'application/json', body: '{"success":false,"error":"x"}' }); }
  if (m[1] === 'panel' && mode === 'fakeFirstPanel' && !fakedOnce) { fakedOnce = true; log.push('panel:200(fake, not uploaded)'); return req.respond({ status: 200, contentType: 'application/json', body: '{"success":true,"index":0}' }); }
  log.push(m[1]);
  req.continue();
});
const responses = {};
page.on('response', async (r) => {
  const m = r.url().match(/\/api\/order\/(start|finish)$/);
  if (m && r.request().method() === 'POST') { try { (responses[m[1]] ||= []).push({ status: r.status(), body: await r.json() }); } catch {} }
});

async function shot(name) { if (OUT) await page.screenshot({ path: `${OUT}/${name}.png` }); }

// ---------------------------------------------------------------------------
console.log('\n=== CONFIGURATOR ===');
await page.goto(`${BASE}/configurator.html`, { waitUntil: 'networkidle0' });
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: 'networkidle0' });

// Three real designs through the real upload path; photo-like noise so PNGs have realistic weight.
const designs = [
  { size: '4x2', orient: 'horizontal', wood: 'light', wrap: 'half', img: [2400, 1600] },
  { size: '2x2', wood: 'dark', wrap: 'full', img: [1600, 1600], rotate: 90, flipH: true, zoom: 1.2 },
  { size: 'custom', custom: [3, 5], orient: 'vertical', wood: 'light', wrap: 'full', img: [1500, 2400] },
];
for (const d of designs) {
  await page.evaluate(async (d) => {
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    resetCurrentPanel();
    if (d.size === 'custom') { $('pickerW').value = d.custom[0]; $('pickerH').value = d.custom[1]; $('pickerCreate').click(); }
    else document.querySelector(`.size-card[data-size="${d.size}"]`).click();
    await sleep(300);
    if (d.orient) { const b = document.querySelector(`.orient-btn[data-orient="${d.orient}"]`); if (b && !b.classList.contains('active')) b.click(); await sleep(300); }
    const [W, H] = d.img, c = document.createElement('canvas'); c.width = W; c.height = H;
    const g = c.getContext('2d'), im = g.createImageData(W, H);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const k = (y * W + x) * 4;
      im.data[k] = (x / W) * 255 + Math.random() * 60; im.data[k + 1] = (y / H) * 255 + Math.random() * 60; im.data[k + 2] = 120 + Math.random() * 90; im.data[k + 3] = 255; }
    g.putImageData(im, 0, 0);
    const blob = await new Promise((r) => c.toBlob(r, 'image/png'));
    const dt = new DataTransfer(); dt.items.add(new File([blob], 'photo.png', { type: 'image/png' }));
    fileInput.files = dt.files; fileInput.dispatchEvent(new Event('change'));
    for (let t = 0; t < 80 && !currentPanel.image; t++) await sleep(100);
    await sleep(200);
    if (d.rotate) { imgRotate = d.rotate; imgFlipH = !!d.flipH; fitImageToPanel(); }
    if (d.zoom) { imgZoom *= d.zoom; recenterImage(); }
    clampImagePosition(); applyImageTransform();
    currentPanel.woodVarnish = d.wood; currentPanel.fabricWrap = d.wrap;
    cart.push(panelToCartItem(currentPanel)); saveCart(); updateCart();
  }, d);
}
const cartJson = await page.evaluate(() => localStorage.getItem('acousticCart'));
ok('3 designs saved to acousticCart', JSON.parse(cartJson).length === 3);

// Step 1 guard: a design without artwork blocks the order.
await page.evaluate(() => { const c = JSON.parse(localStorage.getItem('acousticCart')); c.push({ ...c[0], id: 999, image: null }); localStorage.setItem('acousticCart', JSON.stringify(c)); });
await page.click('[data-open-checkout]');
await sleep(200);
let s1 = await page.evaluate(() => ({ disabled: $('checkoutContinueBtn').disabled, msg: document.querySelector('.checkout-cart-problem')?.textContent || '' }));
ok('step 1: design without artwork disables Continue', s1.disabled && /Panel 4 has no artwork/.test(s1.msg), s1.msg);
await shot('cfg-step1-missing-art');
await page.evaluate((j) => { closeCheckoutModal(); localStorage.setItem('acousticCart', j); }, cartJson);
await page.click('[data-open-checkout]');
await sleep(200);
s1 = await page.evaluate(() => ({ disabled: $('checkoutContinueBtn').disabled, problem: !!document.querySelector('.checkout-cart-problem') }));
ok('step 1: complete cart enables Continue', !s1.disabled && !s1.problem);
await page.click('#checkoutContinueBtn');

// Validation
await page.click('#checkoutSubmitBtn');
await sleep(100);
let inv = await page.evaluate(() => [...document.querySelectorAll('#checkoutForm .checkout-field.invalid')].map((e) => e.id));
ok('empty submit flags the 6 required fields', inv.length === 6, inv.join(','));
ok('no request sent for an invalid form', log.length === 0, log.join(','));
await shot('cfg-step2-errors');
await page.focus('#coPhone');
ok('phone gets +91 on focus', (await page.$eval('#coPhone', (e) => e.value)) === '+91 ');
await page.type('#coName', 'DEV-51 Browser Test');
await page.type('#coEmail', 'e2e-test@example');
await page.type('#coPhone', '77180 49186');
await page.type('#coAddress', 'Flat');   // "Flat\nMumbai 400001" = 19 chars, one short
await page.type('#coCity', 'Mumbai');
await page.type('#coPincode', '400001');
await page.click('#checkoutSubmitBtn');
await sleep(100);
inv = await page.evaluate(() => [...document.querySelectorAll('#checkoutForm .checkout-field.invalid')].map((e) => `${e.id}:${e.querySelector('.field-error').textContent}`));
ok('bad email + too-short address are flagged', inv.length === 2 && /email/i.test(inv[0]) && /full delivery address/.test(inv[1]), inv.join(' | '));
await page.evaluate(() => { $('coEmail').value = 'e2e-test@example.com'; $('coAddress').value = 'DEV-51 browser test order, not a real delivery\nSV Road'; });
await page.type('#coDeliveryNotes', 'Automated test — safe to delete');
await page.type('#coInstallNotes', 'None needed');

// --- Attempt 1: every panel upload fails (faked 500; never reaches the server, so no alert email)
mode = 'panel500';
await page.click('#checkoutSubmitBtn');
await sleep(150);
const busyState = await page.evaluate(() => ({ busy: AudialOrder.isBusy(), close: $('checkoutClose').disabled, input: $('coName').disabled, progress: !$('checkoutProgress').hidden, label: $('checkoutSubmitBtn').textContent }));
ok('while submitting: busy, close + inputs disabled, progress shown', busyState.busy && busyState.close && busyState.input && busyState.progress && busyState.label === 'Submitting…', JSON.stringify(busyState));
await page.keyboard.press('Escape');
ok('Escape does not close the modal mid-submit', await page.evaluate(() => checkoutModal.classList.contains('open')));
await shot('cfg-busy');
await page.waitForFunction(() => !AudialOrder.isBusy(), { timeout: 90000 });
const fail1 = await page.evaluate(() => ({ err: $('checkoutSubmitError').style.display === 'block' ? $('checkoutSubmitError').textContent : '', enabled: !$('checkoutSubmitBtn').disabled, open: checkoutModal.classList.contains('open'), cart: JSON.parse(localStorage.getItem('acousticCart')).length }));
ok('upload failure: visible error with support email', /Something went wrong/.test(fail1.err) && /support@audial\.in/.test(fail1.err), fail1.err);
ok('upload failure: submit re-enabled, modal open, cart kept (3)', fail1.enabled && fail1.open && fail1.cart === 3);
ok('upload failure: one start, each panel tried twice (retry once)', log.filter((x) => x === 'start').length === 1 && log.filter((x) => x.startsWith('panel:500')).length === 6, log.join(','));
await page.mouse.move(10, 10);
await sleep(400);
ok('error state: submit button really enabled (opacity 1)', await page.$eval('#checkoutSubmitBtn', (b) => !b.disabled && getComputedStyle(b).opacity === '1'));
await shot('cfg-error');

// --- Attempt 2: resume the same order; one panel "succeeds" without uploading → finish 409 → re-upload
mode = 'fakeFirstPanel';
log.length = 0;
const t0 = Date.now();
const progressSeen = [];
const poll = setInterval(async () => { try { const t = await page.$eval('#checkoutProgressText', (e) => e.textContent); if (progressSeen.at(-1) !== t) progressSeen.push(t); } catch {} }, 150);
await page.click('#checkoutSubmitBtn');
await page.waitForFunction(() => !AudialOrder.isBusy(), { timeout: 120000 });
clearInterval(poll);
const secs = ((Date.now() - t0) / 1000).toFixed(1);
const ref = await page.$eval('#checkoutOrderRef', (e) => e.textContent).catch(() => '');
const startRef = responses.start?.[0]?.body?.orderRef;
ok('retry reuses the started order (no second start)', !log.includes('start'), log.join(','));
ok('409 recovery: finish called twice, missing panel re-uploaded', log.filter((x) => x === 'finish').length === 2 && log.filter((x) => x === 'panel').length === 3, log.join(','));
ok('finish responses were 409 then 200', JSON.stringify((responses.finish || []).map((r) => r.status)) === '[409,200]', JSON.stringify((responses.finish || []).map((r) => r.status)));
ok('success screen shows the ORD reference from the server', /^ORD-[a-z0-9]{6}$/.test(ref) && ref === startRef, `${ref} (server ${startRef}) in ${secs}s`);
console.log('       progress:', progressSeen.join(' → '));
const succ = await page.evaluate(() => ({ msg: $('checkoutSuccessMsg').textContent, visible: $('checkoutSuccess').style.display !== 'none' }));
ok('success copy promises proof + payment link at the customer email', succ.visible && /e2e-test@example\.com/.test(succ.msg) && /print proof and payment link/.test(succ.msg), succ.msg);
await shot('cfg-success');

// Drive
const folder = await drive.findChildByName(tok.folders.test, ref);
ok(`Drive: folder ${ref} finished (INCOMPLETE suffix gone)`, !!folder);
if (folder) {
  const names = (await drive.listChildNames(folder.id)).sort();
  const pngOrJpg = (stem) => names.some((n) => n === `${stem}.png` || n === `${stem}.jpg`);
  ok('Drive: order-details.txt + 3 correctly named panel files, nothing else',
    names.length === 4 && names.includes('order-details.txt') &&
    pngOrJpg(`${ref}_panel-1_4x2h-light-halfwrap`) && pngOrJpg(`${ref}_panel-2_2x2-dark-fullwrap`) && pngOrJpg(`${ref}_panel-3_custom-3x5-light-fullwrap`),
    names.join(', '));
  console.log(`       https://drive.google.com/drive/folders/${folder.id}`);
}

// Clear designs
await page.click('#checkoutNewDesignBtn');
await sleep(300);
const cleared = await page.evaluate(() => ({ ls: localStorage.getItem('acousticCart'), cart: cart.length, open: checkoutModal.classList.contains('open') }));
ok('"Clear Designs & Start New" empties the cart and closes the modal', !cleared.ls && cleared.cart === 0 && !cleared.open, JSON.stringify(cleared));

// Mobile layout of step 2
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
await page.evaluate((j) => localStorage.setItem('acousticCart', j), cartJson);
await page.reload({ waitUntil: 'networkidle0' });
await page.evaluate(() => { openCheckoutModal(); showCheckoutStep(2); $('checkoutSubmitBtn').click(); });
await sleep(200);
const mob = await page.evaluate(() => ({ overflow: document.querySelector('.checkout-panel').scrollWidth > document.querySelector('.checkout-panel').clientWidth }));
ok('mobile 390px: no horizontal overflow in the order form', !mob.overflow);
await shot('cfg-mobile-step2');
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });

// ---------------------------------------------------------------------------
console.log('\n=== ROOM VISUALIZER ===');
mode = 'pass'; log.length = 0; responses.start = []; responses.finish = [];
await page.goto(`${BASE}/room-visualizer.html`, { waitUntil: 'networkidle0' });
await page.evaluate((j) => localStorage.setItem('acousticCart', JSON.stringify([JSON.parse(j)[2]])), cartJson);   // the custom 3x5
await page.reload({ waitUntil: 'networkidle0' });
await page.evaluate(() => document.querySelector('[data-open-checkout]').click());
await sleep(200);
const vs1 = await page.evaluate(() => ({ name: document.querySelector('.checkout-item-name')?.textContent, disabled: $('checkoutContinueBtn').disabled }));
ok('visualizer step 1: custom size labelled properly, Continue enabled', vs1.name === '3×5 ft Custom Panel' && !vs1.disabled, vs1.name);
await shot('viz-step1');
await page.click('#checkoutContinueBtn');
await page.evaluate(() => {
  $('coName').value = 'DEV-51 Visualizer Test'; $('coEmail').value = 'e2e-test@example.com'; $('coPhone').value = '+91 77180 49186';
  $('coAddress').value = 'DEV-51 visualizer test order, not a real delivery'; $('coCity').value = 'Mumbai'; $('coPincode').value = '400001';
});
const v0 = Date.now();
await page.click('#checkoutSubmitBtn');
await page.waitForFunction(() => !AudialOrder.isBusy(), { timeout: 120000 });
const vref = await page.$eval('#checkoutOrderRef', (e) => e.textContent).catch(() => '');
const verr = await page.$eval('#checkoutSubmitError', (e) => e.style.display === 'block' ? e.textContent : '');
ok('visualizer order succeeds with an ORD reference', /^ORD-[a-z0-9]{6}$/.test(vref), `${vref || verr} in ${((Date.now() - v0) / 1000).toFixed(1)}s; requests ${log.join(',')}`);
await shot('viz-success');
const vfolder = vref && await drive.findChildByName(tok.folders.test, vref);
if (vfolder) {
  const names = (await drive.listChildNames(vfolder.id)).sort();
  ok('Drive: visualizer order has details + 1 custom panel file', names.length === 2 && names.some((n) => n.startsWith(`${vref}_panel-1_custom-3x5-light-fullwrap.`)), names.join(', '));
} else ok('Drive: visualizer order folder exists', false);

await Promise.all([page.waitForNavigation({ waitUntil: 'networkidle0' }), page.click('#checkoutNewDesignBtn')]);
ok('visualizer "Clear Designs & Start New" goes to the configurator with an empty cart',
  page.url().endsWith('/configurator.html') && !(await page.evaluate(() => localStorage.getItem('acousticCart'))), page.url());

ok('no page errors', errors.length === 0, errors.join(' | '));
await browser.close();
console.log(`\n${failed ? `${failed} FAILED` : 'ALL PASSED'} — orders ${ref}, ${vref}`);
process.exit(failed ? 1 : 0);
