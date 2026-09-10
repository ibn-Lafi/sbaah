import { Skeleton } from './skeleton';

/** Body-only (no header — the real `<thead>` labels are static, so pages keep rendering those for real and only swap the `<tbody>` for this while data loads). */
export function TableSkeleton({ columns, rows = 5 }: { columns: number; rows?: number }) {
  return (
    <table className="w-full text-sm">
      <tbody>
        {Array.from({ length: rows }).map((_, r) => (
          <tr key={r} className={r > 0 ? 'border-t border-border-subtle' : undefined}>
            {Array.from({ length: columns }).map((_, c) => (
              <td key={c} className="px-5 py-4">
                <Skeleton className="h-4" style={{ width: `${45 + ((r * 7 + c * 17) % 45)}%` }} />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
