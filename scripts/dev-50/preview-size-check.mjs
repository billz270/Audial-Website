// DEV-50 — find the REAL upload size cliff on a deployed Netlify environment.
//
// `netlify dev` enforces neither the request-body cap nor the built-in burst rateLimit,
// so this is the one check that can only run against a Deploy Preview / branch deploy.
//
// Uses ONE `start` and then REPLACES panel 0 at increasing sizes, because starts are
// rate-limited to 5/IP/hour while panel uploads get a 90/min burst allowance.
//
// Usage: node scripts/dev-50/preview-size-check.mjs <base URL> [token.json to clean up Drive]
//   node scripts/dev-50/preview-size-check.mjs https://dev-50-order-backend--audial.netlify.app website/google-oauth-token.json
//
// Point this ONLY at a deploy whose AUDIAL_ORDERS_FOLDER_ID is the TEST folder.
// It sends no notification email (it never calls finish) and deletes its own folder.

import { readFileSync } from 'node:fs';

const base = (process.argv[2] || '').replace(/\/$/, '');
if (!base) { console.error('Usage: node preview-size-check.mjs <base URL> [token.json]'); process.exit(2); }
const tokenFile = process.argv[3];

const SIZES_MB = [1, 2, 3, 3.9, 4.5, 5.5];

// A real PNG header + padding. sniffImage() reads only the 8-byte magic, and trailing
// bytes after IEND are ignored by decoders, so this is a valid PNG of arbitrary size.
const seed = readFileSync('design-references/assets/logos/Audial Logo.png');
function paddedPng(mb) {
  const target = Math.round(mb * 1024 * 1024);
  if (target <= seed.length) return seed.subarray(0, target);
  return Buffer.concat([seed, Buffer.alloc(target - seed.length, 0x41)]);
}

const order = {
  name: 'DEV-50 Size Probe',
  email: 'size-probe@example.com',
  phone: '+919999999999',
  address: 'DEV-50 size probe, not a real delivery, Mumbai 400001',
  city: 'Mumbai',
  pincode: '400001',
  notes: 'Automated size-cliff probe. Not a real order.',
  panels: [{ size: '2x2', orientation: 'horizontal', wood: 'light', wrap: 'half', quantity: 1 }],
};

console.log(`Target: ${base}\n`);

const r0 = await fetch(`${base}/api/order/start`, {
  method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(order),
});
let j0 = null; try { j0 = await r0.json(); } catch {}
if (r0.status !== 200 || !j0?.success) {
  console.error(`[FAIL] start → HTTP ${r0.status} ${JSON.stringify(j0)}`);
  if (r0.status === 429) console.error('       Rate limited (5 starts/IP/hour). Wait for the window, or use a different IP.');
  process.exit(1);
}
const { orderRef, uploadToken } = j0;
console.log(`[OK  ] start → ${orderRef}\n`);

const results = [];
for (const mb of SIZES_MB) {
  const bytes = paddedPng(mb);
  const fd = new FormData();
  fd.set('token', uploadToken);
  fd.set('index', '0');
  fd.set('image', new Blob([bytes]), 'probe.png');

  const t0 = Date.now();
  let status = 0, body = '', err = null;
  try {
    const res = await fetch(`${base}/api/order/panel`, { method: 'POST', body: fd });
    status = res.status;
    body = (await res.text()).slice(0, 160).replace(/\s+/g, ' ');
  } catch (e) {
    err = e.message;
  }
  const ms = Date.now() - t0;
  const verdict = err ? 'NETWORK' : status === 200 ? 'accepted' : `REJECTED ${status}`;
  results.push({ mb, status, ms, verdict });
  console.log(`[${status === 200 ? 'OK  ' : 'INFO'}] ${String(mb).padStart(4)} MB → ${verdict.padEnd(14)} ${String(ms).padStart(6)} ms  ${err ? `(${err})` : body}`);
}

const lastOk = results.filter((r) => r.status === 200).at(-1);
const firstBad = results.find((r) => r.status !== 200);
console.log('\n==================================================');
console.log(`Largest accepted: ${lastOk ? `${lastOk.mb} MB` : 'NONE'}`);
console.log(`First rejected:   ${firstBad ? `${firstBad.mb} MB (HTTP ${firstBad.status || 'network error'})` : 'none in range'}`);
if (lastOk && firstBad) console.log(`=> The cliff is between ${lastOk.mb} MB and ${firstBad.mb} MB.`);
console.log('==================================================');

// --- cleanup: remove the (INCOMPLETE) folder this probe created -------------------
if (!tokenFile) {
  console.log(`\nNo token.json given — folder "${orderRef} (INCOMPLETE)" is left in Drive. Delete it by hand.`);
  process.exit(results.some((r) => r.status === 200) ? 0 : 1);
}
const tok = JSON.parse(readFileSync(tokenFile, 'utf8'));
const testFolder = tok.folders?.test;
if (!testFolder) { console.log('\nToken file has no folders.test — skipping cleanup.'); process.exit(0); }

const form = new URLSearchParams({
  client_id: tok.client_id, client_secret: tok.client_secret,
  refresh_token: tok.refresh_token, grant_type: 'refresh_token',
});
const tr = await fetch('https://oauth2.googleapis.com/token', {
  method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: form,
});
if (!tr.ok) { console.log('\nCleanup: token refresh failed, folder left behind.'); process.exit(0); }
const { access_token } = await tr.json();
const auth = { Authorization: `Bearer ${access_token}` };
const DRIVE = 'https://www.googleapis.com/drive/v3';

const q = `'${testFolder}' in parents and trashed = false and name contains '${orderRef}'`;
const lr = await fetch(`${DRIVE}/files?fields=files(id,name,parents)&q=${encodeURIComponent(q)}`, { headers: auth });
const { files = [] } = await lr.json();
for (const f of files) {
  if (!f.parents?.includes(testFolder) || !f.name.startsWith(orderRef)) continue;
  const d = await fetch(`${DRIVE}/files/${f.id}`, { method: 'DELETE', headers: auth });
  console.log(`\n[${d.ok ? 'OK  ' : 'FAIL'}] cleanup: deleted "${f.name}" → HTTP ${d.status}`);
}
if (files.length === 0) console.log(`\n[INFO] cleanup: no folder matching ${orderRef} found (nothing to delete).`);
