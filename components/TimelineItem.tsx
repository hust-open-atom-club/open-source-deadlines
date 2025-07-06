'use client'

import { TimelineEvent } from '@/lib/data'
import { DateTime } from "luxon"
import { useState, useRef, useEffect } from 'react'
import { useEventStore } from '@/lib/store'
import { formatTimezoneToUTC } from '@/lib/utils'

interface TimelineItemProps {
  event: TimelineEvent
  timezone: string // YAML中指定的原始时区
  isEnded: boolean
  isActive?: boolean
  isUpcoming?: boolean // 新增，表示是否为未来蓝色节点
  totalEvents: number
  index: number
}

export function TimelineItem({ event, timezone, isEnded, isActive = false, isUpcoming = false, totalEvents, index }: TimelineItemProps) {
  const [showTooltip, setShowTooltip] = useState(false)
  const [tooltipStyle, setTooltipStyle] = useState({ left: 0, top: 0, arrowOffset: 0 })
  const dotRef = useRef<HTMLDivElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  
  // 从全局状态获取显示时区
  const displayTimezone = useEventStore(state => state.displayTimezone)
  
  // 正确处理时区：将原始字符串解析为指定时区的日期
  const deadlineDate = DateTime.fromISO(event.deadline, { zone: timezone })
  
  // 计算时间线上点的位置 (10% 到 90% 的范围)
  const position = totalEvents > 1 ? (index / (totalEvents - 1)) * 80 + 10 : 50

  // 计算并调整tooltip位置
  useEffect(() => {
    if (!showTooltip || !dotRef.current || isEnded) return;
    
    const calculatePosition = () => {
      const rect = dotRef.current?.getBoundingClientRect();
      if (!rect) return;
      
      let xPos = rect.left + rect.width / 2;
      const yPos = rect.top;
      let arrowOffset = 0;
      
      // 在tooltip渲染后调整位置，避免被屏幕边缘裁切
      requestAnimationFrame(() => {
        if (tooltipRef.current) {
          const tooltipWidth = tooltipRef.current.offsetWidth;
          const viewportWidth = window.innerWidth;
          
          // 左边缘检查
          if (xPos - tooltipWidth / 2 < 10) {
            arrowOffset = (tooltipWidth / 2) - (xPos - 10);
            xPos = 10 + tooltipWidth / 2;
          }
          // 右边缘检查
          else if (xPos + tooltipWidth / 2 > viewportWidth - 10) {
            arrowOffset = -((viewportWidth - 10) - xPos - tooltipWidth / 2);
            xPos = viewportWidth - 10 - tooltipWidth / 2;
          }
          
          setTooltipStyle({
            left: xPos,
            top: yPos - 10,
            arrowOffset
          });
        }
      });
    };
    
    calculatePosition();
    window.addEventListener('resize', calculatePosition);
    return () => window.removeEventListener('resize', calculatePosition);
  }, [showTooltip, isEnded]);

  // 只有在非结束状态时才显示tooltip
  const handleMouseEnter = () => !isEnded && setShowTooltip(true);

  // 点的样式类
  const dotClasses = `
    w-3 h-3 rounded-full border-2 shadow-sm transition-all duration-300 cursor-pointer
    ${isActive ? 'bg-orange-500 border-orange-300 ring-2 ring-orange-200 scale-125' :
      isUpcoming ? 'bg-blue-500 border-blue-300' :
      'bg-gray-400 border-gray-300'}
    ${isEnded ? 'opacity-50' : ''}
    ${showTooltip ? 'scale-125' : ''}
  `;
  
  // 日期显示样式类
  const dateClasses = `
    absolute top-full mt-1 text-center transition-all duration-300
    ${isEnded ? 'opacity-50' : ''}
  `;

  // 转换时区为UTC偏移格式
  const displayTimezoneUTC = formatTimezoneToUTC(displayTimezone);
  const originalTimezoneUTC = formatTimezoneToUTC(timezone);

  return (
    <>
      <div 
        className="absolute flex flex-col items-center"
        style={{ 
          left: `${position}%`,
          transform: 'translateX(-50%)',
          top: '50%',
          marginTop: '-6px'
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setShowTooltip(false)}
        ref={dotRef}
      >
        {/* Timeline dot */}
        <div className={dotClasses} />
        
        {/* Date display */}
        <div className={dateClasses}>
          <div className={`text-xs font-medium whitespace-nowrap ${
            isActive ? 'text-orange-700 font-bold' : 'text-gray-600'
          }`}>
            {deadlineDate.setZone(displayTimezone).toFormat('MM-dd')}
          </div>
        </div>
      </div>

      {/* Tooltip */}
      {showTooltip && !isEnded && (
        <div 
          className="fixed z-50 pointer-events-none"
          style={{ 
            left: `${tooltipStyle.left}px`, 
            top: `${tooltipStyle.top}px`,
            transform: 'translate(-50%, -100%)'
          }}
          ref={tooltipRef}
        >
          <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap shadow-lg">
            <div className="font-medium">{event.comment}</div>
            <div className="text-gray-300">
              {deadlineDate.setZone(displayTimezone).toFormat('yyyy-MM-dd HH:mm:ss')} ({displayTimezoneUTC})
            </div>
            <div className="text-gray-300">
              {deadlineDate.toFormat('yyyy-MM-dd HH:mm:ss')} ({originalTimezoneUTC}, 原始时区)
            </div>
            
            {/* Arrow (desktop only) */}
            <div 
              className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900 hidden md:block"
              style={{ marginLeft: `${tooltipStyle.arrowOffset}px` }}
            />
          </div>
        </div>
      )}
    </>
  )
}