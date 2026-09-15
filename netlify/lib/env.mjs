// DEV-50 — wires the order API from environment variables (Netlify env / local .env).

import { getStore } from '@netlify/blobs';
import { createDrive } from './drive.mjs';
import { createMailer } from './email.mjs';
import { createRateLimiter } from './rate-limit.mjs';
import { createOrderApi } from './order.mjs';

const REQUIRED = [
  'GOOGLE_OAUTH_CLIENT_ID',
  'GOOGLE_OAUTH_CLIENT_SECRET',
  'GOOGLE_OAUTH_REFRESH_TOKEN',
  'AUDIAL_ORDERS_FOLDER_ID',
  'RESEND_API_KEY',
  'NOTIFICATION_EMAIL',
  'ORDER_TOKEN_SECRET',
];

let api = null;

function orderApi() {
  if (api) return api;
  const env = process.env;
  const missing = REQUIRED.filter((k) => !env[k]);
  if (missing.length) throw new Error(`missing env vars: ${missing.join(', ')}`);
  if (env.ORDER_TOKEN_SECRET.length < 32) throw new Error('ORDER_TOKEN_SECRET must be at least 32 characters');

  api = createOrderApi({
    drive: createDrive({
      clientId: env.GOOGLE_OAUTH_CLIENT_ID,
      clientSecret: env.GOOGLE_OAUTH_CLIENT_SECRET,
      refreshToken: env.GOOGLE_OAUTH_REFRESH_TOKEN,
    }),
    mailer: createMailer({ apiKey: env.RESEND_API_KEY, from: 'Audial Orders <support@audial.in>', to: env.NOTIFICATION_EMAIL }),
    rateLimiter: createRateLimiter({ store: getStore({ name: 'order-rate-limit', consistency: 'strong' }), secret: env.ORDER_TOKEN_SECRET }),
    secret: env.ORDER_TOKEN_SECRET,
    rootFolderId: env.AUDIAL_ORDERS_FOLDER_ID,
  });
  return api;
}

// Shared wrapper for the three function files.
export function handle(step) {
  return async (req, context) => {
    let instance;
    try {
      instance = orderApi();
    } catch (err) {
      console.error(`[order] misconfigured: ${err.message}`);
      return new Response(JSON.stringify({ success: false, error: 'Something went wrong. Please try again or email us at support@audial.in' }),
        { status: 500, headers: { 'Content-Type': 'application/json; charset=utf-8' } });
    }
    const info = { ip: context?.ip, isProduction: context?.deploy?.context === 'production' };
    return instance[step](req, info);
  };
}
