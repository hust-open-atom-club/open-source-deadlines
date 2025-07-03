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

// 获取当前显示时区（从store中获取）
const getCurrentDisplayTimezone = (): string => {
  // 在服务器端或初始化时使用默认时区
  if (typeof window === 'undefined') return 'Asia/Shanghai';
  
  try {
    // 从localStorage中读取displayTimezone
    const stateStr = localStorage.getItem('favorites-storage');
    if (stateStr) {
      const state = JSON.parse(stateStr);
      if (state.state && state.state.displayTimezone) {
        return state.state.displayTimezone;
      }
    }
  } catch (err) {
    console.warn('Failed to get timezone from storage:', err);
  }
  
  return 'Asia/Shanghai'; // 默认时区
};

// 获取时间线状态
export function getTimelineStatus(deadline: DateTime): 'past' | 'current' | 'upcoming' {
  const displayTimezone = getCurrentDisplayTimezone();
  const now = DateTime.now().setZone(displayTimezone)
  const timeDiff = deadline.toMillis() - now.toMillis()
  const daysDiff = timeDiff / (1000 * 3600 * 24)
  
  if (daysDiff < -1) return 'past'
  if (daysDiff >= -1 && daysDiff <= 1) return 'current'
  return 'upcoming'
}

// 判断事件是否已结束
export function isEventEnded(event: EventData): boolean {
  const displayTimezone = getCurrentDisplayTimezone();
  const now = DateTime.now().setZone(displayTimezone)
  
  const lastDeadlineStr = event.timeline[event.timeline.length - 1].deadline
  const lastDeadline = DateTime.fromISO(lastDeadlineStr, { zone: event.timezone })
  
  return lastDeadline.setZone(displayTimezone) < now
}