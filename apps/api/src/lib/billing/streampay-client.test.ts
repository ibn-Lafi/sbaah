import { createHmac } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { verifyWebhookSignature } from './streampay-client';

const SECRET = 'unit-test-secret';
const sign = (body: string, timestamp: number, secret = SECRET) =>
  `t=${timestamp},v1=${createHmac('sha256', secret).update(`${timestamp}.${body}`).digest('hex')}`;

describe('StreamPay webhook signature', () => {
  beforeEach(() => {
    process.env.STREAMPAY_WEBHOOK_SECRET = SECRET;
  });
  afterEach(() => {
    delete process.env.STREAMPAY_WEBHOOK_SECRET;
  });

  const now = Math.floor(Date.now() / 1000);
  const body = '{"event_type":"PAYMENT_SUCCEEDED","entity_id":"pl_1"}';

  it('accepts a fresh, correctly signed body', () => {
    expect(verifyWebhookSignature(body, sign(body, now))).toBe(true);
  });

  it('rejects tampering, a wrong secret, replays and missing headers', () => {
    expect(verifyWebhookSignature(body.replace('pl_1', 'pl_2'), sign(body, now))).toBe(false);
    expect(verifyWebhookSignature(body, sign(body, now, 'other-secret'))).toBe(false);
    expect(verifyWebhookSignature(body, sign(body, now - 3600))).toBe(false);
    expect(verifyWebhookSignature(body, null)).toBe(false);
    expect(verifyWebhookSignature(body, 't=abc,v1=00')).toBe(false);
  });
});
