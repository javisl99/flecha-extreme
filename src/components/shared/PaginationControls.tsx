type PaginationControlsProps = {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  className?: string;
};

type PageItem = number | 'ellipsis';

function buildPageItems(currentPage: number, totalPages: number): PageItem[] {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const items: PageItem[] = [1];
  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);

  if (start > 2) {
    items.push('ellipsis');
  }

  for (let page = start; page <= end; page += 1) {
    items.push(page);
  }

  if (end < totalPages - 1) {
    items.push('ellipsis');
  }

  items.push(totalPages);
  return items;
}

export default function PaginationControls({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  className = '',
}: PaginationControlsProps) {
  if (totalItems <= pageSize || totalPages <= 1) {
    return null;
  }

  const safeCurrentPage = Math.min(Math.max(currentPage, 1), totalPages);
  const startItem = totalItems === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1;
  const endItem = Math.min(safeCurrentPage * pageSize, totalItems);
  const pageItems = buildPageItems(safeCurrentPage, totalPages);

  return (
    <div
      className={`flex flex-col gap-4 border-t border-outline-variant/20 bg-surface-container-low/40 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 ${className}`}
    >
      <div className="text-sm font-medium text-on-surface-variant">
        Mostrando <span className="font-bold text-on-surface">{startItem}-{endItem}</span> de <span className="font-bold text-on-surface">{totalItems}</span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, safeCurrentPage - 1))}
          disabled={safeCurrentPage <= 1}
          aria-label="Anterior"
          className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-full border border-outline-variant/35 bg-surface-container-lowest px-3 py-2 text-sm font-semibold text-on-surface-variant transition hover:border-primary/30 hover:bg-surface-container-low disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          <span className="sr-only">Anterior</span>
        </button>

        <div className="flex flex-wrap items-center gap-2">
          {pageItems.map((item, index) =>
            item === 'ellipsis' ? (
              <span key={`ellipsis-${index}`} className="px-2 text-sm font-bold text-outline">
                …
              </span>
            ) : (
              <button
                key={item}
                type="button"
                onClick={() => onPageChange(item)}
                aria-current={item === safeCurrentPage ? 'page' : undefined}
                className={`inline-flex h-10 min-w-10 items-center justify-center rounded-full border px-3 text-sm font-bold transition ${
                  item === safeCurrentPage
                    ? 'border-primary/20 bg-primary text-white shadow-sm shadow-primary/20'
                    : 'border-outline-variant/35 bg-surface-container-lowest text-on-surface-variant hover:border-primary/30 hover:bg-surface-container-low'
                } cursor-pointer`}
              >
                {item}
              </button>
            )
          )}
        </div>

        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, safeCurrentPage + 1))}
          disabled={safeCurrentPage >= totalPages}
          aria-label="Siguiente"
          className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-full border border-outline-variant/35 bg-surface-container-lowest px-3 py-2 text-sm font-semibold text-on-surface-variant transition hover:border-primary/30 hover:bg-surface-container-low disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
          <span className="sr-only">Siguiente</span>
        </button>
      </div>
    </div>
  );
}
