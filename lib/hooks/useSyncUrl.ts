'use client'

import { useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEventStore } from '@/lib/store'
import { ActivityCategory } from '@/lib/data'

const VALID_CATEGORIES: ActivityCategory[] = ['conference', 'competition', 'activity']

export function parseSearchParams(params: URLSearchParams) {
  const rawCategory = params.get('category')
  const selectedCategory =
    rawCategory && (VALID_CATEGORIES as string[]).includes(rawCategory)
      ? (rawCategory as ActivityCategory)
      : null
  const selectedTags = (params.get('tag') ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  const selectedLocations = (params.get('location') ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  const searchQuery = params.get('q') ?? ''
  const showOnlyFavorites = params.get('fav') === '1'
  return {
    selectedCategory,
    selectedTags,
    selectedLocations,
    searchQuery,
    showOnlyFavorites,
  }
}

export function buildSearchString(state: {
  selectedCategory: ActivityCategory | null
  selectedTags: string[]
  selectedLocations: string[]
  searchQuery: string
  showOnlyFavorites: boolean
}): string {
  const p = new URLSearchParams()
  if (state.selectedCategory) p.set('category', state.selectedCategory)
  if (state.selectedTags.length) p.set('tag', state.selectedTags.join(','))
  if (state.selectedLocations.length) p.set('location', state.selectedLocations.join(','))
  if (state.searchQuery.trim()) p.set('q', state.searchQuery.trim())
  if (state.showOnlyFavorites) p.set('fav', '1')
  return p.toString()
}

export function useSyncUrl() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const lastUrlWriteRef = useRef<string>('')
  const initializedRef = useRef(false)

  useEffect(() => {
    const incoming = searchParams.toString()
    if (incoming === lastUrlWriteRef.current && initializedRef.current) return
    const parsed = parseSearchParams(searchParams)
    useEventStore.setState(parsed)
    initializedRef.current = true
  }, [searchParams])

  useEffect(() => {
    const unsubscribe = useEventStore.subscribe((state) => {
      const qs = buildSearchString(state)
      if (qs === lastUrlWriteRef.current) return
      lastUrlWriteRef.current = qs
      router.replace(qs ? `?${qs}` : '?', { scroll: false })
    })
    return unsubscribe
  }, [router])
}
