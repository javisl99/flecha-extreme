interface TableSkeletonProps {
  columns: number;
  rows?: number;
}

const SkeletonBlock = ({ className = '' }: { className?: string }) => (
  <div className={`relative overflow-hidden rounded-xl bg-surface-container-high ${className}`}>
    <div className="table-loading-shimmer absolute inset-y-0 left-0 w-1/2" />
  </div>
);

const SkeletonPill = ({ className = '' }: { className?: string }) => (
  <div className={`relative overflow-hidden rounded-full bg-surface-container-high ${className}`}>
    <div className="table-loading-shimmer absolute inset-y-0 left-0 w-1/2" />
  </div>
);

export default function TableSkeleton({ columns, rows = 5 }: TableSkeletonProps) {
  return (
    <div className="overflow-hidden rounded-[1.25rem] border border-outline-variant/20 bg-white shadow-sm">
      <style jsx global>{`
        @keyframes table-loading-shimmer {
          0% {
            transform: translateX(-120%);
          }
          100% {
            transform: translateX(220%);
          }
        }

        .table-loading-shimmer {
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(255, 255, 255, 0.12) 45%,
            rgba(255, 255, 255, 0.24) 50%,
            rgba(255, 255, 255, 0.12) 55%,
            transparent 100%
          );
          animation: table-loading-shimmer 1.2s ease-in-out infinite;
        }
      `}</style>

      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-left">
          <thead>
            <tr className="bg-[#edf1ff]">
              {Array.from({ length: columns }).map((_, columnIndex) => (
                <th
                  key={columnIndex}
                  className={`px-6 py-4 text-[11px] font-black uppercase tracking-[0.14em] text-outline ${
                    columnIndex === columns - 1 ? 'text-right' : columnIndex > 0 ? 'text-center' : 'text-left'
                  }`}
                >
                  <SkeletonBlock
                    className={`h-3.5 rounded-full ${
                      columnIndex === 0 ? 'w-24' : columnIndex === 1 ? 'w-28' : columnIndex === 2 ? 'w-20' : 'w-16'
                    } ${columnIndex === columns - 1 ? 'ml-auto' : columnIndex > 0 ? 'mx-auto' : ''}`}
                  />
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {Array.from({ length: rows }).map((_, rowIndex) => (
              <tr
                key={rowIndex}
                className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-surface-container-low/25'}
              >
                {Array.from({ length: columns }).map((_, columnIndex) => {
                  const alignClass =
                    columnIndex === columns - 1 ? 'text-right' : columnIndex > 0 ? 'text-center' : 'text-left';

                  return (
                    <td key={columnIndex} className={`px-6 py-4 ${alignClass}`}>
                      {columns === 1 ? (
                        <div className="space-y-2">
                          <SkeletonBlock className="h-4 w-4/5 rounded-full" />
                          <SkeletonBlock className="h-3 w-2/3 rounded-full" />
                        </div>
                      ) : columnIndex === 0 && columns > 2 ? (
                        <div className="flex items-center gap-3">
                          <SkeletonPill className="h-10 w-10 shrink-0" />
                          <div className="min-w-0 flex-1 space-y-2">
                            <SkeletonBlock className="h-4 w-4/5 rounded-full" />
                            <SkeletonBlock className="h-3 w-3/5 rounded-full" />
                          </div>
                        </div>
                      ) : columnIndex === columns - 1 ? (
                        <div className="flex justify-end gap-2">
                          <SkeletonPill className="h-8 w-8" />
                          <SkeletonPill className="h-8 w-8" />
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <SkeletonBlock
                            className={`h-4 rounded-full ${
                              columnIndex === 1 ? 'w-5/6' : columnIndex === 2 ? 'w-3/4' : 'w-4/5'
                            } ${columnIndex > 0 ? 'mx-auto' : ''}`}
                          />
                          {columnIndex === 1 ? <SkeletonPill className="h-5 w-24" /> : null}
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
