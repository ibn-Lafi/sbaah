/** Minimal surface actually used by InquiryForm (task 34/42) — Cloudflare doesn't publish an official npm type package for the vanilla script API. */
interface TurnstileRenderOptions {
  sitekey: string;
  callback?: (token: string) => void;
  'error-callback'?: () => void;
  'expired-callback'?: () => void;
}

interface Turnstile {
  render: (container: HTMLElement, options: TurnstileRenderOptions) => string;
  reset: (widgetId?: string) => void;
}

interface Window {
  turnstile?: Turnstile;
}
