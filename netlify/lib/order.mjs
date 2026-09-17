// DEV-50 — the order API: start → panel (× N) → finish.
//
// Why three requests: Netlify caps a binary request at ~4.5 MB, so a
// multi-panel order cannot arrive in one. (Founder's call 2026-09-15.)
//
//   POST /api/order/start   JSON    details + panel specs → creates "<ref> (INCOMPLETE)"
//                                   folder, uploads order-details.txt, returns a signed token
//   POST /api/order/panel   multipart  token + index + image → uploads one panel image
//   POST /api/order/finish  JSON    token → checks every image is there, renames the
//                                   folder to "<ref>", emails the notification
//
// An abandoned order is visible in Drive by its "(INCOMPLETE)" folder name.
//
// Failure rules (TASKS.md DEV-50, revised 2026-09-15):
//   - Drive failure            → 500 + alert email
//   - Drive OK, email failure  → success + loud log (a 500 would make the customer retry → duplicate order)
//   - validation / 429 / bad token → clear error, NO alert (else anyone could flood the inbox)
// Logs carry order refs and error codes only — never customer data or artwork.
//
// Dependencies are injected so the failure paths are testable without Google.

import { LIMITS, newOrderRef, validateOrder, panelFileStem, panelSummary, sniffImage, orderDetailsText } from './validate.mjs';
import { signToken, verifyToken } from './token.mjs';
import { folderUrl } from './drive.mjs';

const TOKEN_TTL_MS = 60 * 60 * 1000;
const INCOMPLETE = ' (INCOMPLETE)';
const GENERIC_ERROR = 'Something went wrong. Please try again or email us at support@audial.in';

const json = (status, body, headers = {}) => new Response(JSON.stringify(body), {
  status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers },
});

const contentLength = (req) => Number(req.headers.get('content-length') || 0);

export function createOrderApi({ drive, mailer, rateLimiter, secret, rootFolderId, now = () => Date.now(), log = console }) {

  // Alert email for Drive failures. Its own failure must never mask the original.
  async function alert(info, stage, err, extra = {}) {
    const ts = new Date(now()).toISOString();
    log.error(`[order] ${stage} FAILED ref=${extra.ref || '-'} ${err.name}: ${err.message}`);
    const lines = [
      `Stage: ${stage}`,
      `Time: ${ts}`,
      `Order: ${extra.ref || '(not assigned yet)'}`,
      extra.panel ? `Panel: ${extra.panel}` : null,
      `Error: ${err.message}`,
      extra.folderId ? `Folder: ${folderUrl(extra.folderId)}` : null,
      '',
      extra.customer ? `Customer: ${extra.customer.name} <${extra.customer.email}>, ${extra.customer.phone}` : null,
      err.reason === 'invalid_grant' ? '\nLIKELY CAUSE: the Google refresh token has expired (Testing mode = 7 days). Run: node scripts/dev-50/oauth-setup.mjs --renew ...' : null,
    ].filter((l) => l !== null);
    try {
      await mailer.send({ subject: `${info.isProduction ? '' : '[TEST] '}Order Submission Failed — ${ts}`, text: lines.join('\n') });
    } catch (mailErr) {
      log.error(`[order] ALERT EMAIL ALSO FAILED ref=${extra.ref || '-'}: ${mailErr.message}`);
    }
    return json(500, { success: false, error: GENERIC_ERROR });
  }

  // --- start ------------------------------------------------------------------
  async function start(req, info) {
    if (!(req.headers.get('content-type') || '').toLowerCase().startsWith('application/json')) {
      return json(415, { success: false, error: 'Expected application/json.' });
    }
    if (contentLength(req) > LIMITS.startBodyBytes) return json(413, { success: false, error: 'Request too large.' });

    let body;
    try { body = JSON.parse(await req.text()); } catch { return json(400, { success: false, error: 'Invalid JSON.' }); }
    const v = validateOrder(body);
    if (!v.ok) return json(400, { success: false, error: 'Please check your details.', errors: v.errors });
    const order = v.order;

    const rl = await rateLimiter.hit(info.ip);
    if (!rl.allowed) {
      return json(429, { success: false, error: 'Too many order attempts from this connection. Please try again later or email us at support@audial.in' },
        { 'Retry-After': String(rl.retryAfterSec) });
    }

    const ref = newOrderRef();
    const customer = { name: order.name, email: order.email, phone: order.phone };
    let folderId;
    try {
      const folder = await drive.createFolder(`${ref}${INCOMPLETE}`, rootFolderId);
      folderId = folder.id;
      const details = orderDetailsText(ref, order, new Date(now()).toISOString());
      await drive.uploadFile({ name: 'order-details.txt', parentId: folderId, mime: 'text/plain; charset=UTF-8', data: details });
    } catch (err) {
      return alert(info, 'start', err, { ref, folderId, customer });
    }

    const exp = now() + TOKEN_TTL_MS;
    const token = signToken({
      v: 1, ref, folderId, exp,
      stems: order.panels.map((p, i) => panelFileStem(ref, p, i)),
      customer,
      summary: order.panels.map(panelSummary),
      totalQty: order.panels.reduce((n, p) => n + p.quantity, 0),
    }, secret);

    log.info?.(`[order] start ok ref=${ref} panels=${order.panels.length}`);
    return json(200, { success: true, orderRef: ref, uploadToken: token, panelCount: order.panels.length, expiresAt: new Date(exp).toISOString() });
  }

  // --- panel ------------------------------------------------------------------
  async function panel(req, info) {
    if (!(req.headers.get('content-type') || '').toLowerCase().startsWith('multipart/form-data')) {
      return json(415, { success: false, error: 'Expected multipart/form-data.' });
    }
    if (contentLength(req) > LIMITS.imageBytes + 256 * 1024) return json(413, { success: false, error: 'Image too large (max 4 MB).' });

    let form;
    try { form = await req.formData(); } catch { return json(400, { success: false, error: 'Invalid form data.' }); }

    const t = verifyToken(form.get('token'), secret, now());
    if (!t) return json(401, { success: false, error: 'Your order session expired. Please submit the order again.' });

    const index = Number(form.get('index'));
    if (!Number.isInteger(index) || index < 0 || index >= t.stems.length) return json(400, { success: false, error: 'Invalid panel index.' });

    const file = form.get('image');
    if (!file || typeof file.arrayBuffer !== 'function') return json(400, { success: false, error: 'Panel image is missing.' });
    if (file.size > LIMITS.imageBytes) return json(413, { success: false, error: 'Image too large (max 4 MB).' });
    const bytes = new Uint8Array(await file.arrayBuffer());
    const type = sniffImage(bytes);
    if (!type) return json(400, { success: false, error: 'Image must be PNG, JPG or WEBP.' });

    const name = `${t.stems[index]}.${type.ext}`;
    try {
      // A retried upload replaces the earlier copy instead of duplicating it.
      const existing = await drive.findChildByName(t.folderId, name);
      if (existing) await drive.replaceFileContent(existing.id, type.mime, bytes);
      else await drive.uploadFile({ name, parentId: t.folderId, mime: type.mime, data: bytes });
    } catch (err) {
      return alert(info, 'panel upload', err, { ref: t.ref, folderId: t.folderId, panel: `${index + 1} of ${t.stems.length}`, customer: t.customer });
    }
    return json(200, { success: true, index });
  }

  // --- finish -----------------------------------------------------------------
  async function finish(req, info) {
    if (!(req.headers.get('content-type') || '').toLowerCase().startsWith('application/json')) {
      return json(415, { success: false, error: 'Expected application/json.' });
    }
    if (contentLength(req) > LIMITS.startBodyBytes) return json(413, { success: false, error: 'Request too large.' });

    let body;
    try { body = JSON.parse(await req.text()); } catch { return json(400, { success: false, error: 'Invalid JSON.' }); }
    const t = verifyToken(body?.token, secret, now());
    if (!t) return json(401, { success: false, error: 'Your order session expired. Please submit the order again.' });

    let alreadyFinished = false;
    try {
      const folder = await drive.getFile(t.folderId);
      if (folder.trashed) throw Object.assign(new Error('Order folder is in the Drive trash'), { name: 'DriveError' });
      alreadyFinished = folder.name === t.ref;
      if (!alreadyFinished) {
        const names = await drive.listChildNames(t.folderId);
        const missing = t.stems.map((s, i) => (names.some((n) => n.startsWith(`${s}.`)) ? null : i)).filter((i) => i !== null);
        if (missing.length) {
          return json(409, { success: false, error: 'Some panel images did not upload. Please try again.', missingPanels: missing });
        }
        await drive.rename(t.folderId, t.ref);
      }
    } catch (err) {
      return alert(info, 'finish', err, { ref: t.ref, folderId: t.folderId, customer: t.customer });
    }

    // A retried finish after success must not send a second notification.
    if (alreadyFinished) return json(200, { success: true, orderRef: t.ref });

    try {
      await mailer.send({
        subject: `${info.isProduction ? '' : '[TEST] '}New Order: ${t.ref} — ${t.customer.name}`,
        replyTo: t.customer.email,
        text: [
          `Order: ${t.ref}`,
          `Received: ${new Date(now()).toISOString()}`,
          '',
          `Name: ${t.customer.name}`,
          `Email: ${t.customer.email}`,
          `Phone: ${t.customer.phone}`,
          '',
          `Panels: ${t.totalQty} (${t.stems.length} design${t.stems.length === 1 ? '' : 's'})`,
          ...t.summary.map((s, i) => `  ${i + 1}. ${s}`),
          '',
          `Drive folder: ${folderUrl(t.folderId)}`,
          '',
          'Full address and notes are in order-details.txt in the folder.',
        ].join('\n'),
      });
    } catch (err) {
      // The order is safely in Drive. Loud log, but still success.
      log.error(`[order] NOTIFICATION EMAIL FAILED ref=${t.ref} — order IS saved in Drive, check the folder manually. ${err.message}`);
    }

    log.info?.(`[order] finish ok ref=${t.ref}`);
    return json(200, { success: true, orderRef: t.ref });
  }

  return { start, panel, finish };
}
