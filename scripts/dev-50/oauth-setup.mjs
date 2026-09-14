// DEV-50 one-time OAuth setup. Not deployed (absent from netlify.toml copy list).
// TODO (merge blocker): add a renew-token-only mode that reuses existing folder IDs.
//
// Usage: node scripts/dev-50/oauth-setup.mjs "<path to OAuth client .json>" "<output token .json>"
//
// 1. Runs Google's loopback sign-in (PKCE) for scope drive.file.
// 2. Refuses to continue unless the signed-in account is audial.orders@gmail.com.
// 3. Creates the app-owned root folders "Audial Orders" and "Audial Orders (TEST)".
//    (drive.file can only touch files the app itself created, so the folders
//    made by hand in the Drive UI are not reachable.)
// 4. Proves an upload works: subfolder + file inside TEST, then deletes both.
// 5. Writes client id/secret + refresh token + folder IDs to the output file.
//    The refresh token is NEVER printed.

import { readFileSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { createHash, randomBytes } from 'node:crypto';
import { execFile } from 'node:child_process';

const EXPECTED_ACCOUNT = 'audial.orders@gmail.com';
const SCOPE = 'https://www.googleapis.com/auth/drive.file';
const DRIVE = 'https://www.googleapis.com/drive/v3';

const [clientPath, outPath] = process.argv.slice(2);
if (!clientPath || !outPath) { console.error('Usage: node oauth-setup.mjs <client.json> <out-token.json>'); process.exit(2); }

const raw = JSON.parse(readFileSync(clientPath, 'utf8'));
const client = raw.installed;
if (!client) { console.error('Not a Desktop-app OAuth client JSON (no "installed" key). Did you pick "Desktop app"?'); process.exit(2); }

const verifier = randomBytes(32).toString('base64url');
const challenge = createHash('sha256').update(verifier).digest('base64url');
const state = randomBytes(16).toString('hex');

// --- 1. Loopback sign-in -----------------------------------------------------
const code = await new Promise((resolve, reject) => {
  const server = createServer((req, res) => {
    const url = new URL(req.url, 'http://127.0.0.1');
    if (url.pathname !== '/') { res.writeHead(404).end(); return; }
    const err = url.searchParams.get('error');
    const ok = !err && url.searchParams.get('state') === state && url.searchParams.get('code');
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(ok ? '<h2>Signed in. You can close this tab and return to Claude Code.</h2>'
               : `<h2>Sign-in failed: ${err || 'state mismatch'}</h2>`);
    server.close();
    clearTimeout(timer);
    ok ? resolve(url.searchParams.get('code')) : reject(new Error(`sign-in failed: ${err || 'state mismatch'}`));
  });
  const timer = setTimeout(() => { server.close(); reject(new Error('timed out after 5 minutes')); }, 5 * 60 * 1000);

  server.listen(0, '127.0.0.1', () => {
    const redirectUri = `http://127.0.0.1:${server.address().port}`;
    server.redirectUri = redirectUri;
    const auth = new URL(client.auth_uri);
    auth.search = new URLSearchParams({
      client_id: client.client_id,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: SCOPE,
      access_type: 'offline',
      prompt: 'select_account consent',
      login_hint: EXPECTED_ACCOUNT,
      code_challenge: challenge,
      code_challenge_method: 'S256',
      state,
    });
    console.log('\nOpening the browser. If it does not open, visit:\n');
    console.log(auth.toString());
    console.log(`\nSign in as ${EXPECTED_ACCOUNT} (NOT your personal account).`);
    execFile('rundll32', ['url.dll,FileProtocolHandler', auth.toString()], () => {});
    globalThis.__redirectUri = redirectUri;
  });
});

// --- 2. Exchange code for tokens ---------------------------------------------
const tokRes = await fetch(client.token_uri, {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({
    code,
    client_id: client.client_id,
    client_secret: client.client_secret,
    redirect_uri: globalThis.__redirectUri,
    grant_type: 'authorization_code',
    code_verifier: verifier,
  }),
});
const tok = await tokRes.json();
if (!tokRes.ok) { console.error('Token exchange failed:', tok.error, tok.error_description); process.exit(1); }
if (!tok.refresh_token) { console.error('No refresh token returned. Remove the app at myaccount.google.com/permissions and re-run.'); process.exit(1); }
console.log('\n[OK  ] Token exchange — refresh token received (not printed)');
console.log(`       granted scope: ${tok.scope}`);

const api = async (label, url, opts = {}) => {
  const res = await fetch(url, { ...opts, headers: { Authorization: `Bearer ${tok.access_token}`, ...(opts.headers || {}) } });
  const text = await res.text();
  const body = text ? JSON.parse(text) : null;
  console.log(`[${res.ok ? 'OK  ' : 'FAIL'}] ${label} → HTTP ${res.status}`);
  if (!res.ok) { console.log(JSON.stringify(body, null, 2)); process.exit(1); }
  return body;
};

// --- 3. Right account? --------------------------------------------------------
const about = await api('Who am I', `${DRIVE}/about?fields=user(emailAddress),storageQuota(limit,usage)`);
console.log(`       account: ${about.user.emailAddress}, quota limit: ${about.storageQuota.limit} bytes`);
if (about.user.emailAddress.toLowerCase() !== EXPECTED_ACCOUNT) {
  console.error(`\nWRONG ACCOUNT — signed in as ${about.user.emailAddress}. Nothing saved, nothing created. Re-run and pick ${EXPECTED_ACCOUNT}.`);
  process.exit(1);
}

// --- 4. Create app-owned root folders -----------------------------------------
const mkFolder = (name, parent) => api(`Create folder "${name}"`, `${DRIVE}/files?fields=id,name`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name, mimeType: 'application/vnd.google-apps.folder', ...(parent ? { parents: [parent] } : {}) }),
});
const orders = await mkFolder('Audial Orders');
const test = await mkFolder('Audial Orders (TEST)');

// --- 5. Prove an upload works, inside TEST, then clean up ---------------------
const spike = await mkFolder(`SPIKE-${randomBytes(3).toString('hex')}`, test.id);
const boundary = `b${randomBytes(8).toString('hex')}`;
const meta = JSON.stringify({ name: 'spike-test.txt', parents: [spike.id] });
const file = await api('Upload a file', 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,size', {
  method: 'POST',
  headers: { 'Content-Type': `multipart/related; boundary=${boundary}` },
  body: `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${meta}\r\n` +
        `--${boundary}\r\nContent-Type: text/plain\r\n\r\nDEV-50 OAuth spike. Safe to delete.\r\n--${boundary}--`,
});
await api('Cleanup: delete file', `${DRIVE}/files/${file.id}`, { method: 'DELETE' });
await api('Cleanup: delete spike folder', `${DRIVE}/files/${spike.id}`, { method: 'DELETE' });

// --- 6. Save ------------------------------------------------------------------
writeFileSync(outPath, JSON.stringify({
  account: about.user.emailAddress,
  scope: tok.scope,
  created: new Date().toISOString(),
  client_id: client.client_id,
  client_secret: client.client_secret,
  refresh_token: tok.refresh_token,
  folders: { orders: orders.id, test: test.id },
}, null, 2));

console.log('\n==================================================');
console.log('VERDICT: OAuth upload WORKS. Credentials saved to:');
console.log(`  ${outPath}`);
console.log(`New "Audial Orders" folder ID:        ${orders.id}`);
console.log(`New "Audial Orders (TEST)" folder ID: ${test.id}`);
console.log('==================================================');
