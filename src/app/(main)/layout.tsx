import { CityProvider } from '@/components/CityContext'
import { TopNav } from '@/components/TopNav'

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <CityProvider>
      <main className="w-full min-h-screen app-surface">
        <TopNav />
        {children}
      </main>
    </CityProvider>
  )
}
