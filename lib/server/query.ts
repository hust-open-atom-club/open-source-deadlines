import Fuse from 'fuse.js'
import { DateTime } from 'luxon'
import {
  DeadlineItem,
  Facets,
  FlatDeadline,
  QueryParams,
  QueryResult,
} from '@/lib/data'

const DEFAULT_PAGE = 1
const DEFAULT_PAGE_SIZE = 20
const MAX_PAGE_SIZE = 200
const SEARCH_THRESHOLD = 0.3
const SEARCH_KEYS = ['item.title', 'item.description', 'item.tags', 'event.place'] as const

function resolveNow(now?: string): DateTime {
  if (now) {
    const dt = DateTime.fromISO(now, { zone: 'Asia/Shanghai' })
    if (dt.isValid) return dt
  }
  return DateTime.now().setZone('Asia/Shanghai')
}

export function flatten(items: DeadlineItem[], now?: string): FlatDeadline[] {
  const nowDt = resolveNow(now)
  const nowMs = nowDt.toMillis()

  return items.flatMap((item) =>
    item.events.map((event) => {
      if (event.timeline.length === 0) {
        return { item, event, nextDeadline: null, timeRemaining: null }
      }

      const upcoming = event.timeline
        .map((t) => DateTime.fromISO(t.deadline, { zone: event.timezone }))
        .filter((d) => d.isValid && d.toMillis() > nowMs)
        .sort((a, b) => a.toMillis() - b.toMillis())

      const fallback = DateTime.fromISO(
        event.timeline[event.timeline.length - 1].deadline,
        { zone: event.timezone },
      )

      const next = upcoming[0] ?? fallback
      if (!next.isValid) {
        return { item, event, nextDeadline: null, timeRemaining: null }
      }

      return {
        item,
        event,
        nextDeadline: next.toISO(),
        timeRemaining: next.toMillis() - nowMs,
      }
    }),
  )
}

export function applySearch(items: FlatDeadline[], q?: string): FlatDeadline[] {
  const query = q?.trim()
  if (!query) return items

  const fuse = new Fuse(items, {
    keys: [...SEARCH_KEYS],
    threshold: SEARCH_THRESHOLD,
  })
  return fuse.search(query).map((r) => r.item)
}

export function applyFilters(
  items: FlatDeadline[],
  params: QueryParams,
): FlatDeadline[] {
  const { category, tags, locations, favorites } = params
  const hasCategory = category && category.length > 0
  const hasTags = tags && tags.length > 0
  const hasLocations = locations && locations.length > 0
  const hasFavorites = favorites && favorites.length > 0

  if (!hasCategory && !hasTags && !hasLocations && !hasFavorites) {
    return items
  }

  return items.filter(({ item, event }) => {
    if (hasCategory && !category!.includes(item.category)) return false
    if (hasTags && !tags!.some((tag) => item.tags.includes(tag))) return false
    if (hasLocations && !locations!.includes(event.place)) return false
    if (hasFavorites && !favorites!.includes(event.id)) return false
    return true
  })
}

export function applySort(
  items: FlatDeadline[],
  sort: QueryParams['sort'] = 'next-deadline',
): FlatDeadline[] {
  if (sort !== 'next-deadline') return items

  return [...items].sort((a, b) => {
    const aTime = a.timeRemaining
    const bTime = b.timeRemaining

    if (aTime === null && bTime === null) return 0
    if (aTime === null) return 1
    if (bTime === null) return -1

    const aEnded = aTime < 0
    const bEnded = bTime < 0

    if (aEnded && !bEnded) return 1
    if (!aEnded && bEnded) return -1
    if (aEnded && bEnded) return bTime - aTime

    return aTime - bTime
  })
}

export function applyPagination(
  items: FlatDeadline[],
  page = DEFAULT_PAGE,
  pageSize = DEFAULT_PAGE_SIZE,
): { items: FlatDeadline[]; page: number; pageSize: number; total: number } {
  const total = items.length
  const safePageSize = Math.min(Math.max(1, Math.floor(pageSize)), MAX_PAGE_SIZE)
  const totalPages = Math.max(1, Math.ceil(total / safePageSize))
  const safePage = Math.min(Math.max(1, Math.floor(page)), totalPages)
  const start = (safePage - 1) * safePageSize
  const end = start + safePageSize

  return {
    items: items.slice(start, end),
    page: safePage,
    pageSize: safePageSize,
    total,
  }
}

function tallyFacet<T>(
  items: FlatDeadline[],
  extract: (entry: FlatDeadline) => T | T[],
): Map<T, number> {
  const counts = new Map<T, number>()
  for (const entry of items) {
    const value = extract(entry)
    const values = Array.isArray(value) ? value : [value]
    for (const v of values) {
      if (v === undefined || v === null || v === '') continue
      counts.set(v, (counts.get(v) ?? 0) + 1)
    }
  }
  return counts
}

function toFacetEntries(counts: Map<string, number>) {
  return Array.from(counts.entries())
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count
      return a.value.localeCompare(b.value)
    })
}

export function computeFacets(items: FlatDeadline[]): Facets {
  const categories = tallyFacet(items, ({ item }) => item.category)
  const tags = tallyFacet(items, ({ item }) => item.tags)
  const locations = tallyFacet(items, ({ event }) => event.place)

  return {
    categories: toFacetEntries(categories as Map<string, number>),
    tags: toFacetEntries(tags as Map<string, number>),
    locations: toFacetEntries(locations as Map<string, number>),
  }
}

/**
 * Run the full query pipeline: flatten → search → filter → sort → paginate,
 * and compute the facet buckets to drive the FilterBar UI.
 *
 * Facet counting follows the "disjunctive (expanding) facets" convention
 * popularised by Algolia / Elasticsearch / GitHub Search: when computing
 * the count for a given dimension (e.g. tags), the filter on that same
 * dimension is excluded, while filters on other dimensions are still
 * applied. This gives a stable, predictable count interpretation:
 *   "how many results would I get if I (also) selected this value?"
 *
 * Without this, selecting a tag whose filter is OR-combined with other
 * tags would cause its own count to jump (because the OR set expands).
 * See lib/server/query.test.ts for the canonical examples.
 */
export function queryActivities(
  source: DeadlineItem[],
  params: QueryParams,
): QueryResult {
  const flat = flatten(source, params.now)
  const searched = applySearch(flat, params.q)
  const filtered = applyFilters(searched, params)
  const sorted = applySort(filtered, params.sort)
  const paged = applyPagination(sorted, params.page, params.pageSize)

  const facets: Facets = {
    categories: computeFacets(applyFilters(searched, { ...params, category: undefined })).categories,
    tags: computeFacets(applyFilters(searched, { ...params, tags: undefined })).tags,
    locations: computeFacets(applyFilters(searched, { ...params, locations: undefined })).locations,
  }
  const allFacets = computeFacets(flat)

  return {
    items: paged.items,
    total: paged.total,
    page: paged.page,
    pageSize: paged.pageSize,
    facets,
    allFacets,
  }
}
