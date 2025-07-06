'use client'

import { useEffect, useMemo } from 'react'
import Fuse from 'fuse.js'
import { EventCard } from '@/components/EventCard'
import { FilterBar } from '@/components/FilterBar'
import { Calendar } from 'lucide-react'
import { useEventStore } from '@/lib/store'
import { DeadlineItem, EventData } from '@/lib/data'
import Link from 'next/link'
import Image from 'next/image'
import { DateTime } from 'luxon'

interface FlatEvent {
  item: DeadlineItem
  event: EventData
  nextDeadline: DateTime
  timeRemaining: number
}

export default function Home() {
  const { 
    items, 
    loading, 
    fetchItems, 
    selectedCategory, 
    selectedTags, 
    selectedLocations, 
    searchQuery,
    favorites,
    showOnlyFavorites,
  } = useEventStore()

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  const flatEvents: FlatEvent[] = useMemo(() => items.flatMap(item =>
    item.events.map(event => {
      const now = DateTime.now().setZone("Asia/Shanghai")
      const upcomingDeadlines = event.timeline
        .map(t => DateTime.fromISO(t.deadline, { zone: event.timezone }))
        .filter(d => d > now)
        .sort((a, b) => a.toMillis() - b.toMillis())
      
      const nextDeadline = upcomingDeadlines[0] || 
        DateTime.fromISO(event.timeline[event.timeline.length - 1].deadline, { zone: event.timezone })
      const timeRemaining = nextDeadline.toMillis() - now.toMillis()
      
      return { item, event, nextDeadline, timeRemaining }
    })
  ), [items])

  const fuse = useMemo(() => {
    return new Fuse(flatEvents, {
      keys: ['item.title', 'item.description', 'item.tags', 'event.place'],
      threshold: 0.3,
    })
  }, [flatEvents])

  const filteredEvents = useMemo(() => {
    let results: FlatEvent[]
    
    if (searchQuery.trim() && fuse) {
      results = fuse.search(searchQuery.trim()).map(result => result.item)
    } else {
      results = flatEvents
    }

    return results
      .filter(({ item, event }) => {
        if (showOnlyFavorites && !favorites.includes(`${event.id}`)) return false
        if (selectedCategory && item.category !== selectedCategory) return false
        if (selectedTags.length > 0 && !selectedTags.some(tag => item.tags.includes(tag))) return false
        if (selectedLocations.length > 0 && !selectedLocations.includes(event.place)) return false
        return true
      })
      .sort((a, b) => {
        const aEnded = a.timeRemaining < 0
        const bEnded = b.timeRemaining < 0
        
        if (aEnded && !bEnded) return 1
        if (!aEnded && bEnded) return -1
        if (aEnded && bEnded) return b.timeRemaining - a.timeRemaining
        
        return a.timeRemaining - b.timeRemaining
      })
  }, [flatEvents, searchQuery, fuse, selectedCategory, selectedTags, selectedLocations, favorites, showOnlyFavorites]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">正在加载活动...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="text-left mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center justify-start gap-3">
              <div className="p-3 bg-primary rounded-full">
                <Calendar className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-slate-900">
                开源活动截止日期
              </h1>
            </div>
            <Link
              href="https://github.com/hust-open-atom-club/open-source-deadlines"
              target="_blank"
              rel="noopener noreferrer"
              className="border-2 rounded-lg overflow-auto"
              aria-label="GitHub Repository"
            >
              <Image alt="GitHub Repo stars" width={140} height={32} src="/github-stars.svg" />
            </Link>
          </div>
          <p className="text-lg text-slate-600 max-w-2xl leading-relaxed">
            开源会议、竞赛和活动重要截止日期概览，不再错过为社区贡献、学习和交流的机会
          </p>
          <p className="text-sm text-slate-600 mt-5">
            所有截止日期均默认转换为北京时间，如果您不知道当前所在时区，请点击时区选择器右侧的“自动检测”<br/>
            *免责声明：本站数据由人工维护，仅供参考
          </p>
        </header>

        {/* Filters */}
        <div className="bg-white rounded-xl p-6 shadow-sm border mb-8">
          <FilterBar />
        </div>

        {/* Events List */}
        <div className="space-y-4">
          {filteredEvents.map(({ item, event }) => (
            <EventCard 
              key={`${event.id}`} 
              item={item} 
              event={event} 
            />
          ))}
        </div>

        {filteredEvents.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">未找到任何活动</h3>
            <p className="text-slate-600">
              请尝试调整筛选器或搜索词以查看更多活动。
            </p>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-16 text-center text-slate-600">
          <p className="text-sm">
            使用 Next.js 与 shadcn/ui 构建 • 由{' '}
            <Link 
              href="https://github.com/inscripoem" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="underline"
            >
              inscripoem
            </Link>
            {' '}开发 • 由{' '}
            <Link 
              href="https://hust.openatom.club" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="underline"
            >
              华科开放原子开源俱乐部
            </Link>
            {' '}维护
          </p>
        </footer>
      </div>
    </div>
  )
}