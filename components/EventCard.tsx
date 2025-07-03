'use client'

import { useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TimelineItem } from '@/components/TimelineItem'
import { CountdownTimer } from '@/components/CountdownTimer'
import { DeadlineItem, EventData, isEventEnded } from '@/lib/data'
import { Calendar, MapPin, Clock, Star, ExternalLink } from 'lucide-react'
import { useEventStore } from '@/lib/store'
import { DateTime } from "luxon"
import Link from 'next/link'

interface EventCardProps {
  item: DeadlineItem
  event: EventData
}

const categoryTranslations: { [key: string]: string } = {
  conference: '会议',
  competition: '竞赛',
  activity: '活动',
};

export function EventCard({ item, event }: EventCardProps) {
  const { favorites, toggleFavorite, mounted } = useEventStore()
  const cardId = `${event.id}`
  const isFavorited = favorites.includes(cardId)

  useEffect(() => {
    useEventStore.setState({ mounted: true })
  }, [])

  const ended = isEventEnded(event)
  const now = DateTime.now().setZone("Asia/Shanghai")
  
  // 找到下一个截止日期
  const upcomingDeadlines = event.timeline
    .map((t, index) => ({ 
      ...t, 
      // 正确处理时区：将原始字符串解析为指定时区的日期
      date: DateTime.fromISO(t.deadline, { zone: event.timezone }),
      index 
    }))
    // 转换到上海时区进行比较
    .filter(t => t.date.setZone("Asia/Shanghai") > now)
    .sort((a, b) => a.date.toMillis() - b.date.toMillis())
  
  const nextDeadline = upcomingDeadlines[0]
  
  return (
    <Card className={`transition-all duration-300 hover:shadow-lg ${ended ? 'opacity-60 grayscale' : ''}`}>
      <CardContent>
        <div className="flex flex-col md:flex-row md:gap-6">
          {/* 左侧内容区域 */}
          <div className="flex-1 space-y-4">
            {/* 标题行 */}
            <div className="space-y-3">
              {/* 第一行：标题和年份 */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2 flex-wrap">
                    <Link href={event.link} target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center gap-1">
                      <h2 className="text-xl font-semibold leading-tight break-words">
                        {item.title}
                      </h2>
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge variant="outline" className="text-xs">
                        {event.year}
                      </Badge>
                      {ended && (
                        <Badge variant="secondary" className="text-xs">
                          已结束
                        </Badge>
                      )}
                      {mounted && (
                        <Star
                          className={`w-4 h-4 cursor-pointer transition-colors ${
                            isFavorited
                              ? 'text-yellow-400 fill-yellow-400'
                              : 'text-gray-400 hover:text-yellow-500'
                          }`}
                          onClick={() => toggleFavorite(cardId)}
                        />
                      )}
                    </div>
                  </div>
                </div>            
              </div>
              {/* 描述 */}
              <p className="text-sm leading-relaxed text-muted-foreground">
                {item.description}
              </p>
              {/* 类别标签 */}
              <div className="flex justify-between items-center">
                <div className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${
                  {
                    'conference': 'bg-green-600 text-white',
                    'competition': 'bg-red-600 text-white',
                    'activity': 'bg-purple-600 text-white'
                  }[item.category] || 'bg-primary text-white'
                }`}>
                  {categoryTranslations[item.category] || item.category}
                </div>
              </div>
            </div>
            
            {/* 标签 */}
            <div className="flex flex-wrap gap-1.5">
              {item.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>

            {/* 日期和地点信息 */}
            <div className="flex flex-col sm:flex-row md:flex-col md:items-start lg:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4 flex-shrink-0" />
                <span className="break-words">{event.date}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4 flex-shrink-0" />
                <span className="break-words">{event.timezone}</span>
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4 flex-shrink-0" />
                <span className="break-words">{event.place}</span>
              </div>
            </div>

          </div>
          
          {/* 右侧Timeline和Deadline - 桌面端 */}
          <div className="hidden md:block md:w-1/2">
            <div className="flex flex-col gap-4">
              {/* Timeline区域 - 上方 */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm font-medium">时间线</span>
                </div>
                
                {/* 时间线容器 */}
                <div className="relative bg-gray-50 rounded-lg border h-16 flex items-center">
                  {/* 时间线背景线 */}
                  <div className="absolute left-[10%] right-[10%] h-0.5 bg-gray-300 top-1/2 transform -translate-y-1/2"></div>
                  
                  {/* 时间线节点容器 */}
                  <div className="relative w-full h-full">
                    {event.timeline.map((timelineEvent, index) => (
                      <TimelineItem
                        key={index}
                        event={timelineEvent}
                        timezone={event.timezone}
                        isEnded={ended}
                        isActive={nextDeadline?.index === index}
                        totalEvents={event.timeline.length}
                        index={index}
                      />
                    ))}
                  </div>
                </div>
              </div>
              
              {/* 倒计时区域 - 下方，左右布局 */}
              {!ended && nextDeadline ? (
                <div className="p-3 bg-gradient-to-br from-orange-50 to-red-50 rounded-xl border-2 border-orange-200 shadow-sm">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                    {/* 左侧文本信息 */}
                    <div className="space-y-1 text-center lg:text-left">
                      <div className="text-sm font-bold text-orange-800">
                        下一个截止日期
                      </div>
                      <div className="text-sm font-bold text-orange-900 leading-tight break-words">
                        {nextDeadline.comment}
                      </div>
                      <div className="text-xs text-orange-600">
                        {nextDeadline.date.setZone("Asia/Shanghai").toFormat('yyyy-MM-dd HH:mm:ss')} (CST)
                      </div>
                    </div>
                    
                    {/* 右侧倒计时 */}
                    <div className="mt-2 lg:mt-0 flex justify-center items-center">
                      <CountdownTimer deadline={nextDeadline.date} />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-gray-100 rounded-xl border-2 border-gray-200">
                  <div className="text-center">
                    <div className="text-sm font-bold text-gray-600 mb-1">
                      活动已结束
                    </div>
                    <div className="text-xs text-gray-500">
                      所有截止日期已过
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* 移动端布局 - Timeline和Deadline */}
        <div className="block md:hidden space-y-6 mt-6">
          {/* Timeline区域 - 独立一行 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span className="text-sm font-medium">时间线</span>
            </div>
            
            {/* 时间线容器 - 移动端优化高度 */}
            <div className="relative bg-gray-50 rounded-lg border h-16 sm:h-20 flex items-center overflow-hidden">
              {/* 时间线背景线 - 水平居中 */}
              <div className="absolute left-[8%] right-[8%] h-0.5 bg-gray-300 top-1/2 transform -translate-y-1/2"></div>
              
              {/* 时间线节点容器 */}
              <div className="relative w-full h-full">
                {event.timeline.map((timelineEvent, index) => (
                  <TimelineItem
                    key={index}
                    event={timelineEvent}
                    timezone={event.timezone}
                    isEnded={ended}
                    isActive={nextDeadline?.index === index}
                    totalEvents={event.timeline.length}
                    index={index}
                  />
                ))}
              </div>
            </div>
          </div>
          
          {/* 倒计时区域 - 独立一行，移动端全宽 */}
          <div className="w-full">
            {!ended && nextDeadline ? (
              <div className="p-4 bg-gradient-to-br from-orange-50 to-red-50 rounded-xl border-2 border-orange-200 shadow-sm">
                <div className="text-center space-y-3">
                  <div className="space-y-1">
                    <div className="text-sm font-bold text-orange-800 mb-1">
                      下一个截止日期
                    </div>
                    <div className="text-base font-bold text-orange-900 leading-tight break-words">
                      {nextDeadline.comment}
                    </div>
                    <div className="text-xs text-orange-600">
                      {nextDeadline.date.setZone("Asia/Shanghai").toFormat('yyyy-MM-dd HH:mm:ss')} (CST)
                    </div>
                  </div>
                  <div className="flex justify-center">
                    <CountdownTimer deadline={nextDeadline.date} />
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-gray-100 rounded-xl border-2 border-gray-200">
                <div className="text-center">
                  <div className="text-sm font-bold text-gray-600 mb-1">
                    活动已结束
                  </div>
                  <div className="text-xs text-gray-500">
                    所有截止日期已过
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}