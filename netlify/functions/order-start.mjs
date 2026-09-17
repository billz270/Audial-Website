// DEV-50 — POST /api/order/start. Logic lives in netlify/lib/order.mjs.
import { handle } from '../lib/env.mjs';

export default handle('start');

export const config = {
  path: '/api/order/start',
  method: 'POST',
  // Burst guard in front of the hourly Blobs limit (Netlify's window max is 180s).
  rateLimit: { windowLimit: 10, windowSize: 60, aggregateBy: ['ip', 'domain'] },
};
