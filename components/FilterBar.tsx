'use client'

import { useEventStore } from '@/lib/store'
import { Input } from '@/components/ui/input'
import { Search, Star } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { TimezoneSelector } from '@/components/TimezoneSelector'



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

  const categories = ['conference', 'competition', 'activity']
  const allTags = Array.from(new Set(items.flatMap(item => item.tags)))
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
        <div className="flex flex-wrap gap-2">
          {allTags.map((tag) => (
            <FilterButton
              key={tag}
              isSelected={selectedTags.includes(tag)}
              onClick={() => toggleTag(tag)}
            >
              {tag}
            </FilterButton>
          ))}
        </div>
      </div>
    </div>
  )
}