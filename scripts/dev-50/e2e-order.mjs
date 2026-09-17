// DEV-50 end-to-end test order over real HTTP: start → panel × 2 → finish,
// plus the rejections that must NOT send an alert email.
// Sends ONE real notification email. Point it only at a TEST-folder deploy.
//
// Usage: node scripts/dev-50/e2e-order.mjs <base URL> [token.json to verify Drive]
//   node scripts/dev-50/e2e-order.mjs http://localhost:8888 website/google-oauth-token.json

import { readFileSync } from 'node:fs';

const base = (process.argv[2] || '').replace(/\/$/, '');
if (!base) { console.error('Usage: node e2e-order.mjs <base URL> [token.json]'); process.exit(2); }
const tokenFile = process.argv[3];

let failed = 0;
const ok = (label, cond, extra = '') => { console.log(`[${cond ? 'OK  ' : 'FAIL'}] ${label}${extra ? ` — ${extra}` : ''}`); if (!cond) failed++; };
const post = async (path, body, type) => {
  const res = await fetch(`${base}${path}`, { method: 'POST', body, ...(type ? { headers: { 'content-type': type } } : {}) });
  let json = null; try { json = await res.json(); } catch {}
  return { status: res.status, json };
};
const postJson = (path, obj) => post(path, JSON.stringify(obj), 'application/json');

const png = readFileSync('design-references/assets/logos/Audial Logo.png');
const jpg = readFileSync('design-references/assets/videos/banner-poster.jpg');

const order = {
  name: 'E2E Test Customer',
  email: 'e2e-test@example.com',
  phone: '+91 77180 49186',
  address: 'DEV-50 end-to-end test order, not a real delivery, Mumbai 400001',
  deliveryNotes: 'Automated test — safe to delete',
  panels: [
    { size: '2x2', orientation: 'horizontal', wood: 'light', wrap: 'half', quantity: 2 },
    { size: '4x2', orientation: 'vertical', wood: 'dark', wrap: 'full', quantity: 1 },
  ],
};

// --- rejections (no Drive writes, no email) ---
let r = await postJson('/api/order/start', { ...order, email: 'not-an-email' });
ok('start rejects invalid email (400)', r.status === 400, JSON.stringify(r.json?.errors));
r = await post('/api/order/start', JSON.stringify(order), 'text/plain');
ok('start rejects non-JSON content type (415)', r.status === 415);
r = await fetch(`${base}/api/order/start`).then((x) => ({ status: x.status }));
ok('GET is not served as an order (not 200)', r.status !== 200, `HTTP ${r.status}`);

// --- the real order ---
r = await postJson('/api/order/start', order);
ok('start (200)', r.status === 200 && r.json?.success, JSON.stringify({ status: r.status, ref: r.json?.orderRef, error: r.json?.error }));
if (r.status !== 200) process.exit(1);
const { orderRef, uploadToken } = r.json;

r = await postJson('/api/order/finish', { token: uploadToken });
ok('finish before any image → 409 missing [0,1]', r.status === 409 && JSON.stringify(r.json?.missingPanels) === '[0,1]', JSON.stringify(r.json?.missingPanels));

const panelForm = (index, bytes, token = uploadToken) => {
  const fd = new FormData();
  fd.set('token', token);
  fd.set('index', String(index));
  fd.set('image', new Blob([bytes]), 'upload.bin');
  return fd;
};
r = await post('/api/order/panel', panelForm(0, png, 'forged.token'));
ok('panel rejects forged token (401)', r.status === 401);
r = await post('/api/order/panel', panelForm(0, Buffer.from('<svg/>')));
ok('panel rejects non-image bytes (400)', r.status === 400);

let t0 = Date.now();
r = await post('/api/order/panel', panelForm(0, png));
ok(`panel 1 PNG ${(png.length / 1024).toFixed(0)} KB (200)`, r.status === 200, `${Date.now() - t0} ms`);
t0 = Date.now();
r = await post('/api/order/panel', panelForm(1, jpg));
ok(`panel 2 JPG ${(jpg.length / 1024).toFixed(0)} KB (200)`, r.status === 200, `${Date.now() - t0} ms`);
r = await post('/api/order/panel', panelForm(1, jpg));
ok('panel 2 retried (200, should replace not duplicate)', r.status === 200);

r = await postJson('/api/order/finish', { token: uploadToken });
ok('finish (200)', r.status === 200 && r.json?.orderRef === orderRef, JSON.stringify(r.json));
r = await postJson('/api/order/finish', { token: uploadToken });
ok('finish retried (200, no second email)', r.status === 200);

// --- verify what landed in Drive ---
if (tokenFile) {
  const { createDrive } = await import('../../netlify/lib/drive.mjs');
  const t = JSON.parse(readFileSync(tokenFile, 'utf8'));
  const drive = createDrive({ clientId: t.client_id, clientSecret: t.client_secret, refreshToken: t.refresh_token });
  const folder = await drive.findChildByName(t.folders.test, orderRef);
  ok(`Drive: folder "${orderRef}" in TEST, INCOMPLETE suffix gone`, !!folder);
  if (folder) {
    const names = (await drive.listChildNames(folder.id)).sort();
    const expected = [`${orderRef}_panel-1_2x2-light-halfwrap.png`, `${orderRef}_panel-2_4x2v-dark-fullwrap.jpg`, 'order-details.txt'];
    ok('Drive: exactly the 3 expected files', JSON.stringify(names) === JSON.stringify(expected), names.join(', '));
    console.log(`       https://drive.google.com/drive/folders/${folder.id}`);
  }
}

console.log(`\n${failed ? `${failed} FAILED` : 'ALL PASSED'} — order ${orderRef}. Check support@audial.in for "[TEST] New Order: ${orderRef} — E2E Test Customer".`);
process.exit(failed ? 1 : 0);
