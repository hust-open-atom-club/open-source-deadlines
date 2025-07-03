import { DateTime } from "luxon"

export interface TimelineEvent {
  deadline: string
  comment: string
}

export interface EventData {
  year: number
  id: string
  link: string
  timeline: TimelineEvent[]
  timezone: string
  date: string
  place: string
}

export interface DeadlineItem {
  title: string
  description: string
  category: 'conference' | 'competition' | 'activity'
  tags: string[]
  events: EventData[]
}

export function getTimelineStatus(deadline: DateTime): 'past' | 'current' | 'upcoming' {
  const now = DateTime.now().setZone("Asia/Shanghai")
  const timeDiff = deadline.toMillis() - now.toMillis()
  const daysDiff = timeDiff / (1000 * 3600 * 24)
  
  if (daysDiff < -1) return 'past'
  if (daysDiff >= -1 && daysDiff <= 1) return 'current'
  return 'upcoming'
}

export function isEventEnded(event: EventData): boolean {
  const now = DateTime.now().setZone("Asia/Shanghai")
  
  const lastDeadlineStr = event.timeline[event.timeline.length - 1].deadline
  const lastDeadline = DateTime.fromISO(lastDeadlineStr, { zone: event.timezone })
  
  return lastDeadline.setZone("Asia/Shanghai") < now
}