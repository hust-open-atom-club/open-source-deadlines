import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useEventStore } from './store'
import type { QueryResult } from './data'

const INITIAL = useEventStore.getState()

function resetStore() {
  useEventStore.setState({
    items: [],
    facets: { categories: [], tags: [], locations: [] },
    allFacets: { categories: [], tags: [], locations: [] },
    total: 0,
    loading: true,
    hasLoaded: false,
    error: null,
    selectedCategory: null,
    selectedTags: [],
    selectedLocations: [],
    searchQuery: '',
    showOnlyFavorites: false,
    favorites: [],
  })
}

beforeEach(() => {
  resetStore()
})

afterEach(() => {
  vi.restoreAllMocks()
  useEventStore.setState(INITIAL)
})

describe('buildQueryString', () => {
  it('returns only pageSize=200 when no filter is set', () => {
    const qs = useEventStore.getState().buildQueryString()
    expect(qs).toBe('?pageSize=200')
  })

  it('encodes category', () => {
    useEventStore.setState({ selectedCategory: 'conference' })
    expect(useEventStore.getState().buildQueryString()).toBe(
      '?category=conference&pageSize=200',
    )
  })

  it('joins multiple tags with comma', () => {
    useEventStore.setState({ selectedTags: ['AI', 'ML'] })
    expect(useEventStore.getState().buildQueryString()).toContain('tag=AI%2CML')
  })

  it('joins multiple locations with comma', () => {
    useEventStore.setState({ selectedLocations: ['Beijing', 'Shanghai'] })
    expect(useEventStore.getState().buildQueryString()).toContain(
      'location=Beijing%2CShanghai',
    )
  })

  it('encodes search query trimmed', () => {
    useEventStore.setState({ searchQuery: '  COSCon  ' })
    expect(useEventStore.getState().buildQueryString()).toContain('q=COSCon')
  })

  it('skips q when only whitespace', () => {
    useEventStore.setState({ searchQuery: '   ' })
    expect(useEventStore.getState().buildQueryString()).toBe('?pageSize=200')
  })

  it('sends favorite ids only when showOnlyFavorites is true', () => {
    useEventStore.setState({
      favorites: ['a', 'b'],
      showOnlyFavorites: false,
    })
    expect(useEventStore.getState().buildQueryString()).not.toContain('favorite=')

    useEventStore.setState({ showOnlyFavorites: true })
    expect(useEventStore.getState().buildQueryString()).toContain('favorite=a%2Cb')
  })

  it('omits favorite param when favorites is empty even if toggle on', () => {
    useEventStore.setState({ showOnlyFavorites: true, favorites: [] })
    expect(useEventStore.getState().buildQueryString()).toBe('?pageSize=200')
  })

  it('combines all params', () => {
    useEventStore.setState({
      selectedCategory: 'conference',
      selectedTags: ['AI'],
      selectedLocations: ['Beijing'],
      searchQuery: 'CV',
      favorites: ['x'],
      showOnlyFavorites: true,
    })
    const qs = useEventStore.getState().buildQueryString()
    expect(qs).toContain('category=conference')
    expect(qs).toContain('tag=AI')
    expect(qs).toContain('location=Beijing')
    expect(qs).toContain('q=CV')
    expect(qs).toContain('favorite=x')
    expect(qs).toContain('pageSize=200')
  })
})

describe('toggleTag / toggleLocation / toggleFavorite', () => {
  it('toggleTag adds when absent and removes when present', () => {
    const { toggleTag } = useEventStore.getState()
    toggleTag('AI')
    expect(useEventStore.getState().selectedTags).toEqual(['AI'])
    toggleTag('AI')
    expect(useEventStore.getState().selectedTags).toEqual([])
  })

  it('toggleLocation idempotency', () => {
    const { toggleLocation } = useEventStore.getState()
    toggleLocation('Beijing')
    toggleLocation('Shanghai')
    expect(useEventStore.getState().selectedLocations).toEqual(['Beijing', 'Shanghai'])
    toggleLocation('Beijing')
    expect(useEventStore.getState().selectedLocations).toEqual(['Shanghai'])
  })

  it('toggleFavorite add/remove', () => {
    const { toggleFavorite } = useEventStore.getState()
    toggleFavorite('id-1')
    expect(useEventStore.getState().favorites).toEqual(['id-1'])
    toggleFavorite('id-1')
    expect(useEventStore.getState().favorites).toEqual([])
  })
})

describe('fetchQuery', () => {
  it('updates items / facets / total on success', async () => {
    const mockResult: QueryResult = {
      items: [],
      total: 3,
      page: 1,
      pageSize: 200,
      facets: {
        categories: [{ value: 'conference', count: 3 }],
        tags: [{ value: 'AI', count: 2 }],
        locations: [{ value: 'Beijing', count: 1 }],
      },
      allFacets: {
        categories: [
          { value: 'conference', count: 3 },
          { value: 'competition', count: 1 },
        ],
        tags: [
          { value: 'AI', count: 2 },
          { value: 'community', count: 5 },
        ],
        locations: [
          { value: 'Beijing', count: 1 },
          { value: 'Shanghai', count: 4 },
        ],
      },
    }
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResult,
    } as Response)
    vi.stubGlobal('fetch', fetchSpy)

    await useEventStore.getState().fetchQuery()

    expect(fetchSpy).toHaveBeenCalledWith('/api/activities?pageSize=200')
    const s = useEventStore.getState()
    expect(s.total).toBe(3)
    expect(s.facets.tags[0]).toEqual({ value: 'AI', count: 2 })
    expect(s.allFacets.tags).toHaveLength(2)
    expect(s.allFacets.categories.map((c) => c.value).sort()).toEqual([
      'competition',
      'conference',
    ])
    expect(s.loading).toBe(false)
    expect(s.hasLoaded).toBe(true)
    expect(s.error).toBeNull()
  })

  it('sets error on non-ok response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 500, json: async () => ({}) } as Response),
    )
    vi.spyOn(console, 'error').mockImplementation(() => {})

    await useEventStore.getState().fetchQuery()

    const s = useEventStore.getState()
    expect(s.loading).toBe(false)
    expect(s.error).toContain('500')
  })
})
