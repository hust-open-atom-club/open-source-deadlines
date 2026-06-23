import { create } from 'zustand'
import {
  ActivityCategory,
  Facets,
  FlatDeadline,
  QueryResult,
} from '@/lib/data'
import { persist, createJSONStorage } from 'zustand/middleware'

const EMPTY_FACETS: Facets = { categories: [], tags: [], locations: [] }

interface AppState {
  items: FlatDeadline[]
  facets: Facets
  allFacets: Facets
  total: number
  loading: boolean
  hasLoaded: boolean
  error: string | null
  selectedCategory: ActivityCategory | null
  selectedTags: string[]
  selectedLocations: string[]
  searchQuery: string
  favorites: string[]
  toggleFavorite: (id: string) => void
  showOnlyFavorites: boolean
  setShowOnlyFavorites: (show: boolean) => void
  mounted: boolean

  displayTimezone: string
  setDisplayTimezone: (timezone: string) => void
  detectUserTimezone: () => void

  fetchQuery: () => Promise<void>
  buildQueryString: () => string
  setCategory: (category: ActivityCategory | null) => void
  toggleTag: (tag: string) => void
  toggleLocation: (location: string) => void
  setSearchQuery: (query: string) => void
}

export const useEventStore = create<AppState>()(
  persist(
    (set, get) => ({
      items: [],
      facets: EMPTY_FACETS,
      allFacets: EMPTY_FACETS,
      total: 0,
      loading: true,
      hasLoaded: false,
      error: null,
      selectedCategory: null,
      selectedTags: [],
      selectedLocations: [],
      searchQuery: '',
      favorites: [],
      showOnlyFavorites: false,
      mounted: false,

      displayTimezone: 'Asia/Shanghai',

      toggleFavorite: (id: string) =>
        set((state) => ({
          favorites: state.favorites.includes(id)
            ? state.favorites.filter((favId) => favId !== id)
            : [...state.favorites, id],
        })),
      setShowOnlyFavorites: (show: boolean) => set({ showOnlyFavorites: show }),

      buildQueryString: () => {
        const s = get()
        const p = new URLSearchParams()
        if (s.selectedCategory) p.set('category', s.selectedCategory)
        if (s.selectedTags.length) p.set('tag', s.selectedTags.join(','))
        if (s.selectedLocations.length) p.set('location', s.selectedLocations.join(','))
        if (s.searchQuery.trim()) p.set('q', s.searchQuery.trim())
        if (s.showOnlyFavorites && s.favorites.length) {
          p.set('favorite', s.favorites.join(','))
        }
        p.set('pageSize', '200')
        const str = p.toString()
        return str ? `?${str}` : ''
      },

      fetchQuery: async () => {
        set({ loading: true, error: null })
        const qs = get().buildQueryString()
        try {
          const res = await fetch(`/api/activities${qs}`)
          if (!res.ok) throw new Error(`HTTP ${res.status}`)
          const result: QueryResult = await res.json()
          set({
            items: result.items,
            facets: result.facets,
            allFacets: result.allFacets,
            total: result.total,
            loading: false,
            hasLoaded: true,
          })
        } catch (err) {
          console.error('Failed to load data:', err)
          set({
            loading: false,
            error: err instanceof Error ? err.message : 'Failed to load',
          })
        }
      },

      setDisplayTimezone: (timezone: string) => set({ displayTimezone: timezone }),

      detectUserTimezone: () => {
        try {
          const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone
          if (userTimezone) {
            set({ displayTimezone: userTimezone })
          }
        } catch (err) {
          console.error('Failed to detect user timezone:', err)
        }
      },

      setCategory: (category) => set({ selectedCategory: category }),

      toggleTag: (tag) =>
        set((state) => ({
          selectedTags: state.selectedTags.includes(tag)
            ? state.selectedTags.filter((t) => t !== tag)
            : [...state.selectedTags, tag],
        })),

      toggleLocation: (location) =>
        set((state) => ({
          selectedLocations: state.selectedLocations.includes(location)
            ? state.selectedLocations.filter((l) => l !== location)
            : [...state.selectedLocations, location],
        })),

      setSearchQuery: (query) => set({ searchQuery: query }),
    }),
    {
      name: 'favorites-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        favorites: state.favorites,
        displayTimezone: state.displayTimezone,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.mounted = true
        }
      },
    },
  ),
)
