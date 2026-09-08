import { useEffect, useRef, useState } from 'react';

const RESEND_COOLDOWN_SECONDS = 30;

/** UX-only pacing for the "resend code" button — the real rate limit (3 sends / 10 min) is enforced server-side (docs/OTP_FLOW.md section 6). */
export function useResendCooldown() {
  const [secondsLeft, setSecondsLeft] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  useEffect(() => {
    return () => clearInterval(intervalRef.current);
  }, []);

  function start() {
    setSecondsLeft(RESEND_COOLDOWN_SECONDS);
    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setSecondsLeft((current) => {
        if (current <= 1) {
          clearInterval(intervalRef.current);
          return 0;
        }
        return current - 1;
      });
    }, 1000);
  }

  return { secondsLeft, start };
}
