import { describe, expect, it } from 'vitest'
import { buildSearchString, parseSearchParams } from './useSyncUrl'

describe('parseSearchParams', () => {
  it('returns defaults on empty input', () => {
    const r = parseSearchParams(new URLSearchParams(''))
    expect(r).toEqual({
      selectedCategory: null,
      selectedTags: [],
      selectedLocations: [],
      searchQuery: '',
      showOnlyFavorites: false,
    })
  })

  it('parses single valid category', () => {
    expect(
      parseSearchParams(new URLSearchParams('category=conference')).selectedCategory,
    ).toBe('conference')
  })

  it('drops invalid category', () => {
    expect(
      parseSearchParams(new URLSearchParams('category=foo')).selectedCategory,
    ).toBeNull()
  })

  it('splits comma-separated tags and trims empty', () => {
    expect(
      parseSearchParams(new URLSearchParams('tag=AI,,ML,')).selectedTags,
    ).toEqual(['AI', 'ML'])
  })

  it('splits comma-separated locations', () => {
    expect(
      parseSearchParams(new URLSearchParams('location=Beijing,Shanghai')).selectedLocations,
    ).toEqual(['Beijing', 'Shanghai'])
  })

  it('preserves q exactly', () => {
    expect(
      parseSearchParams(new URLSearchParams('q=COSCon 2026')).searchQuery,
    ).toBe('COSCon 2026')
  })

  it('treats fav=1 as truthy and others as false', () => {
    expect(parseSearchParams(new URLSearchParams('fav=1')).showOnlyFavorites).toBe(true)
    expect(parseSearchParams(new URLSearchParams('fav=true')).showOnlyFavorites).toBe(false)
    expect(parseSearchParams(new URLSearchParams('')).showOnlyFavorites).toBe(false)
  })
})

describe('buildSearchString', () => {
  it('returns empty string when no filter is set', () => {
    expect(
      buildSearchString({
        selectedCategory: null,
        selectedTags: [],
        selectedLocations: [],
        searchQuery: '',
        showOnlyFavorites: false,
      }),
    ).toBe('')
  })

  it('builds full string', () => {
    const qs = buildSearchString({
      selectedCategory: 'conference',
      selectedTags: ['AI', 'ML'],
      selectedLocations: ['Beijing'],
      searchQuery: 'CV',
      showOnlyFavorites: true,
    })
    expect(qs).toContain('category=conference')
    expect(qs).toContain('tag=AI%2CML')
    expect(qs).toContain('location=Beijing')
    expect(qs).toContain('q=CV')
    expect(qs).toContain('fav=1')
  })

  it('round-trips through parseSearchParams', () => {
    const original = {
      selectedCategory: 'competition' as const,
      selectedTags: ['AI', 'CV'],
      selectedLocations: ['Beijing', 'Shanghai'],
      searchQuery: 'test query',
      showOnlyFavorites: true,
    }
    const qs = buildSearchString(original)
    const parsed = parseSearchParams(new URLSearchParams(qs))
    expect(parsed).toEqual(original)
  })

  it('trims query before writing', () => {
    const qs = buildSearchString({
      selectedCategory: null,
      selectedTags: [],
      selectedLocations: [],
      searchQuery: '   spaced   ',
      showOnlyFavorites: false,
    })
    expect(qs).toContain('q=spaced')
  })
})
