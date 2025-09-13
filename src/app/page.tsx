import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        <div className="flex flex-col items-center justify-center space-y-8 text-center">
          <div className="space-y-4">
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
              Hotelix
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl">
              Système de gestion hôtelière moderne et intuitif
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Button asChild size="lg">
              <Link href="/auth">
                Se connecter / S'inscrire
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}