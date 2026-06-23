import { NavLink as RouterNavLink } from 'react-router-dom'

import { Badge } from '@/components/ui/badge'
import type { NavItem } from '@/config/navigation'
import { cn } from '@/lib/utils'

type NavLinkProps = {
  item: NavItem
  onClick?: () => void
}

export function NavLink({ item, onClick }: NavLinkProps) {
  const Icon = item.icon

  return (
    <RouterNavLink
      to={item.href}
      onClick={onClick}
      className={({ isActive }) =>
        cn(
          'group flex min-h-11 items-center gap-3 rounded-[16px] px-3 text-sm font-semibold text-muted-foreground outline-none transition hover:bg-muted/80 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring',
          isActive && 'bg-primary text-primary-foreground shadow-soft hover:bg-primary hover:text-primary-foreground',
        )
      }
    >
      <Icon className="size-4 shrink-0" aria-hidden="true" />
      <span className="min-w-0 flex-1 truncate">{item.title}</span>
      {item.badge && (
        <Badge className="border-white/20 bg-white/20 px-2 py-0.5 text-[11px] text-inherit">
          {item.badge}
        </Badge>
      )}
    </RouterNavLink>
  )
}
