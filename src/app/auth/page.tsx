import { Suspense } from 'react'
import { AuthPageContent } from '@/components/auth/auth-page-content'
import { HotelsProvider } from '@/components/auth/hotels-provider'

export default function AuthPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-md space-y-8">
        <div className="bg-card border rounded-lg shadow-sm p-8">
          <Suspense fallback={
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-muted rounded w-3/4 mx-auto"></div>
              <div className="h-4 bg-muted rounded w-1/2 mx-auto"></div>
              <div className="space-y-2">
                <div className="h-8 bg-muted rounded"></div>
                <div className="h-8 bg-muted rounded"></div>
                <div className="h-8 bg-muted rounded"></div>
                <div className="h-10 bg-muted rounded"></div>
              </div>
            </div>
          }>
            <HotelsProvider>
              {(hotels) => <AuthPageContent hotels={hotels} />}
            </HotelsProvider>
          </Suspense>
        </div>
      </div>
    </div>
  )
}