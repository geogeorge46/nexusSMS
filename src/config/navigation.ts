import {
  BarChart3,
  BookOpen,
  CalendarDays,
  FileBarChart,
  FileArchive,
  GraduationCap,
  LayoutDashboard,
  Settings,
  ShieldCheck,
  ScrollText,
  UsersRound,
  UserCog,
  type LucideIcon,
} from 'lucide-react'

export type NavItem = {
  title: string
  href: string
  icon: LucideIcon
  badge?: string
  superAdminOnly?: boolean
}

export const primaryNavigation: NavItem[] = [
  { title: 'Dashboard', href: '/', icon: LayoutDashboard },
  { title: 'Students', href: '/students', icon: UsersRound },
  { title: 'Documents', href: '/documents', icon: FileArchive },
  { title: 'Courses', href: '/courses', icon: BookOpen },
  { title: 'Attendance', href: '/attendance', icon: CalendarDays },
  { title: 'Grades', href: '/grades', icon: BarChart3 },
  { title: 'Reports', href: '/reports', icon: FileBarChart },
]

export const secondaryNavigation: NavItem[] = [
  { title: 'Admin Management', href: '/admins', icon: UserCog, superAdminOnly: true },
  { title: 'Audit Logs', href: '/audit-logs', icon: ScrollText },
  { title: 'Governance', href: '/governance', icon: ShieldCheck },
  { title: 'Settings', href: '/settings', icon: Settings },
]

export const product = {
  name: 'Nexus',
  descriptor: 'Student Management',
  icon: GraduationCap,
}
