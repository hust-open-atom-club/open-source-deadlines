'use client'

import { useState, useEffect } from 'react'
import { DateTime } from 'luxon'
import { useEventStore } from '@/lib/store'

interface CountdownTimerProps {
  deadline: DateTime
}

export function CountdownTimer({ deadline }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number
    hours: number
    minutes: number
    seconds: number
  } | null>(null)

  // 从全局状态获取显示时区
  const displayTimezone = useEventStore(state => state.displayTimezone)

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = DateTime.now().setZone(displayTimezone)
      const targetDeadline = deadline.setZone(displayTimezone)
      const difference = targetDeadline.toMillis() - now.toMillis()

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24))
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
        const seconds = Math.floor((difference % (1000 * 60)) / 1000)

        setTimeLeft({ days, hours, minutes, seconds })
      } else {
        setTimeLeft(null)
      }
    }

    calculateTimeLeft()
    const timer = setInterval(calculateTimeLeft, 1000)

    return () => clearInterval(timer)
  }, [deadline, displayTimezone])

  if (!timeLeft) {
    return (
      <div className="text-sm font-bold text-red-600 bg-red-100 px-3 py-2 rounded-lg">
        已过期
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center gap-1 sm:gap-1.5 flex-wrap">
      {timeLeft.days > 0 && (
        <div className="text-center">
          <div className="bg-gradient-to-b from-orange-500 to-orange-600 text-white px-2 sm:px-2.5 py-1.5 sm:py-2 rounded-lg font-bold text-sm sm:text-base min-w-[35px] sm:min-w-[40px] shadow-md">
            {timeLeft.days.toString().padStart(2, '0')}
          </div>
          <div className="text-xs text-orange-700 mt-1 font-medium">天</div>
        </div>
      )}
      <div className="text-center">
        <div className="bg-gradient-to-b from-orange-500 to-orange-600 text-white px-2 sm:px-2.5 py-1.5 sm:py-2 rounded-lg font-bold text-sm sm:text-base min-w-[35px] sm:min-w-[40px] shadow-md">
          {timeLeft.hours.toString().padStart(2, '0')}
        </div>
        <div className="text-xs text-orange-700 mt-1 font-medium">小时</div>
      </div>
      <div className="text-center">
        <div className="bg-gradient-to-b from-orange-500 to-orange-600 text-white px-2 sm:px-2.5 py-1.5 sm:py-2 rounded-lg font-bold text-sm sm:text-base min-w-[35px] sm:min-w-[40px] shadow-md">
          {timeLeft.minutes.toString().padStart(2, '0')}
        </div>
        <div className="text-xs text-orange-700 mt-1 font-medium">分钟</div>
      </div>
      <div className="text-center">
        <div className="bg-gradient-to-b from-orange-500 to-orange-600 text-white px-2 sm:px-2.5 py-1.5 sm:py-2 rounded-lg font-bold text-sm sm:text-base min-w-[35px] sm:min-w-[40px] shadow-md countdown-pulse">
          {timeLeft.seconds.toString().padStart(2, '0')}
        </div>
        <div className="text-xs text-orange-700 mt-1 font-medium">秒</div>
      </div>
    </div>
  )
}