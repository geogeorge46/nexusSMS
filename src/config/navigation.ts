import {
  BarChart3,
  BookOpen,
  BookOpenCheck,
  CalendarDays,
  CalendarRange,
  FileBarChart,
  FileArchive,
  GraduationCap,
  LayoutDashboard,
  Settings,
  ShieldCheck,
  ScrollText,
  School,
  UserCheck,
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
  { title: 'Departments', href: '/institution/departments', icon: School },
  { title: 'Programs', href: '/institution/programs', icon: GraduationCap },
  { title: 'Academic Years', href: '/institution/academic-years', icon: CalendarRange },
  { title: 'Semesters', href: '/institution/semesters', icon: CalendarDays },
  { title: 'Staff', href: '/institution/staff', icon: UserCheck },
  { title: 'Course Assignments', href: '/institution/course-assignments', icon: BookOpenCheck },
  { title: 'Enrollments', href: '/institution/enrollments', icon: UsersRound },
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
