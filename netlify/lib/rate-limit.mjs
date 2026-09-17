// DEV-50 — at most N order starts per IP per hour, kept in Netlify Blobs.
//
// Netlify's built-in `config.rateLimit` window tops out at 180 seconds, so an
// hourly limit needs storage. IPs are stored only as an HMAC, never raw.
// Blobs has no atomic increment: two simultaneous starts from one IP can both
// pass. Acceptable — this stops floods, not a determined race.

import { createHmac } from 'node:crypto';

export function createRateLimiter({ store, secret, limit = 5, windowMs = 60 * 60 * 1000, now = () => Date.now() }) {
  return {
    // Records the attempt when allowed. Fails OPEN if storage is down: a Blobs
    // outage must not turn away real customers.
    async hit(ip) {
      const key = createHmac('sha256', secret).update(`ratelimit:${ip || 'unknown'}`).digest('hex');
      try {
        const t = now();
        const prev = (await store.get(key, { type: 'json' })) ?? { hits: [] };
        const hits = (Array.isArray(prev.hits) ? prev.hits : []).filter((h) => h > t - windowMs);
        if (hits.length >= limit) return { allowed: false, retryAfterSec: Math.ceil((hits[0] + windowMs - t) / 1000) };
        hits.push(t);
        await store.setJSON(key, { hits });
        return { allowed: true };
      } catch (err) {
        console.error(`[order] rate-limit storage unavailable, allowing request: ${err.message}`);
        return { allowed: true };
      }
    },
  };
}
