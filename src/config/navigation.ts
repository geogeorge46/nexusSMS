import {
  BarChart3,
  Bell,
  BookOpen,
  BookOpenCheck,
  CalendarDays,
  CalendarRange,
  Clock,
  ClipboardList,
  FileBarChart,
  FileArchive,
  GraduationCap,
  CircleHelp,
  LayoutDashboard,
  LibraryBig,
  Settings,
  ShieldCheck,
  ScrollText,
  School,
  UserCheck,
  UserRound,
  UsersRound,
  UserCog,
  ReceiptText,
  WalletCards,
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
  { title: 'My Timetable', href: '/teacher-timetable', icon: Clock },
  { title: 'Grades', href: '/grades', icon: BarChart3 },
  { title: 'Exams', href: '/exams', icon: ClipboardList },
  { title: 'LMS', href: '/lms', icon: LibraryBig },
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
  { title: 'Fee Management', href: '/fees', icon: WalletCards },
  { title: 'Timetable', href: '/timetable', icon: Clock },
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
  { title: 'My Exams', href: '/my-exams', icon: ClipboardList },
  { title: 'My Assignments', href: '/my-assignments', icon: ClipboardList },
  { title: 'My Submissions', href: '/my-submissions', icon: BookOpenCheck },
  { title: 'Learning Materials', href: '/learning-materials', icon: LibraryBig },
  { title: 'My Hall Tickets', href: '/my-hall-tickets', icon: ReceiptText },
  { title: 'My Results', href: '/my-results', icon: BarChart3 },
  { title: 'My Attendance', href: '/my-attendance', icon: CalendarDays },
  { title: 'My Grades', href: '/my-grades', icon: BarChart3 },
  { title: 'My Documents', href: '/my-documents', icon: FileArchive },
  { title: 'My Fees', href: '/my-fees', icon: WalletCards },
  { title: 'My Receipts', href: '/my-receipts', icon: ReceiptText },
  { title: 'My Notifications', href: '/notifications', icon: Bell },
  { title: 'Academic Calendar', href: '/academic-calendar', icon: CalendarRange },
  { title: 'Help & Support', href: '/help-support', icon: CircleHelp },
  { title: 'Settings', href: '/settings', icon: Settings },
]

export const parentNavigation: NavItem[] = [
  { title: 'Dashboard', href: '/', icon: LayoutDashboard },
  { title: 'My Children', href: '/children', icon: UsersRound },
  { title: 'Attendance', href: '/child-attendance', icon: CalendarDays },
  { title: 'Grades', href: '/child-grades', icon: BarChart3 },
  { title: 'Fees', href: '/child-fees', icon: WalletCards },
  { title: 'Assignments', href: '/child-assignments', icon: ClipboardList },
  { title: 'Timetable', href: '/child-timetable', icon: CalendarRange },
  { title: 'Documents', href: '/child-documents', icon: FileArchive },
  { title: 'Notifications', href: '/parent-notifications', icon: Bell },
  { title: 'Help & Support', href: '/help-support', icon: CircleHelp },
  { title: 'Settings', href: '/settings', icon: Settings },
]

export const product = {
  name: 'Nexus',
  descriptor: 'Student Management',
  icon: GraduationCap,
}
