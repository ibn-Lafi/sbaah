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
 * No call sites exist yet — email sending (team invites, the daily
 * follow-up digest) is future work, not part of this swap.
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
