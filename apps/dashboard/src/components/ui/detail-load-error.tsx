import { Button } from './button';
import { Card } from './card';

/**
 * A detail page's initial load failed for a reason other than the record
 * genuinely not existing (expired session, a permission error, the
 * network, a 500) — distinct from the "not found" state so the person
 * isn't told a real property/lead/project doesn't exist when the actual
 * problem is retryable.
 */
export function DetailLoadError({
  message,
  onRetry,
  retryLabel = 'إعادة المحاولة',
}: {
  message: string;
  onRetry: () => void;
  retryLabel?: string;
}) {
  return (
    <Card className="flex flex-col items-center gap-4 p-8 text-center">
      <p className="text-text-secondary">{message}</p>
      <Button type="button" variant="secondary" onClick={onRetry}>
        {retryLabel}
      </Button>
    </Card>
  );
}
