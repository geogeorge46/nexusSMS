import { Outlet } from 'react-router-dom'

import { Sidebar } from '@/components/organisms/sidebar'
import { TopNavbar } from '@/components/organisms/top-navbar'
import { Footer } from '@/components/organisms/footer'

export function AppShell() {
  return (
    <div className="min-h-screen overflow-hidden bg-background text-foreground">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.18),transparent_34%),radial-gradient(circle_at_85%_12%,rgba(16,185,129,0.12),transparent_28%),linear-gradient(135deg,rgba(248,250,252,0.94),rgba(241,245,249,0.7))] dark:bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.16),transparent_32%),radial-gradient(circle_at_80%_15%,rgba(139,92,246,0.13),transparent_28%),linear-gradient(135deg,#05070b,#10131c)]" />
      <div className="grid min-h-screen lg:grid-cols-[288px_minmax(0,1fr)]">
        <div className="hidden border-r border-border/60 bg-background/54 p-4 backdrop-blur-2xl lg:block">
          <Sidebar />
        </div>

        <div className="flex min-w-0 flex-col">
          <TopNavbar />
          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
            <Outlet />
          </main>
          <Footer />
        </div>
      </div>
    </div>
  )
}
