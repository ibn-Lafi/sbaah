import { passwordStrength } from '@/lib/auth/password-strength';

const SEGMENT_COLOR = ['var(--color-border-default)', '#B3261E', '#8A5200', '#68458A', '#0E7A4D'];

/** 4-segment strength bar under the password field — matches the founder's mockup's pwBar1..pwBar4 pattern. Pure UX feedback; passwordSchema's 8-char minimum is the only real gate. */
export function PasswordStrengthMeter({ password }: { password: string }) {
  const score = passwordStrength(password);
  return (
    <div className="flex gap-[5px]">
      {[1, 2, 3, 4].map((segment) => (
        <div
          key={segment}
          className="h-[3px] flex-1 rounded-full transition-colors"
          style={{ background: segment <= score ? SEGMENT_COLOR[score] : 'var(--color-border-default)' }}
        />
      ))}
    </div>
  );
}
