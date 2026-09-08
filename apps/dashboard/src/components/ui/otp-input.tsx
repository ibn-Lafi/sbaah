import { Input } from './input';

/** 4-digit OTP entry (PRODUCT_SPEC.md section 2) — a single field, not 4 boxes; simplest input that matches otpCodeSchema exactly. */
export function OtpInput(props: { value: string; onChange: (value: string) => void; disabled?: boolean }) {
  return (
    <Input
      type="text"
      inputMode="numeric"
      autoComplete="one-time-code"
      maxLength={4}
      placeholder="0000"
      className="text-center text-2xl tracking-[0.5em]"
      value={props.value}
      disabled={props.disabled}
      onChange={(event) => props.onChange(event.target.value.replace(/\D/g, '').slice(0, 4))}
    />
  );
}
