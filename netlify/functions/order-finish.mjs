// DEV-50 — POST /api/order/finish. Logic lives in netlify/lib/order.mjs.
import { handle } from '../lib/env.mjs';

export default handle('finish');

export const config = {
  path: '/api/order/finish',
  method: 'POST',
};
