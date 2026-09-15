// DEV-50 — minimal Google Drive v3 client over fetch, signed in as
// audial.orders@gmail.com via an OAuth refresh token (scope drive.file).
// Why OAuth and not a service account: see TASKS.md DEV-50 progress log.

const DRIVE = 'https://www.googleapis.com/drive/v3';
const UPLOAD = 'https://www.googleapis.com/upload/drive/v3';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const CALL_TIMEOUT_MS = 20_000;

export class DriveError extends Error {
  constructor(label, status, reason) {
    super(`${label}: HTTP ${status}${reason ? ` (${reason})` : ''}`);
    this.name = 'DriveError';
    this.status = status;
    this.reason = reason;
  }
}

const quote = (s) => `'${String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;

export function createDrive({ clientId, clientSecret, refreshToken, fetch = globalThis.fetch }) {
  let cached = null; // { token, expiresAt } — survives across warm invocations

  async function accessToken() {
    if (cached && cached.expiresAt > Date.now() + 60_000) return cached.token;
    const res = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, refresh_token: refreshToken, grant_type: 'refresh_token' }),
      signal: AbortSignal.timeout(CALL_TIMEOUT_MS),
    });
    const body = await res.json().catch(() => ({}));
    // invalid_grant here almost always means the Testing-mode 7-day refresh token expired.
    if (!res.ok) throw new DriveError('OAuth token refresh', res.status, body.error);
    cached = { token: body.access_token, expiresAt: Date.now() + (body.expires_in ?? 3600) * 1000 };
    return cached.token;
  }

  async function call(label, url, opts = {}) {
    const res = await fetch(url, {
      ...opts,
      headers: { Authorization: `Bearer ${await accessToken()}`, ...(opts.headers || {}) },
      signal: AbortSignal.timeout(CALL_TIMEOUT_MS),
    });
    const text = await res.text();
    let body = null;
    try { body = text ? JSON.parse(text) : null; } catch { /* non-JSON error page */ }
    if (!res.ok) throw new DriveError(label, res.status, body?.error?.errors?.[0]?.reason || body?.error?.status);
    return body;
  }

  // multipart/related: JSON metadata part + raw content part.
  function multipartBody(metadata, mime, data) {
    const boundary = `audial${crypto.randomUUID().replace(/-/g, '')}`;
    const head = `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n--${boundary}\r\nContent-Type: ${mime}\r\n\r\n`;
    return { boundary, body: new Blob([head, data, `\r\n--${boundary}--`]) };
  }

  return {
    createFolder: (name, parentId) => call(`Create folder`, `${DRIVE}/files?fields=id,name`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, mimeType: 'application/vnd.google-apps.folder', parents: [parentId] }),
    }),

    uploadFile({ name, parentId, mime, data }) {
      const { boundary, body } = multipartBody({ name, parents: [parentId] }, mime, data);
      return call(`Upload file`, `${UPLOAD}/files?uploadType=multipart&fields=id,name,size`, {
        method: 'POST', headers: { 'Content-Type': `multipart/related; boundary=${boundary}` }, body,
      });
    },

    replaceFileContent: (fileId, mime, data) => call(`Replace file content`, `${UPLOAD}/files/${encodeURIComponent(fileId)}?uploadType=media&fields=id,name,size`, {
      method: 'PATCH', headers: { 'Content-Type': mime }, body: new Blob([data]),
    }),

    async findChildByName(parentId, name) {
      const q = `name = ${quote(name)} and ${quote(parentId)} in parents and trashed = false`;
      const r = await call(`Find file`, `${DRIVE}/files?fields=files(id,name)&pageSize=10&q=${encodeURIComponent(q)}`);
      return r.files?.[0] ?? null;
    },

    async listChildNames(parentId) {
      const q = `${quote(parentId)} in parents and trashed = false`;
      const names = [];
      let pageToken = '';
      do {
        const r = await call(`List folder`, `${DRIVE}/files?fields=nextPageToken,files(name)&pageSize=200&q=${encodeURIComponent(q)}${pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : ''}`);
        for (const f of r.files ?? []) names.push(f.name);
        pageToken = r.nextPageToken || '';
      } while (pageToken);
      return names;
    },

    getFile: (fileId) => call(`Get file`, `${DRIVE}/files/${encodeURIComponent(fileId)}?fields=id,name,trashed`),

    rename: (fileId, name) => call(`Rename`, `${DRIVE}/files/${encodeURIComponent(fileId)}?fields=id,name`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }),
    }),
  };
}

export const folderUrl = (id) => `https://drive.google.com/drive/folders/${id}`;
