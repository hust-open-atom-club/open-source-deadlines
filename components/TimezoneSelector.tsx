'use client'

import { useState, useEffect } from 'react'
import { Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useEventStore } from '@/lib/store'

export function TimezoneSelector() {
  const { displayTimezone, setDisplayTimezone, detectUserTimezone } = useEventStore()
  
  // 时区选择器相关状态
  const [timezones, setTimezones] = useState<string[]>([])
  const [searchTimeZone, setSearchTimeZone] = useState('')
  const [showTimezoneDropdown, setShowTimezoneDropdown] = useState(false)
  
  // 初始加载时区列表
  useEffect(() => {
    // 首先尝试从浏览器获取所有时区
    try {
      // 尝试使用Intl API获取所有可用时区
      const availableTimeZones = Intl.supportedValuesOf('timeZone');
      if (availableTimeZones && availableTimeZones.length > 0) {
        setTimezones(availableTimeZones);
        return;
      }
    } catch (e) {
      console.warn('Failed to get timezones from browser:', e);
    }
    
    // 如果浏览器API不可用，从timeapi.io获取
    fetch('https://www.timeapi.io/api/timezone/availabletimezones')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setTimezones(data);
        }
      })
      .catch(err => {
        console.error('Failed to fetch timezones:', err);
        // 设置一些常见的时区作为备选
        setTimezones(['Asia/Shanghai']);
      });
  }, []);
  
  // 点击外部关闭下拉菜单
  useEffect(() => {
    if (showTimezoneDropdown) {
      const handleClickOutside = (event: MouseEvent) => {
        const target = event.target as HTMLElement;
        if (!target.closest('.timezone-selector-container')) {
          setShowTimezoneDropdown(false);
        }
      };
      
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showTimezoneDropdown]);
  
  // 根据搜索过滤时区
  const filteredTimezones = searchTimeZone
    ? timezones.filter(tz => 
        tz.toLowerCase().includes(searchTimeZone.toLowerCase()))
    : timezones;

  return (
    <div className="relative timezone-selector-container">
      <div className="flex items-center gap-2">
        <div className="relative">
          <Button
            variant="outline"
            className="flex items-center gap-2 text-sm"
            onClick={() => setShowTimezoneDropdown(!showTimezoneDropdown)}
          >
            <Globe className="w-4 h-4" />
            <span>{displayTimezone}</span>
          </Button>
          
          {showTimezoneDropdown && (
            <div className="absolute z-50 mt-1 bg-white border rounded-md shadow-lg w-80 max-h-80 overflow-y-auto">
              <div className="p-2">
                <Input
                  type="text"
                  placeholder="搜索时区..."
                  value={searchTimeZone}
                  onChange={(e) => setSearchTimeZone(e.target.value)}
                  className="mb-2"
                />
                <div className="grid gap-1">
                  {filteredTimezones.map((tz) => (
                    <div
                      key={tz}
                      className={`px-3 py-2 text-sm rounded-md cursor-pointer hover:bg-gray-100 ${
                        displayTimezone === tz ? 'bg-primary/10 font-medium' : ''
                      }`}
                      onClick={() => {
                        setDisplayTimezone(tz);
                        setShowTimezoneDropdown(false);
                      }}
                    >
                      {tz}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => {
            detectUserTimezone();
            setShowTimezoneDropdown(false);
          }}
          className="whitespace-nowrap"
        >
          自动检测
        </Button>
      </div>
    </div>
  )
} 