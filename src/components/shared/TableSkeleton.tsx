interface TableSkeletonProps {
  columns: number;
  rows?: number;
}

export default function TableSkeleton({ columns, rows = 5 }: TableSkeletonProps) {
  return (
    <div className="animate-pulse">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-table-head-bg dark:bg-gray-800">
            <tr>
              {Array(columns).fill(0).map((_, i) => (
                <th key={i} className="px-6 py-3 text-left">
                  <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-24"></div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-card-bg divide-y divide-gray-200 dark:divide-gray-700">
            {Array(rows).fill(0).map((_, rowIndex) => (
              <tr key={rowIndex}>
                {Array(columns).fill(0).map((_, colIndex) => (
                  <td key={colIndex} className="px-6 py-4 whitespace-nowrap">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 