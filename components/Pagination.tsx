'use client'

import { useEventStore } from '@/lib/store'
import { useTranslation } from 'react-i18next'

export function Pagination() {
  const { total, currentPage, pageSize, setCurrentPage, setPageSize } = useEventStore()
  const { t } = useTranslation('common')

  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const canGoPrev = currentPage > 1
  const canGoNext = currentPage < totalPages

  const handlePrev = () => {
    if (canGoPrev) setCurrentPage(currentPage - 1)
  }

  const handleNext = () => {
    if (canGoNext) setCurrentPage(currentPage + 1)
  }

  const handleFirst = () => setCurrentPage(1)
  const handleLast = () => setCurrentPage(totalPages)

  const pageSizes = [10, 20, 50, 100]

  const visiblePages = []
  const maxVisible = 5
  let start = Math.max(1, currentPage - Math.floor(maxVisible / 2))
  const end = Math.min(totalPages, start + maxVisible - 1)
  if (end - start + 1 < maxVisible) {
    start = Math.max(1, end - maxVisible + 1)
  }
  for (let i = start; i <= end; i++) {
    visiblePages.push(i)
  }

  if (total === 0) return null

  const startNum = ((currentPage - 1) * pageSize + 1).toLocaleString()
  const endNum = Math.min(currentPage * pageSize, total).toLocaleString()
  const totalNum = total.toLocaleString()

  const showPageButtons = totalPages > 1

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-2">
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <span>
          {t('pagination.showing', { start: startNum, end: endNum, total: totalNum })}
        </span>
        <select
          value={pageSize}
          onChange={(e) => setPageSize(Number(e.target.value))}
          className="ml-2 px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
        >
          {pageSizes.map((size) => (
            <option key={size} value={size}>{t('pagination.perPage', { size })}</option>
          ))}
        </select>
      </div>

      {showPageButtons && (
        <div className="flex items-center gap-1">
          <button
            onClick={handleFirst}
            disabled={!canGoPrev}
            className="px-2 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            {t('pagination.first')}
          </button>
          <button
            onClick={handlePrev}
            disabled={!canGoPrev}
            className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            {t('pagination.prev')}
          </button>

          {visiblePages.map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`px-3 py-1 text-sm border rounded-md transition-colors cursor-pointer ${
                page === currentPage
                  ? 'bg-blue-500 text-white border-blue-500'
                  : 'border-gray-300 hover:bg-gray-50'
              }`}
            >
              {page}
            </button>
          ))}

          <button
            onClick={handleNext}
            disabled={!canGoNext}
            className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            {t('pagination.next')}
          </button>
          <button
            onClick={handleLast}
            disabled={!canGoNext}
            className="px-2 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            {t('pagination.last')}
          </button>
        </div>
      )}
    </div>
  )
}