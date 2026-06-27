import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'

import { api } from '@/lib/api'
import type { Student } from '@/hooks/use-students'
import type { StudentDocument } from '@/lib/student-documents'
import type { NexusNotification, NotificationListResponse } from '@/lib/notifications'

export type PortalCourse = {
  enrollmentId: string
  enrolledAt: string
  status: 'Enrolled' | 'Dropped' | 'Completed'
  academicYear: string
  semester: string
  course: {
    id: string
    databaseId: string
    title: string
    code: string
    department: string
    program: string
    faculty: string
    credits: number
    schedule: string
    room: string
    semester: string
    status: string
  }
}

export type PortalAttendanceRecord = {
  id: string
  courseId: string
  course: string
  courseNumber: string
  department: string
  date: string
  status: 'Present' | 'Absent' | 'Late' | 'Excused'
  remarks: string
}

export type PortalGradeRecord = {
  id: string
  courseId: string
  course: string
  courseNumber: string
  department: string
  assessmentType: string
  marksObtained: number
  maxMarks: number
  percentage: number
  gradeLetter: string
  semester: string
  remarks: string
  createdAt: string
}

export type PortalProfileResponse = {
  student: Student
  summary: {
    enrolledCourses: number
    attendanceAverage: number
    gpa: number
    cgpa: number
    creditsCompleted: number
    creditsRemaining: number
    documents: number
    unreadNotifications: number
    todayClasses: PortalTimetableItem[]
    upcomingExams: Array<{ id: string; title: string; course: string; date: string; status: string }>
    pendingAssignments: Array<{ id: string; title: string; dueDate: string }>
    recentDocuments: StudentDocument[]
  }
}

export type PortalCoursesResponse = { items: PortalCourse[] }
export type PortalAttendanceResponse = {
  summary: {
    average: number
    present: number
    absent: number
    late: number
    excused: number
    total: number
  }
  history: PortalAttendanceRecord[]
}
export type PortalGradesResponse = {
  summary: {
    gpa: number
    cgpa: number
    graded: number
    pending: number
    atRisk: number
  }
  grades: PortalGradeRecord[]
}
export type PortalDocumentsResponse = {
  documents: StudentDocument[]
  grouped: { category: string; count: number }[]
  total: number
}
export type PortalTimetableItem = {
  id: string
  day: string
  time: string
  course: string
  courseCode: string
  room: string
  faculty: string
}
export type PortalTimetableResponse = { items: PortalTimetableItem[]; source: string }
export type PortalCalendarResponse = {
  items: Array<{ id: string; type: string; title: string; date: string; description: string }>
}
export type PortalSupportResponse = {
  contacts: Array<{ label: string; value: string }>
  faqs: Array<{ question: string; answer: string }>
}
export type StudentPortalProfilePayload = {
  phone?: string
  address?: string
  emergencyContact?: string
  profilePhotoUrl?: string
}

export function useStudentPortalProfile() {
  return useQuery({
    queryKey: ['student-portal', 'profile'],
    queryFn: async (): Promise<PortalProfileResponse> => (await api.get('/student-portal/me')).data,
  })
}

export function useUpdateStudentPortalProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: StudentPortalProfilePayload): Promise<Student> => {
      const response = await api.patch<{ student: Student }>('/student-portal/profile', payload)
      return response.data.student
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['student-portal'] })
    },
  })
}

export function useStudentPortalCourses() {
  return useQuery({
    queryKey: ['student-portal', 'courses'],
    queryFn: async (): Promise<PortalCoursesResponse> => (await api.get('/student-portal/courses')).data,
  })
}

export function useStudentPortalTimetable() {
  return useQuery({
    queryKey: ['student-portal', 'timetable'],
    queryFn: async (): Promise<PortalTimetableResponse> => (await api.get('/student-portal/timetable')).data,
  })
}

export function useStudentPortalAttendance() {
  return useQuery({
    queryKey: ['student-portal', 'attendance'],
    queryFn: async (): Promise<PortalAttendanceResponse> => (await api.get('/student-portal/attendance')).data,
  })
}

export function useStudentPortalGrades() {
  return useQuery({
    queryKey: ['student-portal', 'grades'],
    queryFn: async (): Promise<PortalGradesResponse> => (await api.get('/student-portal/grades')).data,
  })
}

export function useStudentPortalDocuments() {
  return useQuery({
    queryKey: ['student-portal', 'documents'],
    queryFn: async (): Promise<PortalDocumentsResponse> => (await api.get('/student-portal/documents')).data,
  })
}

export function useStudentPortalNotifications(page = 1, search = '') {
  return useQuery({
    queryKey: ['student-portal', 'notifications', page, search],
    queryFn: async (): Promise<NotificationListResponse> => (await api.get('/student-portal/notifications', {
      params: { page, limit: 8, search: search || undefined },
    })).data,
  })
}

export function useMarkStudentPortalNotificationRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (notificationId: string): Promise<NexusNotification> => {
      const response = await api.patch<NexusNotification>(`/student-portal/notifications/${notificationId}/read`, {})
      return response.data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['student-portal', 'notifications'] })
      void queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}

export function useStudentPortalCalendar() {
  return useQuery({
    queryKey: ['student-portal', 'calendar'],
    queryFn: async (): Promise<PortalCalendarResponse> => (await api.get('/student-portal/calendar')).data,
  })
}

export function useStudentPortalSupport() {
  return useQuery({
    queryKey: ['student-portal', 'support'],
    queryFn: async (): Promise<PortalSupportResponse> => (await api.get('/student-portal/support')).data,
  })
}

export function getStudentPortalErrorMessage(caught: unknown) {
  if (axios.isAxiosError<{ message?: string; details?: string[] }>(caught)) {
    return caught.response?.data?.details?.join(' ') ?? caught.response?.data?.message ?? 'Student portal request failed'
  }

  return caught instanceof Error ? caught.message : 'Student portal request failed'
}
