'use client'

import { EventCard } from '@/components/EventCard'
import { FilterBar } from '@/components/FilterBar'
import { SwitchLanguage } from '@/components/SwitchLanguage'
import { useEventStore } from '@/lib/store'
import { useSyncUrl } from '@/lib/hooks/useSyncUrl'
import { Calendar } from 'lucide-react'
import Link from 'next/link'
import { Suspense, useEffect } from 'react'
import { useTranslation } from 'react-i18next'

function HomeInner() {
  const {
    items,
    loading,
    hasLoaded,
    error,
    fetchQuery,
    selectedCategory,
    selectedTags,
    selectedLocations,
    searchQuery,
    favorites,
    showOnlyFavorites,
  } = useEventStore()

  useSyncUrl()

  useEffect(() => {
    fetchQuery()
  }, [
    fetchQuery,
    selectedCategory,
    selectedTags,
    selectedLocations,
    searchQuery,
    showOnlyFavorites,
    favorites,
  ])

  const { t, ready: translationReady } = useTranslation()

  if (!translationReady) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (loading && !hasLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">{t('events.loading')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="text-left mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center justify-start gap-3">
              <div className="p-3 bg-primary rounded-full">
                <Calendar className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-slate-900">
                {t('ui.title')}
              </h1>
            </div>
            <Link
              href="https://github.com/hust-open-atom-club/open-source-deadlines"
              target="_blank"
              rel="noopener noreferrer"
              className="border-2 rounded-lg overflow-auto"
              aria-label="GitHub Repository"
            >
              <img
                alt="GitHub Repo stars"
                className="h-8"
                src="https://img.shields.io/github/stars/hust-open-atom-club/open-source-deadlines?style=for-the-badge&logo=github&logoColor=white&labelColor=155dfc&color=white"
              />
            </Link>
          </div>
          <p className="text-lg text-slate-600 max-w-2xl leading-relaxed">
            {t('info.description')}
          </p>
          <p className="text-sm text-slate-600 mt-5">
            {t('info.timezone')}<br />
            {t('info.disclaimer')}
          </p>
          <div className="flex justify-between items-center mt-5">
            <div />
            <div>
              <SwitchLanguage />
            </div>
          </div>
        </header>

        {/* Filters */}
        <div className="bg-white rounded-xl p-6 shadow-sm border mb-8">
          <FilterBar />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg px-4 py-3 mb-4">
            {t('events.loadError', { defaultValue: 'Failed to load events.' })}{' '}
            <span className="text-xs opacity-70">({error})</span>
          </div>
        )}

        {/* Events List */}
        <div className="relative">
          {loading && hasLoaded && (
            <div className="absolute inset-x-0 -top-2 z-10 h-0.5 overflow-hidden rounded">
              <div className="h-full w-1/3 animate-[loading-bar_1.2s_ease-in-out_infinite] bg-primary" />
            </div>
          )}
          <div
            className={`space-y-4 transition-opacity duration-200 ${
              loading && hasLoaded ? 'opacity-60' : 'opacity-100'
            }`}
            aria-busy={loading}
          >
            {items.map(({ item, event }) => (
              <EventCard key={`${event.id}`} item={item} event={event} />
            ))}
          </div>
        </div>

        {!loading && items.length === 0 && !error && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">{t('events.notFound')}</h3>
            <p className="text-slate-600">{t('events.hint')}</p>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-16 text-center text-slate-600">
          <p className="text-sm">{t('acknowledgments.stack')}</p>
          <p className="text-sm">{' '}
            <Link
              href="https://github.com/inscripoem"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              {t('acknowledgments.contributor')}
            </Link>
            {' '} {t('acknowledgments.develop')}
            {' '} • {' '}
            <Link
              href="https://hust.openatom.club"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              {t('acknowledgments.organization')}
            </Link>
            {' '}{t('acknowledgments.support')}
          </p>
        </footer>
      </div>
    </div>
  )
}

export default function Home() {
  return (
    <Suspense fallback={null}>
      <HomeInner />
    </Suspense>
  )
}
