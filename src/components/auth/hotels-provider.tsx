import { getHotelsAction } from '@/app/actions/auth'
import { Hotel } from '@/lib/types/auth'

interface HotelsProviderProps {
  children: (hotels: Hotel[]) => React.ReactNode
}

export async function HotelsProvider({ children }: HotelsProviderProps) {
  const result = await getHotelsAction()

  const hotels = result.success ? result.data : []

  return <>{children(hotels || [])}</>
}