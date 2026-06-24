import { createEvents, type DateArray, type EventAttributes } from 'ics'
import { DateTime } from 'luxon'
import type { DeadlineItem, EventData } from '@/lib/data'

const PRODUCT_ID = 'open-source-deadlines/ics'
const UID_DOMAIN = 'open-source-deadlines'
const DEFAULT_DURATION_MINUTES = 60

function toUtcDateArray(deadlineIso: string, timezone: string): DateArray | null {
  const dt = DateTime.fromISO(deadlineIso, { zone: timezone })
  if (!dt.isValid) return null
  const utc = dt.toUTC()
  return [utc.year, utc.month, utc.day, utc.hour, utc.minute]
}

function buildDescription(item: DeadlineItem, event: EventData, comment: string, deadlineIso: string): string {
  const lines = [
    comment,
    '',
    `Activity: ${item.title}`,
    `Original deadline: ${deadlineIso} (${event.timezone})`,
    `Place: ${event.place}`,
    `Link: ${event.link}`,
  ]
  return lines.join('\n')
}

/**
 * Build an RFC 5545 VCALENDAR string for a single `EventData` (one yearly
 * edition of an activity). Each entry in `event.timeline` becomes its own
 * VEVENT with a stable UID derived from `event.id + timelineIndex`, so
 * re-subscribing or refetching always overwrites the same calendar items
 * rather than producing duplicates.
 *
 * Timelines without a valid ISO deadline are silently skipped. If the
 * resulting calendar would be empty, the function returns `null` so the
 * caller can decide whether to 404 or emit an empty VCALENDAR.
 *
 * Each deadline is modeled as a 1-hour focus block starting at the deadline
 * time, following the convention used by ccfddl and similar deadline
 * trackers (a true "point in time" has no standard VEVENT representation).
 */
export function buildEventIcs(
  item: DeadlineItem,
  event: EventData,
): { value: string; eventCount: number } | { error: Error } {
  const attributes: EventAttributes[] = []

  event.timeline.forEach((timeline, idx) => {
    const start = toUtcDateArray(timeline.deadline, event.timezone)
    if (!start) return

    attributes.push({
      start,
      startInputType: 'utc',
      startOutputType: 'utc',
      duration: { minutes: DEFAULT_DURATION_MINUTES },
      title: `${item.title} - ${timeline.comment}`,
      description: buildDescription(item, event, timeline.comment, timeline.deadline),
      location: event.place,
      url: event.link,
      uid: `${event.id}--${idx}@${UID_DOMAIN}`,
      productId: PRODUCT_ID,
      categories: [item.category, ...item.tags],
    })
  })

  if (attributes.length === 0) {
    return { error: new Error('No valid deadlines to render') }
  }

  const calName = `${item.title} (${event.year})`
  const { error, value } = createEvents(attributes, {
    productId: PRODUCT_ID,
    calName,
  })

  if (error || !value) {
    return { error: error ?? new Error('Failed to generate ICS') }
  }

  return { value, eventCount: attributes.length }
}
