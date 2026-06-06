export function TableSkeleton({ columns = 4, rows = 5 }: { columns?: number; rows?: number }) {
  return (
    <tbody className="divide-y divide-pine/5">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <tr key={rowIndex} className="animate-pulse">
          {Array.from({ length: columns }).map((__, columnIndex) => (
            <td key={columnIndex} className="p-6">
              <div className={`h-4 rounded bg-pine/10 ${columnIndex === 0 ? 'w-40' : 'w-24'}`} />
              {columnIndex === 0 && <div className="mt-2 h-3 w-28 rounded bg-pine/10" />}
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  );
}

export function CardGridSkeleton({ cards = 3 }: { cards?: number }) {
  return (
    <>
      {Array.from({ length: cards }).map((_, index) => (
        <div key={index} className="animate-pulse rounded-[2rem] border-2 border-pine/10 bg-butter-light p-6 md:p-8">
          <div className="h-6 w-36 rounded bg-pine/10" />
          <div className="mt-5 h-10 w-28 rounded bg-pine/10" />
          <div className="mt-6 space-y-3">
            <div className="h-4 w-full rounded bg-pine/10" />
            <div className="h-4 w-4/5 rounded bg-pine/10" />
            <div className="h-4 w-2/3 rounded bg-pine/10" />
          </div>
        </div>
      ))}
    </>
  );
}

export function FormSkeleton() {
  return (
    <div className="animate-pulse rounded-[2rem] border-2 border-pine/10 bg-butter-light p-6 md:p-8">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index}>
            <div className="mb-2 h-3 w-24 rounded bg-pine/10" />
            <div className="h-12 rounded-xl bg-pine/10" />
          </div>
        ))}
      </div>
    </div>
  );
}
