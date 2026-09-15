// DEV-50 — the signed order-session token that ties start → panel → finish together.
//
// An order arrives as several requests (Netlify caps a binary request at ~4.5 MB),
// and functions keep no state between requests. So `start` hands the browser a
// token: base64url(JSON payload) + "." + base64url(HMAC-SHA256). Signed, NOT
// encrypted — it only ever holds what the customer just typed plus Drive IDs,
// and it goes back to that same customer's browser.

import { createHmac, timingSafeEqual } from 'node:crypto';

const b64 = (buf) => Buffer.from(buf).toString('base64url');
const mac = (data, secret) => createHmac('sha256', secret).update(data).digest();

export function signToken(payload, secret) {
  const body = b64(JSON.stringify(payload));
  return `${body}.${b64(mac(body, secret))}`;
}

// Returns the payload, or null for anything malformed, forged or expired.
export function verifyToken(token, secret, nowMs = Date.now()) {
  if (typeof token !== 'string' || token.length > 16000) return null;
  const dot = token.indexOf('.');
  if (dot <= 0 || dot !== token.lastIndexOf('.')) return null;
  const body = token.slice(0, dot);
  let given;
  try { given = Buffer.from(token.slice(dot + 1), 'base64url'); } catch { return null; }
  const expected = mac(body, secret);
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
  let payload;
  try { payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')); } catch { return null; }
  if (!payload || typeof payload.exp !== 'number' || payload.exp <= nowMs) return null;
  return payload;
}
