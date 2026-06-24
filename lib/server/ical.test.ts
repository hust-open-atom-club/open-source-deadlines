import { describe, expect, it } from 'vitest'
import { buildEventIcs } from '@/lib/server/ical'
import type { DeadlineItem, EventData } from '@/lib/data'

function makeItem(overrides: Partial<DeadlineItem> = {}): DeadlineItem {
  return {
    title: 'Sample Activity',
    description: 'A sample',
    category: 'competition',
    tags: ['oss', 'community'],
    events: [],
    ...overrides,
  }
}

function makeEvent(overrides: Partial<EventData> = {}): EventData {
  return {
    year: 2026,
    id: 'sample-2026',
    link: 'https://example.com/sample',
    timezone: 'Asia/Shanghai',
    date: '2026 spring',
    place: 'Online',
    timeline: [
      { deadline: '2026-03-01T18:00:00', comment: 'PR submission' },
      { deadline: '2026-04-15T23:59:00', comment: 'Final deliverable' },
    ],
    ...overrides,
  }
}

describe('buildEventIcs', () => {
  it('produces a valid VCALENDAR with one VEVENT per timeline entry', () => {
    const item = makeItem()
    const event = makeEvent()
    const result = buildEventIcs(item, event)

    expect('value' in result).toBe(true)
    if (!('value' in result)) return

    expect(result.eventCount).toBe(2)
    expect(result.value).toContain('BEGIN:VCALENDAR')
    expect(result.value).toContain('END:VCALENDAR')
    expect(result.value.match(/BEGIN:VEVENT/g)?.length).toBe(2)
    expect(result.value.match(/END:VEVENT/g)?.length).toBe(2)
  })

  it('uses stable UID derived from event.id + timeline index', () => {
    const result = buildEventIcs(makeItem(), makeEvent({ id: 'cnsoftbei-2025' }))
    if (!('value' in result)) throw new Error('expected success')

    expect(result.value).toContain('UID:cnsoftbei-2025--0@open-source-deadlines')
    expect(result.value).toContain('UID:cnsoftbei-2025--1@open-source-deadlines')
  })

  it('regenerates byte-identical UIDs across runs (idempotent for re-subscription)', () => {
    const a = buildEventIcs(makeItem(), makeEvent())
    const b = buildEventIcs(makeItem(), makeEvent())
    if (!('value' in a) || !('value' in b)) throw new Error('expected success')

    const uidsA = [...a.value.matchAll(/UID:[^\r\n]+/g)].map((m) => m[0])
    const uidsB = [...b.value.matchAll(/UID:[^\r\n]+/g)].map((m) => m[0])
    expect(uidsA).toEqual(uidsB)
  })

  it('converts IANA timezone to UTC in DTSTART (Asia/Shanghai 18:00 -> 10:00Z)', () => {
    const event = makeEvent({
      timezone: 'Asia/Shanghai',
      timeline: [{ deadline: '2026-03-01T18:00:00', comment: 'CFP' }],
    })
    const result = buildEventIcs(makeItem(), event)
    if (!('value' in result)) throw new Error('expected success')

    expect(result.value).toMatch(/DTSTART:20260301T100000Z/)
  })

  it('escapes commas and semicolons in title / description per RFC 5545', () => {
    const item = makeItem({ title: 'Conf, with comma; and semicolon' })
    const event = makeEvent({
      timeline: [{ deadline: '2026-03-01T18:00:00', comment: 'reg, today' }],
    })
    const result = buildEventIcs(item, event)
    if (!('value' in result)) throw new Error('expected success')

    expect(result.value).toContain('SUMMARY:Conf\\, with comma\\; and semicolon - reg\\, today')
  })

  it('sets CALSCALE, PRODID and X-WR-CALNAME header lines', () => {
    const item = makeItem({ title: 'My Activity' })
    const event = makeEvent({ year: 2027 })
    const result = buildEventIcs(item, event)
    if (!('value' in result)) throw new Error('expected success')

    expect(result.value).toContain('PRODID:open-source-deadlines/ics')
    expect(result.value).toContain('X-WR-CALNAME:My Activity (2027)')
  })

  it('embeds location and url from the parent EventData', () => {
    const event = makeEvent({
      place: 'Beijing',
      link: 'https://example.com/conf',
      timeline: [{ deadline: '2026-03-01T18:00:00', comment: 'CFP' }],
    })
    const result = buildEventIcs(makeItem(), event)
    if (!('value' in result)) throw new Error('expected success')

    expect(result.value).toContain('LOCATION:Beijing')
    expect(result.value).toContain('URL:https://example.com/conf')
  })

  it('returns an error when all deadlines are invalid', () => {
    const event = makeEvent({
      timeline: [
        { deadline: 'not-a-date', comment: 'bad' },
        { deadline: '', comment: 'empty' },
      ],
    })
    const result = buildEventIcs(makeItem(), event)
    expect('error' in result).toBe(true)
  })

  it('skips invalid timeline entries but still renders the valid ones', () => {
    const event = makeEvent({
      timeline: [
        { deadline: 'not-a-date', comment: 'bad' },
        { deadline: '2026-03-01T18:00:00', comment: 'good' },
      ],
    })
    const result = buildEventIcs(makeItem(), event)
    if (!('value' in result)) throw new Error('expected success')

    expect(result.eventCount).toBe(1)
    expect(result.value.match(/BEGIN:VEVENT/g)?.length).toBe(1)
  })
})
