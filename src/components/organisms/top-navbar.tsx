import { Menu, Plus, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'

import { BrandMark } from '@/components/atoms/brand-mark'
import { ThemeToggle } from '@/components/atoms/theme-toggle'
import { SearchField } from '@/components/molecules/search-field'
import { NotificationBell } from '@/components/organisms/notification-bell'
import { Sidebar } from '@/components/organisms/sidebar'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from '@/components/ui/sheet'

export function TopNavbar() {
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/72 px-4 py-3 backdrop-blur-2xl sm:px-6">
      <div className="flex items-center gap-3">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button className="lg:hidden" aria-label="Open navigation" size="icon" type="button" variant="glass">
              <Menu />
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <SheetDescription className="sr-only">Primary Nexus navigation</SheetDescription>
            <Sidebar onNavigate={() => setOpen(false)} />
          </SheetContent>
        </Sheet>

        <BrandMark className="mr-1 lg:hidden" compact />
        <SearchField />

        <div className="ml-auto flex items-center gap-2">
          <Button className="hidden sm:inline-flex" type="button" variant="glass">
            <Sparkles />
            AI Assist
          </Button>
          <Button className="hidden sm:inline-flex" type="button">
            <Plus />
            New Record
          </Button>

          <ThemeToggle />

          <NotificationBell />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                aria-label="Open account menu"
                className="rounded-2xl outline-none transition focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                type="button"
              >
                <Avatar>
                  <AvatarFallback className="bg-primary text-primary-foreground">MC</AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Campus Admin</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/settings">Profile</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/">Command Center</Link>
              </DropdownMenuItem>
              <DropdownMenuItem>Sign out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
