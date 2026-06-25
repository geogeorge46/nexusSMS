import { motion } from 'framer-motion'

import { BrandMark } from '@/components/atoms/brand-mark'
import { NavLink } from '@/components/molecules/nav-link'
import { GlassCard } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { primaryNavigation, secondaryNavigation } from '@/config/navigation'
import { useAuth } from '@/hooks/use-auth'
import { useStudentCount } from '@/hooks/use-students'

type SidebarProps = {
  onNavigate?: () => void
}

export function Sidebar({ onNavigate }: SidebarProps) {
  const { user } = useAuth()
  const studentCount = useStudentCount()
  const navigation = primaryNavigation.map((item) =>
    item.href === '/students' && typeof studentCount.data === 'number'
      ? { ...item, badge: formatCount(studentCount.data) }
      : item,
  )
  const visibleSecondaryNavigation = secondaryNavigation.filter(
    (item) => !item.superAdminOnly || user?.role === 'Super Admin',
  )

  return (
    <aside className="flex h-full flex-col gap-5">
      <div className="px-2 pt-1">
        <BrandMark />
      </div>

      <nav className="flex flex-1 flex-col gap-2" aria-label="Primary navigation">
        {navigation.map((item, index) => (
          <motion.div
            key={item.href}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.035 }}
          >
            <NavLink item={item} onClick={onNavigate} />
          </motion.div>
        ))}
      </nav>

      <Separator />

      <nav className="flex flex-col gap-2" aria-label="Secondary navigation">
        {visibleSecondaryNavigation.map((item) => (
          <NavLink key={item.href} item={item} onClick={onNavigate} />
        ))}
      </nav>

      <GlassCard className="p-4">
        <div className="flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-2xl bg-emerald-500/12 text-emerald-700 dark:text-emerald-300">
            <span className="size-2.5 rounded-full bg-emerald-500" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">Campus Online</p>
            <p className="truncate text-xs font-medium text-muted-foreground">99.98% uptime</p>
          </div>
        </div>
      </GlassCard>
    </aside>
  )
}

function formatCount(count: number) {
  return new Intl.NumberFormat('en-US', {
    notation: count >= 1000 ? 'compact' : 'standard',
    maximumFractionDigits: 1,
  }).format(count)
}
