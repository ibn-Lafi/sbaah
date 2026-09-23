import { describe, expect, it } from 'vitest';
import { extractClientIp } from './client-ip';

const headers = (forwardedFor?: string) => new Headers(forwardedFor ? { 'x-forwarded-for': forwardedFor } : {});

describe('extractClientIp', () => {
  it('uses the address appended by the trusted proxy, never a client-supplied prefix', () => {
    expect(extractClientIp(headers('6.6.6.6, 203.0.113.7'), 1)).toBe('203.0.113.7');
    expect(extractClientIp(headers('203.0.113.7'), 1)).toBe('203.0.113.7');
  });

  it('skips one more hop when another proxy sits in front', () => {
    expect(extractClientIp(headers('6.6.6.6, 203.0.113.7, 172.70.1.1'), 2)).toBe('203.0.113.7');
  });

  it('returns null without a forwarding header and never indexes before the first entry', () => {
    expect(extractClientIp(headers(), 1)).toBeNull();
    expect(extractClientIp(headers('203.0.113.7'), 3)).toBe('203.0.113.7');
  });
});
