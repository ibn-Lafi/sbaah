import { Sndr } from '@rkiza/sndr';

let client: Sndr | undefined;

/**
 * Lazily-constructed singleton — the SDK is meant to be instantiated once
 * and reused (its own README does `const sndr = new Sndr(...)` at startup),
 * and its constructor validates `SNDR_API_KEY` synchronously. Building it
 * lazily instead of at module import time means a missing key only breaks
 * whatever code actually tries to send an email, not anything that merely
 * imports this module.
 *
 * No call sites exist directly against this module — every email send
 * goes through `../email/send.ts`'s `sendEmail()`, which wraps this
 * client so callers never touch the SDK shape directly.
 */
export function getSndrClient(): Sndr {
  if (!client) {
    const apiKey = process.env.SNDR_API_KEY;
    if (!apiKey) {
      throw new Error('Missing required environment variable: SNDR_API_KEY');
    }
    client = new Sndr(apiKey);
  }
  return client;
}
