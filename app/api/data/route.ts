import { NextResponse } from 'next/server'
import { loadDataset } from '@/lib/server/data-source'

export async function GET() {
  try {
    const data = await loadDataset()
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=600',
      },
    })
  } catch (error) {
    console.error('Failed to load data:', error)
    return NextResponse.json({ error: 'Failed to load data' }, { status: 500 })
  }
}
