import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { DeadlineItem } from '@/lib/data'

const FIXTURE: DeadlineItem[] = [
  {
    title: 'Big Conference',
    description: 'desc',
    category: 'conference',
    tags: ['AI', 'OSS'],
    events: [
      {
        year: 2026,
        id: 'big-conf-2026',
        link: 'https://example.com/conf',
        timezone: 'Asia/Shanghai',
        date: '2026',
        place: 'Beijing',
        timeline: [
          { deadline: '2099-12-31T18:00:00', comment: 'CFP' },
        ],
      },
    ],
  },
  {
    title: 'Local Comp',
    description: 'desc',
    category: 'competition',
    tags: ['AI'],
    events: [
      {
        year: 2026,
        id: 'local-comp-2026',
        link: 'https://example.com/comp',
        timezone: 'Asia/Shanghai',
        date: '2026',
        place: 'Shanghai',
        timeline: [
          { deadline: '2099-12-31T18:00:00', comment: 'submit' },
        ],
      },
    ],
  },
  {
    title: 'Workshop',
    description: 'desc',
    category: 'activity',
    tags: ['OSS'],
    events: [
      {
        year: 2026,
        id: 'workshop-2026',
        link: 'https://example.com/ws',
        timezone: 'Asia/Shanghai',
        date: '2026',
        place: 'Online',
        timeline: [
          { deadline: '2099-12-31T18:00:00', comment: 'start' },
        ],
      },
    ],
  },
  {
    title: 'Himalayan Summit',
    description: 'desc',
    category: 'conference',
    tags: ['OSS'],
    events: [
      {
        year: 2026,
        id: 'himalayan-2026',
        link: 'https://example.com/hs',
        timezone: 'Asia/Kathmandu',
        date: '2026',
        place: 'Kathmandu, Nepal',
        timeline: [
          { deadline: '2099-12-31T18:00:00', comment: 'CFP' },
        ],
      },
    ],
  },
]

vi.mock('@/lib/server/data-source', () => ({
  loadDataset: vi.fn(async () => FIXTURE),
}))

import { NextRequest } from 'next/server'
import { GET } from './route'

function fetchQuery(qs: string) {
  return GET(new NextRequest(`http://localhost/api/activities${qs}`))
}

describe('GET /api/activities', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns the full dataset when no filters are supplied', async () => {
    const res = await fetchQuery('')
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.total).toBe(4)
    expect(body.items).toHaveLength(4)
  })

  it('filters by category (singular key)', async () => {
    const res = await fetchQuery('?category=conference')
    const body = await res.json()
    expect(body.total).toBe(2)
    expect(body.items.map((x: { event: { id: string } }) => x.event.id).sort()).toEqual(
      ['big-conf-2026', 'himalayan-2026'].sort(),
    )
  })

  it('filters by tag', async () => {
    const res = await fetchQuery('?tag=AI')
    const body = await res.json()
    expect(body.total).toBe(2)
    expect(body.items.map((x: { event: { id: string } }) => x.event.id).sort()).toEqual(
      ['big-conf-2026', 'local-comp-2026'].sort(),
    )
  })

  it('filters by location', async () => {
    const res = await fetchQuery('?location=Online')
    const body = await res.json()
    expect(body.total).toBe(1)
    expect(body.items[0].event.id).toBe('workshop-2026')
  })

  it('combines category + tag (AND across dimensions)', async () => {
    const res = await fetchQuery('?category=competition&tag=AI')
    const body = await res.json()
    expect(body.total).toBe(1)
    expect(body.items[0].event.id).toBe('local-comp-2026')
  })

  it('honours search q', async () => {
    const res = await fetchQuery('?q=Workshop')
    const body = await res.json()
    expect(body.total).toBeGreaterThan(0)
    expect(body.items[0].event.id).toBe('workshop-2026')
  })

  it('ignores unknown query keys silently', async () => {
    const res = await fetchQuery('?categories=conference&tags=AI')
    const body = await res.json()
    expect(body.total).toBe(4)
  })

  it('matches a location whose value contains a comma (regression for split-on-comma bug)', async () => {
    const res = await fetchQuery('?location=Kathmandu%2C%20Nepal')
    const body = await res.json()
    expect(body.total).toBe(1)
    expect(body.items[0].event.id).toBe('himalayan-2026')
  })

  it('treats repeated query keys as multi-value filters', async () => {
    const res = await fetchQuery('?location=Online&location=Beijing')
    const body = await res.json()
    expect(body.total).toBe(2)
    expect(body.items.map((x: { event: { id: string } }) => x.event.id).sort()).toEqual(
      ['big-conf-2026', 'workshop-2026'].sort(),
    )
  })

  it('returns Cache-Control: no-store to prevent insufficient CDN vary', async () => {
    const res = await fetchQuery('?category=conference')
    expect(res.headers.get('Cache-Control')).toBe('no-store')
  })
})
