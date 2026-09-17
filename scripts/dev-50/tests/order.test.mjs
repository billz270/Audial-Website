// DEV-50 order API tests. Run: node --test scripts/dev-50/tests/
// In-memory fakes for Drive, email and Blobs — no network.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createOrderApi } from '../../../netlify/lib/order.mjs';
import { createRateLimiter } from '../../../netlify/lib/rate-limit.mjs';
import { signToken, verifyToken } from '../../../netlify/lib/token.mjs';
import { validateOrder, panelFileStem, sniffImage, newOrderRef, orderDetailsText } from '../../../netlify/lib/validate.mjs';

const SECRET = 'x'.repeat(40);
const ROOT = 'root-folder';
const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3]);
const JPG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 9, 9]);

const goodOrder = () => ({
  name: 'Asha Rao',
  email: 'Asha@Example.com',
  phone: '+91 98765-43210',
  address: '12 Carter Road, Bandra West, Mumbai 400050',
  deliveryNotes: 'Ring twice',
  panels: [
    { size: '2x2', orientation: 'horizontal', wood: 'light', wrap: 'half', quantity: 2 },
    { size: '4x2', orientation: 'horizontal', wood: 'dark', wrap: 'full', quantity: 1 },
  ],
});

// --- fakes -------------------------------------------------------------------
function fakeDrive() {
  const files = new Map(); // id → { id, name, parent, data, folder, trashed }
  let n = 0;
  const calls = [];
  const fail = {}; // method name → Error to throw
  const guard = (m) => { calls.push(m); if (fail[m]) throw fail[m]; };
  const add = (f) => { const id = `id${++n}`; files.set(id, { id, trashed: false, ...f }); return { id, name: f.name }; };
  return {
    files, calls, fail,
    byParent: (p) => [...files.values()].filter((f) => f.parent === p),
    async createFolder(name, parent) { guard('createFolder'); return add({ name, parent, folder: true }); },
    async uploadFile({ name, parentId, data }) { guard('uploadFile'); return add({ name, parent: parentId, data }); },
    async replaceFileContent(id, mime, data) { guard('replaceFileContent'); files.get(id).data = data; return { id }; },
    async findChildByName(parent, name) { guard('findChildByName'); return [...files.values()].find((f) => f.parent === parent && f.name === name && !f.trashed) ?? null; },
    async listChildNames(parent) { guard('listChildNames'); return [...files.values()].filter((f) => f.parent === parent && !f.trashed).map((f) => f.name); },
    async getFile(id) { guard('getFile'); const f = files.get(id); if (!f) throw Object.assign(new Error('Get file: HTTP 404'), { name: 'DriveError', status: 404 }); return f; },
    async rename(id, name) { guard('rename'); files.get(id).name = name; return { id, name }; },
  };
}

function fakeMailer() {
  const sent = [];
  const m = { sent, failWith: null, async send(msg) { if (m.failWith) throw m.failWith; sent.push(msg); return { id: 'e1' }; } };
  return m;
}

function fakeStore() {
  const data = new Map();
  const s = { data, broken: false,
    async get(k) { if (s.broken) throw new Error('blobs down'); return data.get(k) ?? null; },
    async setJSON(k, v) { if (s.broken) throw new Error('blobs down'); data.set(k, structuredClone(v)); } };
  return s;
}

const quietLog = () => { const lines = []; return { lines, error: (l) => lines.push(l), info: () => {} }; };

function setup({ clock = 1_800_000_000_000 } = {}) {
  const drive = fakeDrive();
  const mailer = fakeMailer();
  const store = fakeStore();
  const log = quietLog();
  const time = { t: clock };
  const api = createOrderApi({
    drive, mailer, secret: SECRET, rootFolderId: ROOT, log, now: () => time.t,
    rateLimiter: createRateLimiter({ store, secret: SECRET, now: () => time.t }),
  });
  return { api, drive, mailer, store, log, time };
}

const TEST_INFO = { ip: '203.0.113.5', isProduction: false };

const jsonReq = (body, type = 'application/json') => new Request('http://x/api', {
  method: 'POST', headers: { 'content-type': type }, body: typeof body === 'string' ? body : JSON.stringify(body),
});

function panelReq(token, index, bytes, filename = 'p.png') {
  const fd = new FormData();
  if (token !== undefined) fd.set('token', token);
  if (index !== undefined) fd.set('index', String(index));
  if (bytes) fd.set('image', new Blob([bytes]), filename);
  return new Request('http://x/api', { method: 'POST', body: fd });
}

async function startOk(ctx, order = goodOrder()) {
  const res = await ctx.api.start(jsonReq(order), TEST_INFO);
  const body = await res.json();
  assert.equal(res.status, 200, JSON.stringify(body));
  return body;
}

// --- validation / naming -----------------------------------------------------
test('validateOrder accepts a good order and normalises it', () => {
  const v = validateOrder({ ...goodOrder(), name: 'Asha\r\nBcc: evil@x.com' });
  assert.equal(v.ok, true);
  assert.equal(v.order.email, 'asha@example.com');
  assert.equal(v.order.name, 'Asha Bcc: evil@x.com'); // newline gone → cannot inject into a subject
  assert.equal(v.order.installationNotes, '');
});

test('validateOrder rejects each bad field with a message', () => {
  const cases = [
    [{ name: '' }, /Name is required/],
    [{ email: 'nope' }, /Email address is not valid/],
    [{ phone: '123' }, /Phone number is not valid/],
    [{ phone: 'call me' }, /Phone number is not valid/],
    [{ address: 'short' }, /at least 20/],
    [{ panels: [] }, /At least one panel/],
    [{ panels: Array(31).fill(goodOrder().panels[0]) }, /At most 30/],
    [{ panels: [{ size: '9x9', orientation: 'horizontal', wood: 'light', wrap: 'half' }] }, /Panel 1: unknown size/],
    [{ panels: [{ size: 'custom', width: 9, height: 2, orientation: 'horizontal', wood: 'light', wrap: 'half' }] }, /whole feet from 1 to 8/],
    [{ panels: [{ size: '2x2', orientation: 'horizontal', wood: 'teak', wrap: 'half' }] }, /wood must be/],
    [{ panels: [{ size: '2x2', orientation: 'horizontal', wood: 'light', wrap: 'half', quantity: 0 }] }, /quantity/],
  ];
  for (const [patch, re] of cases) {
    const v = validateOrder({ ...goodOrder(), ...patch });
    assert.equal(v.ok, false, JSON.stringify(patch));
    assert.match(v.errors.join(' | '), re);
  }
  assert.equal(validateOrder(null).ok, false);
  assert.equal(validateOrder([]).ok, false);
});

test('file names match the spec examples', () => {
  const p = (o) => ({ quantity: 1, width: null, height: null, ...o });
  assert.equal(panelFileStem('ORD-a7k9x3', p({ size: '2x2', orientation: 'horizontal', wood: 'light', wrap: 'half' }), 0), 'ORD-a7k9x3_panel-1_2x2-light-halfwrap');
  assert.equal(panelFileStem('ORD-a7k9x3', p({ size: '4x2', orientation: 'horizontal', wood: 'dark', wrap: 'full' }), 1), 'ORD-a7k9x3_panel-2_4x2h-dark-fullwrap');
  assert.equal(panelFileStem('ORD-a7k9x3', p({ size: '1x4', orientation: 'vertical', wood: 'dark', wrap: 'full' }), 2), 'ORD-a7k9x3_panel-3_1x4v-dark-fullwrap');
  assert.equal(panelFileStem('ORD-a7k9x3', p({ size: 'custom', width: 3, height: 5, orientation: 'vertical', wood: 'light', wrap: 'half' }), 3), 'ORD-a7k9x3_panel-4_custom-3x5-light-halfwrap');
});

test('order refs are ORD- + 6 lowercase alphanumerics and not repeating', () => {
  const refs = new Set(Array.from({ length: 2000 }, newOrderRef));
  for (const r of refs) assert.match(r, /^ORD-[a-z0-9]{6}$/);
  assert.equal(refs.size, 2000);
});

test('sniffImage trusts bytes, not names', () => {
  assert.equal(sniffImage(PNG).ext, 'png');
  assert.equal(sniffImage(JPG).ext, 'jpg');
  assert.equal(sniffImage(new Uint8Array([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50])).ext, 'webp');
  assert.equal(sniffImage(new TextEncoder().encode('<svg onload=alert(1)>')), null);
});

test('order-details.txt follows the spec layout', () => {
  const v = validateOrder(goodOrder());
  const txt = orderDetailsText('ORD-abc123', v.order, '2026-09-15T10:00:00.000Z');
  assert.match(txt, /^ORDER: ORD-abc123\nDATE: 2026-09-15T10:00:00.000Z\n\nCUSTOMER:\nName: Asha Rao\n/);
  assert.match(txt, /DELIVERY NOTES:\nRing twice\n/);
  assert.match(txt, /INSTALLATION NOTES:\nNone\n/);
  assert.match(txt, /1\. 2x2 ft, horizontal, light varnish, half wrap, qty 2\n2\. 4x2 ft, horizontal, dark varnish, full wrap, qty 1/);
  assert.match(txt, /TOTAL PANELS: 3 \(2 designs\)/);
});

// --- token -------------------------------------------------------------------
test('token: round-trips, rejects tampering, wrong secret and expiry', () => {
  const tok = signToken({ ref: 'ORD-aaaaaa', exp: 2000 }, SECRET);
  assert.equal(verifyToken(tok, SECRET, 1000).ref, 'ORD-aaaaaa');
  assert.equal(verifyToken(tok, SECRET, 2000), null, 'expired at exp');
  assert.equal(verifyToken(tok, 'y'.repeat(40), 1000), null, 'wrong secret');
  const [body, sig] = tok.split('.');
  const forged = Buffer.from(JSON.stringify({ ref: 'ORD-evil00', exp: 9e15 })).toString('base64url');
  assert.equal(verifyToken(`${forged}.${sig}`, SECRET, 1000), null, 'forged body');
  assert.equal(verifyToken(`${body}.${sig}x`, SECRET, 1000), null, 'bad sig');
  for (const junk of [undefined, '', 'abc', 'a.b.c', 42]) assert.equal(verifyToken(junk, SECRET, 1000), null);
});

// --- rate limit ----------------------------------------------------------------
test('rate limit: 5 per hour per IP, per-IP, expires, fails open, never stores raw IP', async () => {
  const store = fakeStore();
  const time = { t: 0 };
  const rl = createRateLimiter({ store, secret: SECRET, now: () => time.t });
  for (let i = 0; i < 5; i++) assert.equal((await rl.hit('1.1.1.1')).allowed, true);
  const blocked = await rl.hit('1.1.1.1');
  assert.equal(blocked.allowed, false);
  assert.equal(blocked.retryAfterSec, 3600);
  assert.equal((await rl.hit('2.2.2.2')).allowed, true, 'other IPs unaffected');
  time.t = 3600 * 1000 + 1;
  assert.equal((await rl.hit('1.1.1.1')).allowed, true, 'window slid');
  assert.ok([...store.data.keys()].every((k) => /^[0-9a-f]{64}$/.test(k)));
  store.broken = true;
  const origErr = console.error; console.error = () => {};
  try { assert.equal((await rl.hit('1.1.1.1')).allowed, true); } finally { console.error = origErr; }
});

// --- API: happy path -----------------------------------------------------------
test('happy path: start → panels → finish', async () => {
  const ctx = setup();
  const s = await startOk(ctx);
  assert.match(s.orderRef, /^ORD-[a-z0-9]{6}$/);
  assert.equal(s.panelCount, 2);

  const [folder] = ctx.drive.byParent(ROOT);
  assert.equal(folder.name, `${s.orderRef} (INCOMPLETE)`);
  const details = ctx.drive.byParent(folder.id).find((f) => f.name === 'order-details.txt');
  assert.match(details.data, /Name: Asha Rao/);
  assert.equal(ctx.mailer.sent.length, 0, 'no email before finish');

  for (const [i, bytes] of [[0, PNG], [1, JPG]]) {
    const r = await ctx.api.panel(panelReq(s.uploadToken, i, bytes), TEST_INFO);
    assert.equal(r.status, 200, await r.clone().text());
  }
  const names = ctx.drive.byParent(folder.id).map((f) => f.name).sort();
  assert.deepEqual(names, [
    `${s.orderRef}_panel-1_2x2-light-halfwrap.png`,
    `${s.orderRef}_panel-2_4x2h-dark-fullwrap.jpg`,
    'order-details.txt',
  ]);

  const f = await ctx.api.finish(jsonReq({ token: s.uploadToken }), TEST_INFO);
  assert.deepEqual(await f.json(), { success: true, orderRef: s.orderRef });
  assert.equal(folder.name, s.orderRef, 'INCOMPLETE suffix removed');
  assert.equal(ctx.mailer.sent.length, 1);
  const mail = ctx.mailer.sent[0];
  assert.equal(mail.subject, `[TEST] New Order: ${s.orderRef} — Asha Rao`);
  assert.equal(mail.replyTo, 'asha@example.com');
  assert.match(mail.text, new RegExp(`https://drive.google.com/drive/folders/${folder.id}`));
  assert.match(mail.text, /Panels: 3 \(2 designs\)/);
});

test('production context drops the [TEST] prefix', async () => {
  const ctx = setup();
  const s = await startOk(ctx, { ...goodOrder(), panels: [goodOrder().panels[0]] });
  await ctx.api.panel(panelReq(s.uploadToken, 0, PNG), TEST_INFO);
  await ctx.api.finish(jsonReq({ token: s.uploadToken }), { ...TEST_INFO, isProduction: true });
  assert.match(ctx.mailer.sent[0].subject, /^New Order: /);
});

// --- API: rejections that must NOT alert ---------------------------------------
test('start: wrong content type, bad JSON, invalid order → 4xx, nothing created, no email', async () => {
  const ctx = setup();
  assert.equal((await ctx.api.start(jsonReq(goodOrder(), 'text/plain'), TEST_INFO)).status, 415);
  assert.equal((await ctx.api.start(jsonReq('{nope'), TEST_INFO)).status, 400);
  const r = await ctx.api.start(jsonReq({ ...goodOrder(), email: 'bad' }), TEST_INFO);
  assert.equal(r.status, 400);
  assert.deepEqual((await r.json()).errors, ['Email address is not valid.']);
  assert.equal(ctx.drive.calls.length, 0);
  assert.equal(ctx.mailer.sent.length, 0);
});

test('start: 6th order from one IP in an hour → 429 with Retry-After, no alert', async () => {
  const ctx = setup();
  for (let i = 0; i < 5; i++) await startOk(ctx);
  const r = await ctx.api.start(jsonReq(goodOrder()), TEST_INFO);
  assert.equal(r.status, 429);
  assert.ok(Number(r.headers.get('retry-after')) > 0);
  assert.equal(ctx.mailer.sent.length, 0);
  assert.equal(ctx.drive.byParent(ROOT).length, 5);
});

test('start: invalid orders do not use up the rate limit', async () => {
  const ctx = setup();
  for (let i = 0; i < 10; i++) await ctx.api.start(jsonReq({ ...goodOrder(), phone: 'x' }), TEST_INFO);
  await startOk(ctx);
});

test('panel: bad token, bad index, missing image, non-image, wrong content type → 4xx, no alert', async () => {
  const ctx = setup();
  const s = await startOk(ctx);
  const cases = [
    [panelReq('forged.token', 0, PNG), 401],
    [panelReq(s.uploadToken, 2, PNG), 400],
    [panelReq(s.uploadToken, -1, PNG), 400],
    [panelReq(s.uploadToken, 0, null), 400],
    [panelReq(s.uploadToken, 0, new TextEncoder().encode('GIF89a...')), 400],
    [jsonReq({ token: s.uploadToken }), 415],
  ];
  for (const [req, status] of cases) assert.equal((await ctx.api.panel(req, TEST_INFO)).status, status);
  assert.equal(ctx.mailer.sent.length, 0);
});

test('panel: an image over 4 MB is refused', async () => {
  const ctx = setup();
  const s = await startOk(ctx);
  const big = new Uint8Array(4 * 1024 * 1024 + 1); big.set(PNG);
  assert.equal((await ctx.api.panel(panelReq(s.uploadToken, 0, big), TEST_INFO)).status, 413);
});

test('panel: a retried upload replaces the file instead of duplicating it', async () => {
  const ctx = setup();
  const s = await startOk(ctx);
  await ctx.api.panel(panelReq(s.uploadToken, 0, PNG), TEST_INFO);
  const again = new Uint8Array([...PNG, 7, 7]);
  await ctx.api.panel(panelReq(s.uploadToken, 0, again), TEST_INFO);
  const [folder] = ctx.drive.byParent(ROOT);
  const pngs = ctx.drive.byParent(folder.id).filter((f) => f.name.endsWith('.png'));
  assert.equal(pngs.length, 1);
  assert.deepEqual([...pngs[0].data], [...again]);
});

test('expired session → 401 on panel and finish', async () => {
  const ctx = setup();
  const s = await startOk(ctx);
  ctx.time.t += 60 * 60 * 1000 + 1;
  assert.equal((await ctx.api.panel(panelReq(s.uploadToken, 0, PNG), TEST_INFO)).status, 401);
  assert.equal((await ctx.api.finish(jsonReq({ token: s.uploadToken }), TEST_INFO)).status, 401);
});

test('finish: missing panel images → 409 listing them, folder stays INCOMPLETE, no email', async () => {
  const ctx = setup();
  const s = await startOk(ctx);
  await ctx.api.panel(panelReq(s.uploadToken, 1, JPG), TEST_INFO);
  const r = await ctx.api.finish(jsonReq({ token: s.uploadToken }), TEST_INFO);
  assert.equal(r.status, 409);
  assert.deepEqual((await r.json()).missingPanels, [0]);
  assert.match(ctx.drive.byParent(ROOT)[0].name, /\(INCOMPLETE\)$/);
  assert.equal(ctx.mailer.sent.length, 0);
});

test('finish: retried after success → success again, no second email', async () => {
  const ctx = setup();
  const s = await startOk(ctx, { ...goodOrder(), panels: [goodOrder().panels[0]] });
  await ctx.api.panel(panelReq(s.uploadToken, 0, PNG), TEST_INFO);
  await ctx.api.finish(jsonReq({ token: s.uploadToken }), TEST_INFO);
  const r = await ctx.api.finish(jsonReq({ token: s.uploadToken }), TEST_INFO);
  assert.equal(r.status, 200);
  assert.equal(ctx.mailer.sent.length, 1);
});

// --- API: failure rules --------------------------------------------------------
const driveErr = (reason = 'backendError') => Object.assign(new Error(`Upload file: HTTP 503 (${reason})`), { name: 'DriveError', status: 503, reason });

test('Drive failure at start → 500 generic error + alert email with customer contact', async () => {
  const ctx = setup();
  ctx.drive.fail.uploadFile = driveErr();
  const r = await ctx.api.start(jsonReq(goodOrder()), TEST_INFO);
  assert.equal(r.status, 500);
  const body = await r.json();
  assert.equal(body.error, 'Something went wrong. Please try again or email us at support@audial.in');
  assert.equal(body.uploadToken, undefined);
  assert.equal(ctx.mailer.sent.length, 1);
  assert.match(ctx.mailer.sent[0].subject, /^\[TEST\] Order Submission Failed — /);
  assert.match(ctx.mailer.sent[0].text, /Stage: start[\s\S]*Customer: Asha Rao <asha@example.com>/);
  assert.ok(ctx.log.lines.every((l) => !l.includes('asha@example.com') && !l.includes('Carter Road')), 'no customer data in logs');
});

test('expired Google token is named as the likely cause in the alert', async () => {
  const ctx = setup();
  ctx.drive.fail.createFolder = Object.assign(new Error('OAuth token refresh: HTTP 400 (invalid_grant)'), { name: 'DriveError', status: 400, reason: 'invalid_grant' });
  assert.equal((await ctx.api.start(jsonReq(goodOrder()), TEST_INFO)).status, 500);
  assert.match(ctx.mailer.sent[0].text, /refresh token has expired[\s\S]*--renew/);
});

test('Drive failure on a panel upload → 500 + alert', async () => {
  const ctx = setup();
  const s = await startOk(ctx);
  ctx.drive.fail.uploadFile = driveErr();
  assert.equal((await ctx.api.panel(panelReq(s.uploadToken, 0, PNG), TEST_INFO)).status, 500);
  assert.equal(ctx.mailer.sent.length, 1);
  assert.match(ctx.mailer.sent[0].text, /Stage: panel upload[\s\S]*Panel: 1 of 2/);
});

test('Drive failure at finish → 500 + alert, no order notification', async () => {
  const ctx = setup();
  const s = await startOk(ctx, { ...goodOrder(), panels: [goodOrder().panels[0]] });
  await ctx.api.panel(panelReq(s.uploadToken, 0, PNG), TEST_INFO);
  ctx.drive.fail.rename = driveErr();
  assert.equal((await ctx.api.finish(jsonReq({ token: s.uploadToken }), TEST_INFO)).status, 500);
  assert.equal(ctx.mailer.sent.length, 1);
  assert.match(ctx.mailer.sent[0].subject, /Order Submission Failed/);
});

test('Drive OK but notification email fails → still success, loud log without customer data', async () => {
  const ctx = setup();
  const s = await startOk(ctx, { ...goodOrder(), panels: [goodOrder().panels[0]] });
  await ctx.api.panel(panelReq(s.uploadToken, 0, PNG), TEST_INFO);
  ctx.mailer.failWith = new Error('Resend: HTTP 500');
  const r = await ctx.api.finish(jsonReq({ token: s.uploadToken }), TEST_INFO);
  assert.deepEqual(await r.json(), { success: true, orderRef: s.orderRef });
  assert.ok(ctx.log.lines.some((l) => l.includes(`NOTIFICATION EMAIL FAILED ref=${s.orderRef}`)));
  assert.ok(ctx.log.lines.every((l) => !l.includes('Asha')));
});

test('if the alert email also fails, the response is still the 500', async () => {
  const ctx = setup();
  ctx.drive.fail.createFolder = driveErr();
  ctx.mailer.failWith = new Error('Resend: HTTP 500');
  assert.equal((await ctx.api.start(jsonReq(goodOrder()), TEST_INFO)).status, 500);
  assert.ok(ctx.log.lines.some((l) => l.includes('ALERT EMAIL ALSO FAILED')));
});
