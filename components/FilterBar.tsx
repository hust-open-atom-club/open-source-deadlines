'use client'

import { TimezoneSelector } from '@/components/TimezoneSelector'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useEventStore } from '@/lib/store'
import { ChevronDown, ChevronUp, Search, Star } from 'lucide-react'
import { ReactNode, useState } from 'react'
import { useTranslation } from 'react-i18next'



// 可复用的过滤按钮组件
interface FilterButtonProps {
  isSelected: boolean;
  onClick: () => void;
  children: ReactNode;
  className?: string;
}

function FilterButton({ isSelected, onClick, children, className = '' }: FilterButtonProps) {
  return (
    <Button
      variant={isSelected ? 'default' : 'outline'}
      size="sm"
      className={`transition-colors ${
        isSelected 
          ? 'bg-primary hover:bg-primary/90' 
          : 'hover:bg-primary/10'
      } ${className} hover:cursor-pointer`}
      onClick={onClick}
    >
      {children}
    </Button>
  )
}

export function FilterBar() {
  const { t } = useTranslation('common');
  const {
    items,
    selectedCategory,
    selectedTags,
    selectedLocations,
    searchQuery,
    setCategory,
    toggleTag,
    toggleLocation,
    setSearchQuery,
    showOnlyFavorites,
    setShowOnlyFavorites,
    mounted,
  } = useEventStore()

  const [visibleTagCount, setVisibleTagCount] = useState(10)

  const categories = ['conference', 'competition', 'activity']
  
  // 统计每个标签的数量
  const tagCounts = items.reduce((acc, item) => {
    item.tags.forEach(tag => {
      acc[tag] = (acc[tag] || 0) + 1
    })
    return acc
  }, {} as Record<string, number>)
  
  const allTags = Array.from(new Set(items.flatMap(item => item.tags)))
    .sort((a, b) => tagCounts[b] - tagCounts[a]) // 按数量降序排序
  
  const displayedTags = allTags.slice(0, visibleTagCount)
  const hasMoreTags = allTags.length > visibleTagCount
  const remainingTags = allTags.length - visibleTagCount
  
  const allLocations = Array.from(new Set(
    items.flatMap(item => item.events.map(event => event.place))
  )).sort()
  
  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          type="text"
          placeholder={t('filter.searchPlaceholder')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Favorites and Timezone Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Favorites Toggle */}
        {mounted && (
          <div className="flex items-center space-x-2">
            <Switch
              id="favorites-only"
              checked={showOnlyFavorites}
              onCheckedChange={setShowOnlyFavorites}
            />
            <Label htmlFor="favorites-only" className="flex items-center gap-1.5">
              <Star className="w-4 h-4 text-yellow-500" />
              {t('filter.onlyFavorites')}
            </Label>
          </div>
        )}
        
        {/* 时区选择器 */}
        <TimezoneSelector />
      </div>

      {/* Categories */}
      <div>
  <h3 className="text-sm font-medium mb-2">{t('filter.category')}</h3>
        <div className="flex flex-wrap gap-2">
          <FilterButton 
            isSelected={selectedCategory === null}
            onClick={() => setCategory(null)}
          >
            {t('filter.all')}
          </FilterButton>
          {categories.map((category) => (
            <FilterButton
              key={category}
              isSelected={selectedCategory === category}
              onClick={() => setCategory(category)}
              className="capitalize"
            >
              {t(`filter.category_${category}`)}
            </FilterButton>
          ))}
        </div>
      </div>

      {/* Locations */}
      <div>
  <h3 className="text-sm font-medium mb-2">{t('filter.location')}</h3>
        <div className="flex flex-wrap gap-2">
          {allLocations.map((location) => (
            <FilterButton
              key={location}
              isSelected={selectedLocations.includes(location)}
              onClick={() => toggleLocation(location)}
            >
              {location}
            </FilterButton>
          ))}
        </div>
      </div>

      {/* Tags */}
      <div>
        <h3 className="text-sm font-medium mb-2">{t('filter.tag')}</h3>
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            {displayedTags.map((tag) => (
              <FilterButton
                key={tag}
                isSelected={selectedTags.includes(tag)}
                onClick={() => toggleTag(tag)}
              >
                {tag} <span className="ml-1 text-xs opacity-70">({tagCounts[tag]})</span>
              </FilterButton>
            ))}
          </div>
          {hasMoreTags && (
            <div className="flex gap-2">
              {remainingTags > 10 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setVisibleTagCount(allTags.length)}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  <ChevronDown className="w-3 h-3 mr-1" />
                  {t('filter.showAll')} ({remainingTags})
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (remainingTags <= 10) {
                    setVisibleTagCount(allTags.length)
                  } else {
                    setVisibleTagCount(prev => prev + 10)
                  }
                }}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                <ChevronDown className="w-3 h-3 mr-1" />
                {remainingTags <= 10 
                  ? `${t('filter.showMore')} (${remainingTags})`
                  : `${t('filter.showMore')} 10`
                }
              </Button>
            </div>
          )}
          {visibleTagCount > 10 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setVisibleTagCount(10)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              <ChevronUp className="w-3 h-3 mr-1" />
              {t('filter.showLess')}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}