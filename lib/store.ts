import { create } from 'zustand'
import { DeadlineItem } from '@/lib/data'
import { persist, createJSONStorage } from 'zustand/middleware'

interface AppState {
  items: DeadlineItem[]
  loading: boolean
  selectedCategory: string | null
  selectedTags: string[]
  selectedLocations: string[]
  searchQuery: string
  favorites: string[]
  toggleFavorite: (id: string) => void
  showOnlyFavorites: boolean
  setShowOnlyFavorites: (show: boolean) => void
  mounted: boolean
  
  // 时区相关状态
  displayTimezone: string
  setDisplayTimezone: (timezone: string) => void
  detectUserTimezone: () => void
  
  fetchItems: () => Promise<void>
  setCategory: (category: string | null) => void
  toggleTag: (tag: string) => void
  toggleLocation: (location: string) => void
  setSearchQuery: (query: string) => void
}

export const useEventStore = create<AppState>()(
  persist(
    (set) => ({
      // State
      items: [],
      loading: true,
      selectedCategory: null,
      selectedTags: [],
      selectedLocations: [],
      searchQuery: '',
      favorites: [],
      showOnlyFavorites: false,
      mounted: false,
      
      // 默认使用上海时区
      displayTimezone: "Asia/Shanghai",

      // Actions
      toggleFavorite: (id: string) =>
        set((state) => ({
          favorites: state.favorites.includes(id)
            ? state.favorites.filter((favId) => favId !== id)
            : [...state.favorites, id],
        })),
      setShowOnlyFavorites: (show: boolean) => set({ showOnlyFavorites: show }),
      fetchItems: async () => {
        set({ loading: true })
        try {
          const res = await fetch('/api/data')
          const data = await res.json()
          set({ items: data, loading: false })
        } catch (err) {
          console.error('Failed to load data:', err)
          set({ loading: false })
        }
      },
      
      // 设置时区
      setDisplayTimezone: (timezone: string) => set({ displayTimezone: timezone }),
      
      // 检测用户本地时区
      detectUserTimezone: () => {
        try {
          const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
          if (userTimezone) {
            set({ displayTimezone: userTimezone });
          }
        } catch (err) {
          console.error('Failed to detect user timezone:', err);
          // 如果检测失败，保持当前时区不变
        }
      },
      
      setCategory: (category) => set({ selectedCategory: category }),

      toggleTag: (tag) => set(state => ({
        selectedTags: state.selectedTags.includes(tag)
          ? state.selectedTags.filter(t => t !== tag)
          : [...state.selectedTags, tag]
      })),

      toggleLocation: (location) => set(state => ({
        selectedLocations: state.selectedLocations.includes(location)
          ? state.selectedLocations.filter(l => l !== location)
          : [...state.selectedLocations, location]
      })),

      setSearchQuery: (query) => set({ searchQuery: query }),
    }),
    {
      name: 'favorites-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ 
        favorites: state.favorites,
        displayTimezone: state.displayTimezone // 保存用户选择的时区
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.mounted = true
        }
      }
    }
  )
) 