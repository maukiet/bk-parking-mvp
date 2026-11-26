const PAGE_SIZE_OPTIONS = [5, 10, 20, 50] as const

interface AdminPaginationProps {
  page: number
  pageSize: number
  totalItems: number
  itemLabel?: string
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
}

function visiblePages(current: number, total: number): (number | 'ellipsis-left' | 'ellipsis-right')[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, index) => index + 1)
  }
  const pages: (number | 'ellipsis-left' | 'ellipsis-right')[] = [1]
  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)
  if (start > 2) pages.push('ellipsis-left')
  for (let i = start; i <= end; i += 1) pages.push(i)
  if (end < total - 1) pages.push('ellipsis-right')
  pages.push(total)
  return pages
}

export function AdminPagination({
  page,
  pageSize,
  totalItems,
  itemLabel = 'mục',
  onPageChange,
  onPageSizeChange,
}: AdminPaginationProps) {
  if (totalItems === 0) return null

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const currentPage = Math.min(Math.max(1, page), totalPages)
  const from = (currentPage - 1) * pageSize + 1
  const to = Math.min(totalItems, currentPage * pageSize)
  const pages = visiblePages(currentPage, totalPages)

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 text-sm text-slate-600">
      <div className="flex flex-wrap items-center gap-3">
        <p className="tabular-nums">
          Hiển thị <strong>{from}</strong>–<strong>{to}</strong> / <strong>{totalItems}</strong> {itemLabel}
        </p>
        <label className="flex items-center gap-1.5 text-xs text-slate-500">
          <span>Hiển thị</span>
          <select
            aria-label="Số dòng mỗi trang"
            value={pageSize}
            onChange={event => onPageSizeChange(Number(event.target.value))}
            className="min-h-9 rounded-xl border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700"
          >
            {PAGE_SIZE_OPTIONS.map(size => (
              <option key={size} value={size}>{size} / trang</option>
            ))}
          </select>
        </label>
      </div>

      <nav aria-label="Phân trang" className="flex flex-wrap items-center gap-1">
        <button
          type="button"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="min-h-9 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Trước
        </button>

        {pages.map(item =>
          typeof item === 'number' ? (
            <button
              key={item}
              type="button"
              aria-current={item === currentPage ? 'page' : undefined}
              onClick={() => onPageChange(item)}
              className={`min-h-9 min-w-9 rounded-xl px-2.5 py-1.5 text-xs font-semibold tabular-nums ${
                item === currentPage
                  ? 'bg-black text-white'
                  : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              {item}
            </button>
          ) : (
            <span key={item} aria-hidden="true" className="px-1.5 text-slate-400">…</span>
          ),
        )}

        <button
          type="button"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className="min-h-9 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Sau
        </button>
      </nav>
    </div>
  )
}
