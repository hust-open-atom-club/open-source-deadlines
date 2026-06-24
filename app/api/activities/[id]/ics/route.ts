import { NextRequest, NextResponse } from 'next/server'
import { loadDataset } from '@/lib/server/data-source'
import { getEventById } from '@/lib/server/query'
import { buildEventIcs } from '@/lib/server/ical'
import type { DeadlineItem } from '@/lib/data'

function sanitizeFilename(input: string): string {
  return input.replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^-+|-+$/g, '') || 'calendar'
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  if (!id) {
    return NextResponse.json({ error: 'Missing event id' }, { status: 400 })
  }

  try {
    const source: DeadlineItem[] = await loadDataset()
    const match = getEventById(source, id)

    if (!match) {
      return NextResponse.json(
        { error: `Event "${id}" not found` },
        { status: 404 },
      )
    }

    const result = buildEventIcs(match.item, match.event)
    if ('error' in result) {
      console.warn(`[ics] No renderable deadlines for ${id}:`, result.error.message)
      return NextResponse.json(
        { error: 'No renderable deadlines for this event' },
        { status: 422 },
      )
    }

    const filename = `${sanitizeFilename(match.event.id)}.ics`

    return new NextResponse(result.value, {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `inline; filename="${filename}"`,
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600',
      },
    })
  } catch (error) {
    console.error(`Failed to build ICS for ${id}:`, error)
    return NextResponse.json(
      { error: 'Failed to build calendar feed' },
      { status: 500 },
    )
  }
}
