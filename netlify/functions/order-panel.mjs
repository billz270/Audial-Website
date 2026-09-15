// DEV-50 — POST /api/order/panel. Logic lives in netlify/lib/order.mjs.
import { handle } from '../lib/env.mjs';

export default handle('panel');

export const config = {
  path: '/api/order/panel',
  method: 'POST',
  // One request per panel image; an order holds at most 30 designs, plus retries.
  rateLimit: { windowLimit: 90, windowSize: 60, aggregateBy: ['ip', 'domain'] },
};
