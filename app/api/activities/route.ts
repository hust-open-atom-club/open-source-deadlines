import { NextRequest, NextResponse } from 'next/server'
import { loadDataset } from '@/lib/server/data-source'
import { queryActivities } from '@/lib/server/query'
import {
  ActivityCategory,
  DeadlineItem,
  QueryParams,
  SortKey,
} from '@/lib/data'

const VALID_CATEGORIES: ActivityCategory[] = ['conference', 'competition', 'activity']
const VALID_SORTS: SortKey[] = ['next-deadline']

export const dynamic = 'force-dynamic'

function readMulti(searchParams: URLSearchParams, key: string): string[] {
  return searchParams
    .getAll(key)
    .map((v) => v.trim())
    .filter((v) => v.length > 0)
}

function readPositiveInt(value: string | null, fallback: number): number {
  if (!value) return fallback
  const n = Number.parseInt(value, 10)
  if (!Number.isFinite(n) || n <= 0) return fallback
  return n
}

function parseQueryParams(searchParams: URLSearchParams): QueryParams {
  const params: QueryParams = {}

  const category = readMulti(searchParams, 'category').filter((c): c is ActivityCategory =>
    (VALID_CATEGORIES as string[]).includes(c),
  )
  if (category.length > 0) params.category = category

  const tags = readMulti(searchParams, 'tag')
  if (tags.length > 0) params.tags = tags

  const locations = readMulti(searchParams, 'location')
  if (locations.length > 0) params.locations = locations

  const favorites = readMulti(searchParams, 'favorite')
  if (favorites.length > 0) params.favorites = favorites

  const q = searchParams.get('q')?.trim()
  if (q) params.q = q

  const sort = searchParams.get('sort')
  if (sort && (VALID_SORTS as string[]).includes(sort)) {
    params.sort = sort as SortKey
  }

  params.page = readPositiveInt(searchParams.get('page'), 1)
  params.pageSize = readPositiveInt(searchParams.get('pageSize'), 20)

  const now = searchParams.get('now')
  if (now) params.now = now

  return params
}

export async function GET(req: NextRequest) {
  try {
    const params = parseQueryParams(req.nextUrl.searchParams)
    const source: DeadlineItem[] = await loadDataset()
    const result = queryActivities(source, params)
    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    console.error('Failed to query activities:', error)
    return NextResponse.json(
      { error: 'Failed to query activities' },
      { status: 500 },
    )
  }
}
