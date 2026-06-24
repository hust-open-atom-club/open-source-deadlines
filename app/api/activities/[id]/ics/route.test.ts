import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { DeadlineItem } from '@/lib/data'

const FIXTURE: DeadlineItem[] = [
  {
    title: 'My Activity',
    description: 'desc',
    category: 'competition',
    tags: ['oss'],
    events: [
      {
        year: 2026,
        id: 'my-activity-2026',
        link: 'https://example.com/x',
        timezone: 'Asia/Shanghai',
        date: '2026',
        place: 'Online',
        timeline: [
          { deadline: '2026-03-01T18:00:00', comment: 'CFP' },
        ],
      },
    ],
  },
  {
    title: 'Empty Timeline',
    description: '',
    category: 'activity',
    tags: [],
    events: [
      {
        year: 2026,
        id: 'empty-2026',
        link: 'https://example.com/empty',
        timezone: 'Asia/Shanghai',
        date: '2026',
        place: 'Nowhere',
        timeline: [],
      },
    ],
  },
]

vi.mock('@/lib/server/data-source', () => ({
  loadDataset: vi.fn(async () => FIXTURE),
}))

import { NextRequest } from 'next/server'
import { GET } from './route'

function makeRequest(): NextRequest {
  return new NextRequest('http://localhost/api/activities/x/ics')
}

describe('GET /api/activities/[id]/ics', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 200 with text/calendar for a known event id', async () => {
    const res = await GET(makeRequest(), { params: Promise.resolve({ id: 'my-activity-2026' }) })

    expect(res.status).toBe(200)
    expect(res.headers.get('Content-Type')).toContain('text/calendar')
    expect(res.headers.get('Content-Disposition')).toContain('my-activity-2026.ics')

    const body = await res.text()
    expect(body).toContain('BEGIN:VCALENDAR')
    expect(body).toContain('UID:my-activity-2026--0@open-source-deadlines')
    expect(body).toContain('SUMMARY:My Activity - CFP')
  })

  it('sets a public Cache-Control with stale-while-revalidate', async () => {
    const res = await GET(makeRequest(), { params: Promise.resolve({ id: 'my-activity-2026' }) })

    const cc = res.headers.get('Cache-Control') ?? ''
    expect(cc).toContain('public')
    expect(cc).toContain('s-maxage=300')
    expect(cc).toContain('stale-while-revalidate=3600')
  })

  it('returns 404 JSON for an unknown event id', async () => {
    const res = await GET(makeRequest(), { params: Promise.resolve({ id: 'does-not-exist' }) })

    expect(res.status).toBe(404)
    const body = (await res.json()) as { error: string }
    expect(body.error).toContain('not found')
  })

  it('returns 422 when the event has no renderable deadlines', async () => {
    const res = await GET(makeRequest(), { params: Promise.resolve({ id: 'empty-2026' }) })

    expect(res.status).toBe(422)
    const body = (await res.json()) as { error: string }
    expect(body.error).toContain('No renderable deadlines')
  })
})
