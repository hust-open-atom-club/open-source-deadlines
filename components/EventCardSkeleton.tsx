import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function EventCardSkeleton() {
  return (
    <Card>
      <CardContent>
        <div className="flex flex-col md:flex-row md:gap-6">
          <div className="flex-1 space-y-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Skeleton className="h-7 w-24 rounded-lg" />
                <Skeleton className="h-6 flex-1 max-w-[60%]" />
                <Skeleton className="h-5 w-12 rounded-md" />
              </div>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>

            <div className="flex flex-wrap gap-1.5">
              <Skeleton className="h-5 w-16 rounded-md" />
              <Skeleton className="h-5 w-20 rounded-md" />
              <Skeleton className="h-5 w-14 rounded-md" />
            </div>

            <div className="flex flex-col sm:flex-row md:flex-col md:items-start lg:flex-row sm:items-center gap-2 sm:gap-4">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-28" />
            </div>
          </div>

          <div className="hidden md:block md:w-1/2">
            <div className="flex flex-col gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-4 rounded-full" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="ml-auto h-8 w-24 rounded-md" />
                </div>
                <Skeleton className="h-16 w-full rounded-lg" />
              </div>
              <Skeleton className="h-24 w-full rounded-xl" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function EventCardSkeletonList({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading events">
      {Array.from({ length: count }).map((_, i) => (
        <EventCardSkeleton key={i} />
      ))}
    </div>
  )
}

export function PageSkeleton() {
  return (
    <div
      className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100"
      aria-busy="true"
      aria-label="Loading page"
    >
      <div className="container mx-auto px-4 py-8">
        <header className="text-left mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center justify-start gap-3">
              <Skeleton className="h-14 w-14 rounded-full" />
              <Skeleton className="h-9 w-72" />
            </div>
            <Skeleton className="h-8 w-32 rounded-lg" />
          </div>
          <Skeleton className="h-6 w-full max-w-2xl" />
          <div className="mt-5 space-y-2">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          <div className="flex justify-end mt-5">
            <Skeleton className="h-9 w-28 rounded-md" />
          </div>
        </header>

        <div className="bg-white rounded-xl p-6 shadow-sm border mb-8">
          <div className="space-y-4">
            <Skeleton className="h-10 w-full rounded-md" />
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-8 w-20 rounded-md" />
              <Skeleton className="h-8 w-24 rounded-md" />
              <Skeleton className="h-8 w-16 rounded-md" />
              <Skeleton className="h-8 w-28 rounded-md" />
              <Skeleton className="h-8 w-20 rounded-md" />
            </div>
          </div>
        </div>

        <div className="relative">
          <EventCardSkeletonList />
        </div>

        <footer className="mt-16 flex flex-col items-center gap-2">
          <Skeleton className="h-4 w-64" />
          <Skeleton className="h-4 w-80" />
        </footer>
      </div>
    </div>
  )
}
