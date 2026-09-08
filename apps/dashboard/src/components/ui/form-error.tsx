export function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-control bg-danger-surface px-4 py-3 text-sm text-danger">
      {message}
    </p>
  );
}
