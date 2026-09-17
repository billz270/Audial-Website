// DEV-50 live check of netlify/lib/drive.mjs against the REAL "Audial Orders (TEST)" folder.
// Exercises every method the order API uses, then deletes what it made.
// Usage: node scripts/dev-50/drive-live-check.mjs website/google-oauth-token.json

import { readFileSync } from 'node:fs';
import { createDrive } from '../../netlify/lib/drive.mjs';

const t = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const drive = createDrive({ clientId: t.client_id, clientSecret: t.client_secret, refreshToken: t.refresh_token });
const ok = (label, cond, extra = '') => { console.log(`[${cond ? 'OK  ' : 'FAIL'}] ${label}${extra ? ` — ${extra}` : ''}`); if (!cond) process.exitCode = 1; };

const png = Uint8Array.from(Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==', 'base64'));
const tricky = "ORD-live00_panel-1_2x2-light-halfwrap o'quote.png"; // proves q-string escaping

const folder = await drive.createFolder('ORD-live00 (INCOMPLETE)', t.folders.test);
ok('createFolder', !!folder.id);
try {
  const txt = await drive.uploadFile({ name: 'order-details.txt', parentId: folder.id, mime: 'text/plain; charset=UTF-8', data: 'ORDER: ORD-live00\nName: Tést ✓\n' });
  ok('uploadFile (text, UTF-8)', !!txt.id, `${txt.size} bytes`);

  const img = await drive.uploadFile({ name: tricky, parentId: folder.id, mime: 'image/png', data: png });
  ok('uploadFile (binary PNG)', img.size === String(png.length), `${img.size} bytes, expected ${png.length}`);

  const found = await drive.findChildByName(folder.id, tricky);
  ok("findChildByName (name with ')", found?.id === img.id);
  ok('findChildByName (absent)', (await drive.findChildByName(folder.id, 'nope.png')) === null);

  const bigger = new Uint8Array([...png, 0, 0, 0]);
  const rep = await drive.replaceFileContent(img.id, 'image/png', bigger);
  ok('replaceFileContent', rep.size === String(bigger.length), `${rep.size} bytes`);

  const names = await drive.listChildNames(folder.id);
  ok('listChildNames', names.length === 2 && names.includes(tricky) && names.includes('order-details.txt'), names.join(', '));

  await drive.rename(folder.id, 'ORD-live00');
  const after = await drive.getFile(folder.id);
  ok('rename + getFile', after.name === 'ORD-live00' && after.trashed === false);
} finally {
  // drive.mjs deliberately has no delete; clean up with a direct call.
  const tok = await (await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: t.client_id, client_secret: t.client_secret, refresh_token: t.refresh_token, grant_type: 'refresh_token' }),
  })).json();
  const del = await fetch(`https://www.googleapis.com/drive/v3/files/${folder.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${tok.access_token}` } });
  ok('cleanup: delete test folder', del.status === 204);
}
