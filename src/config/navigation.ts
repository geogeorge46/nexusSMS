import {
  BarChart3,
  Bell,
  BookOpen,
  BookOpenCheck,
  CalendarDays,
  CalendarRange,
  FileBarChart,
  FileArchive,
  GraduationCap,
  CircleHelp,
  LayoutDashboard,
  Settings,
  ShieldCheck,
  ScrollText,
  School,
  UserCheck,
  UserRound,
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

export const studentNavigation: NavItem[] = [
  { title: 'Dashboard', href: '/', icon: LayoutDashboard },
  { title: 'My Profile', href: '/my-profile', icon: UserRound },
  { title: 'My Courses', href: '/my-courses', icon: BookOpen },
  { title: 'My Timetable', href: '/my-timetable', icon: CalendarRange },
  { title: 'My Attendance', href: '/my-attendance', icon: CalendarDays },
  { title: 'My Grades', href: '/my-grades', icon: BarChart3 },
  { title: 'My Documents', href: '/my-documents', icon: FileArchive },
  { title: 'My Notifications', href: '/notifications', icon: Bell },
  { title: 'Academic Calendar', href: '/academic-calendar', icon: CalendarRange },
  { title: 'Help & Support', href: '/help-support', icon: CircleHelp },
  { title: 'Settings', href: '/settings', icon: Settings },
]

export const product = {
  name: 'Nexus',
  descriptor: 'Student Management',
  icon: GraduationCap,
}
