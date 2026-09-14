// DEV-50 spike (RAN 2026-09-15 -> 403 storageQuotaExceeded; kept as a record).
// Can the service account upload a file into a folder owned by a
// consumer Gmail account?
//
// Usage: node scripts/dev-50/drive-spike.mjs "<path to service-account .json>" [folderId]
//
// Never prints the private key. Cleans up everything it creates.

import { readFileSync } from 'node:fs';
import { createSign, randomBytes } from 'node:crypto';

const keyPath = process.argv[2];
const folderId = process.argv[3] || '1Rko81wTe6odEdq3TtW15q7W_ioUz6snn'; // Audial Orders (TEST)
if (!keyPath) { console.error('Usage: node drive-spike.mjs <key.json> [folderId]'); process.exit(2); }

const key = JSON.parse(readFileSync(keyPath, 'utf8'));
const b64url = (buf) => Buffer.from(buf).toString('base64url');
const DRIVE = 'https://www.googleapis.com/drive/v3';

async function getToken() {
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claims = b64url(JSON.stringify({
    iss: key.client_email,
    scope: 'https://www.googleapis.com/auth/drive',
    aud: key.token_uri,
    iat: now,
    exp: now + 3600,
  }));
  const sig = createSign('RSA-SHA256').update(`${header}.${claims}`).sign(key.private_key, 'base64url');
  const res = await fetch(key.token_uri, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: `${header}.${claims}.${sig}`,
    }),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(`token exchange failed (${res.status}): ${JSON.stringify(body)}`);
  return body.access_token;
}

async function call(label, url, opts, token) {
  const res = await fetch(url, { ...opts, headers: { Authorization: `Bearer ${token}`, ...(opts.headers || {}) } });
  const text = await res.text();
  const body = text ? JSON.parse(text) : null;
  console.log(`\n[${res.ok ? 'OK  ' : 'FAIL'}] ${label} → HTTP ${res.status}`);
  console.log(JSON.stringify(body, null, 2));
  return { ok: res.ok, body };
}

const token = await getToken();
console.log(`Authenticated as service account: ${key.client_email}`);

const about = await call('Service account storage quota', `${DRIVE}/about?fields=user(emailAddress),storageQuota`, {}, token);

const parent = await call('Can see the TEST folder', `${DRIVE}/files/${folderId}?fields=id,name,owners(emailAddress),capabilities(canAddChildren)&supportsAllDrives=true`, {}, token);
if (!parent.ok) { console.log('\nVERDICT: service account cannot see the folder — check sharing.'); process.exit(1); }

const folder = await call('Create subfolder', `${DRIVE}/files?fields=id,name,owners(emailAddress)&supportsAllDrives=true`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: `SPIKE-${randomBytes(3).toString('hex')}`, mimeType: 'application/vnd.google-apps.folder', parents: [folderId] }),
}, token);

let file = { ok: false };
if (folder.ok) {
  const boundary = `spike${randomBytes(8).toString('hex')}`;
  const meta = JSON.stringify({ name: 'spike-test.txt', parents: [folder.body.id] });
  const content = 'DEV-50 spike test file. Safe to delete.\n';
  const multipart =
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${meta}\r\n` +
    `--${boundary}\r\nContent-Type: text/plain\r\n\r\n${content}\r\n--${boundary}--`;
  file = await call('Upload a file into it', `https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,size,owners(emailAddress)&supportsAllDrives=true`, {
    method: 'POST',
    headers: { 'Content-Type': `multipart/related; boundary=${boundary}` },
    body: multipart,
  }, token);
}

// Cleanup — delete the file, then the folder (the service account owns both if they exist).
if (file.ok) await call('Cleanup: delete file', `${DRIVE}/files/${file.body.id}?supportsAllDrives=true`, { method: 'DELETE' }, token);
if (folder.ok) await call('Cleanup: delete subfolder', `${DRIVE}/files/${folder.body.id}?supportsAllDrives=true`, { method: 'DELETE' }, token);

console.log('\n==================================================');
if (folder.ok && file.ok) console.log('VERDICT: service account CAN upload. Keep the current setup.');
else if (folder.ok && !file.ok) console.log('VERDICT: folder created but upload FAILED. Service-account route is out → OAuth fallback.');
else console.log('VERDICT: could not even create a folder. See the errors above.');
console.log('==================================================');
