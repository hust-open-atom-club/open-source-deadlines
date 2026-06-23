import { describe, expect, it } from 'vitest'
import { DeadlineItem } from '@/lib/data'
import {
  applyFilters,
  applyPagination,
  applySearch,
  applySort,
  computeFacets,
  flatten,
  queryActivities,
} from '@/lib/server/query'

const FIXED_NOW = '2026-06-23T12:00:00'

const FIXTURE: DeadlineItem[] = [
  {
    title: 'Open Source Conference Asia',
    description: 'Annual OSS summit',
    category: 'conference',
    tags: ['oss', 'community'],
    events: [
      {
        year: 2026,
        id: 'osca-2026',
        link: 'https://example.com/osca',
        timezone: 'Asia/Shanghai',
        date: '2026-09-10',
        place: 'Shanghai',
        timeline: [
          { deadline: '2026-08-01T23:59:00', comment: 'CFP close' },
          { deadline: '2026-09-01T23:59:00', comment: 'Early bird' },
        ],
      },
    ],
  },
  {
    title: 'Hackathon Beijing',
    description: 'Weekend hack',
    category: 'competition',
    tags: ['hack', 'community'],
    events: [
      {
        year: 2026,
        id: 'hack-bj-2026',
        link: 'https://example.com/hack',
        timezone: 'Asia/Shanghai',
        date: '2026-07-01',
        place: 'Beijing',
        timeline: [
          { deadline: '2026-06-30T23:59:00', comment: 'Register' },
        ],
      },
    ],
  },
  {
    title: 'Past Workshop',
    description: 'Already ended',
    category: 'activity',
    tags: ['workshop'],
    events: [
      {
        year: 2026,
        id: 'past-2026',
        link: 'https://example.com/past',
        timezone: 'Asia/Shanghai',
        date: '2026-01-01',
        place: 'Beijing',
        timeline: [
          { deadline: '2026-01-01T23:59:00', comment: 'Done' },
        ],
      },
    ],
  },
]

describe('flatten', () => {
  it('expands each event into a flat entry with nextDeadline + timeRemaining', () => {
    const flat = flatten(FIXTURE, FIXED_NOW)
    expect(flat).toHaveLength(3)
    const osca = flat.find((e) => e.event.id === 'osca-2026')
    expect(osca?.nextDeadline).toContain('2026-08-01')
    expect(osca?.timeRemaining).toBeGreaterThan(0)
  })

  it('marks past events with negative timeRemaining', () => {
    const flat = flatten(FIXTURE, FIXED_NOW)
    const past = flat.find((e) => e.event.id === 'past-2026')!
    expect(past.timeRemaining).toBeLessThan(0)
  })
})

describe('applyFilters', () => {
  const flat = flatten(FIXTURE, FIXED_NOW)

  it('returns input unchanged when no filters', () => {
    expect(applyFilters(flat, {})).toHaveLength(3)
  })

  it('filters by category (OR within field)', () => {
    expect(applyFilters(flat, { category: ['conference'] })).toHaveLength(1)
    expect(applyFilters(flat, { category: ['conference', 'competition'] })).toHaveLength(2)
  })

  it('filters by tag (any-match OR)', () => {
    expect(applyFilters(flat, { tags: ['community'] })).toHaveLength(2)
    expect(applyFilters(flat, { tags: ['hack'] })).toHaveLength(1)
  })

  it('filters by location', () => {
    expect(applyFilters(flat, { locations: ['Beijing'] })).toHaveLength(2)
  })

  it('filters by favorites (event ids)', () => {
    expect(applyFilters(flat, { favorites: ['osca-2026', 'past-2026'] })).toHaveLength(2)
  })

  it('combines dimensions with AND across fields', () => {
    const out = applyFilters(flat, {
      category: ['competition'],
      locations: ['Beijing'],
    })
    expect(out).toHaveLength(1)
    expect(out[0].event.id).toBe('hack-bj-2026')
  })
})

describe('applySearch', () => {
  const flat = flatten(FIXTURE, FIXED_NOW)

  it('returns all items when query empty', () => {
    expect(applySearch(flat, '   ')).toHaveLength(3)
    expect(applySearch(flat, undefined)).toHaveLength(3)
  })

  it('matches title fuzzy', () => {
    const res = applySearch(flat, 'hackathon')
    expect(res.some((r) => r.event.id === 'hack-bj-2026')).toBe(true)
  })

  it('matches tag', () => {
    const res = applySearch(flat, 'workshop')
    expect(res.some((r) => r.event.id === 'past-2026')).toBe(true)
  })
})

describe('applySort', () => {
  it('puts upcoming first (ascending), ended at bottom (descending by remaining)', () => {
    const flat = flatten(FIXTURE, FIXED_NOW)
    const sorted = applySort(flat, 'next-deadline')
    const ids = sorted.map((s) => s.event.id)
    expect(ids[0]).toBe('hack-bj-2026')
    expect(ids[1]).toBe('osca-2026')
    expect(ids[2]).toBe('past-2026')
  })
})

describe('applyPagination', () => {
  it('slices and clamps page bounds', () => {
    const flat = flatten(FIXTURE, FIXED_NOW)
    const p1 = applyPagination(flat, 1, 2)
    expect(p1.items).toHaveLength(2)
    expect(p1.total).toBe(3)
    expect(p1.page).toBe(1)

    const p2 = applyPagination(flat, 2, 2)
    expect(p2.items).toHaveLength(1)
    expect(p2.page).toBe(2)

    const clamp = applyPagination(flat, 99, 2)
    expect(clamp.page).toBe(2)
  })

  it('rejects invalid page sizes', () => {
    const flat = flatten(FIXTURE, FIXED_NOW)
    const out = applyPagination(flat, 1, 0)
    expect(out.pageSize).toBeGreaterThanOrEqual(1)
  })
})

describe('computeFacets', () => {
  it('counts unique values across categories/tags/locations', () => {
    const flat = flatten(FIXTURE, FIXED_NOW)
    const facets = computeFacets(flat)
    expect(facets.categories.find((c) => c.value === 'conference')?.count).toBe(1)
    expect(facets.tags.find((t) => t.value === 'community')?.count).toBe(2)
    expect(facets.locations.find((l) => l.value === 'Beijing')?.count).toBe(2)
  })

  it('sorts entries by count desc then alpha', () => {
    const flat = flatten(FIXTURE, FIXED_NOW)
    const { tags } = computeFacets(flat)
    expect(tags[0].value).toBe('community')
  })
})

describe('queryActivities (integration)', () => {
  it('returns full QueryResult with all stages applied', () => {
    const result = queryActivities(FIXTURE, {
      now: FIXED_NOW,
      page: 1,
      pageSize: 10,
    })
    expect(result.total).toBe(3)
    expect(result.items).toHaveLength(3)
    expect(result.items[0].event.id).toBe('hack-bj-2026')
    expect(result.facets.categories.length).toBeGreaterThan(0)
  })

  it('respects filter + pagination together', () => {
    const result = queryActivities(FIXTURE, {
      now: FIXED_NOW,
      category: ['competition'],
      page: 1,
      pageSize: 10,
    })
    expect(result.total).toBe(1)
    expect(result.items[0].event.id).toBe('hack-bj-2026')
  })

  it('facets reflect filtered set (not paginated set)', () => {
    const result = queryActivities(FIXTURE, {
      now: FIXED_NOW,
      page: 1,
      pageSize: 1,
    })
    expect(result.items).toHaveLength(1)
    expect(result.facets.tags.find((t) => t.value === 'community')?.count).toBe(2)
  })
})
