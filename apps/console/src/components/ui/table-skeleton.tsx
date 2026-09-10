import { Skeleton } from './skeleton';

/** Body-only (the real `<thead>` stays static). Matches apps/dashboard/src/components/ui/table-skeleton.tsx. */
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
