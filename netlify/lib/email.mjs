// DEV-50 — notification email via Resend (audial.in is verified there).

export function createMailer({ apiKey, from, to, fetch = globalThis.fetch }) {
  return {
    async send({ subject, text, replyTo }) {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from, to: [to], subject, text, ...(replyTo ? { reply_to: replyTo } : {}) }),
        signal: AbortSignal.timeout(15_000),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(`Resend: HTTP ${res.status}${body.name ? ` (${body.name})` : ''}`);
      }
      return res.json().catch(() => ({}));
    },
  };
}
