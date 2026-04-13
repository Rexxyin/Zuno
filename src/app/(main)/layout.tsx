import { BottomNav } from '@/components/BottomNav'

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto min-h-screen w-full max-w-sm px-4 pb-24 pt-4">
      {children}
      <BottomNav />
    </main>
  )
}
