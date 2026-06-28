import { Attendance } from '../models/Attendance.js'
import { Course } from '../models/Course.js'
import { Grade } from '../models/Grade.js'
import { Notification } from '../models/Notification.js'
import { Student } from '../models/Student.js'
import { StudentCourse } from '../models/StudentCourse.js'
import { StudentDocument, documentCategories } from '../models/StudentDocument.js'
import { listNotifications, markNotificationRead } from './notificationService.js'
import { getStudentTimetable } from './timetableService.js'

export async function getStudentPortalProfile(user) {
  const student = await loadStudent(user.student.id)
  const [courses, timetable, attendance, grades, documents, notifications] = await Promise.all([
    listStudentPortalCourses(user),
    listStudentPortalTimetable(user),
    listStudentPortalAttendance(user),
    listStudentPortalGrades(user),
    listStudentPortalDocuments(user),
    Notification.countDocuments({ ...buildNotificationAudienceQuery(user), isRead: false }),
  ])
  const creditsCompleted = courses.items.reduce((sum, item) => sum + Number(item.course.credits || 0), 0)

  return {
    student: serializeStudent(student),
    summary: {
      enrolledCourses: courses.items.length,
      attendanceAverage: attendance.summary.average,
      gpa: grades.summary.gpa,
      cgpa: grades.summary.cgpa,
      creditsCompleted,
      creditsRemaining: Math.max(0, 160 - creditsCompleted),
      documents: documents.total,
      unreadNotifications: notifications,
      todayClasses: timetable.items.filter((item) => item.day === currentDay()).slice(0, 4),
      upcomingExams: buildUpcomingExams(grades.grades),
      pendingAssignments: [],
      recentDocuments: documents.documents.slice(0, 3),
    },
  }
}

export async function updateStudentPortalProfile(user, payload) {
  const student = await loadStudent(user.student.id)
  if (student.status !== 'Active') {
    const error = new Error('Only active students can update profile contact details')
    error.statusCode = 403
    throw error
  }

  const updates = {
    phone: cleanString(payload.phone),
    address: cleanString(payload.address),
    emergencyContact: cleanString(payload.emergencyContact),
    profilePhotoUrl: cleanString(payload.profilePhotoUrl),
  }

  for (const [key, value] of Object.entries(updates)) {
    if (value === undefined || value === '') delete updates[key]
  }

  if (Object.keys(updates).length === 0) {
    const error = new Error('No editable profile fields were provided')
    error.statusCode = 400
    throw error
  }

  const updated = await Student.findByIdAndUpdate(student._id, { $set: updates }, { returnDocument: 'after', runValidators: true }).lean()
  return serializeStudent(updated)
}

export async function listStudentPortalCourses(user) {
  const enrollments = await StudentCourse.find({ studentId: user.student.id, status: 'Enrolled' })
    .sort({ enrolledAt: -1 })
    .populate('courseId')
    .populate('academicYearId', 'name')
    .populate('semesterId', 'name number')
    .lean()

  const items = enrollments
    .filter((enrollment) => enrollment.courseId)
    .map((enrollment) => ({
      enrollmentId: enrollment._id.toString(),
      enrolledAt: formatDate(enrollment.enrolledAt),
      status: enrollment.status,
      academicYear: enrollment.academicYearId?.name ?? '',
      semester: enrollment.semesterId?.name ?? enrollment.courseId?.semester ?? '',
      course: serializeCourse(enrollment.courseId),
    }))

  return { items }
}

export async function listStudentPortalTimetable(user) {
  return getStudentTimetable(user.student.id)
}

export async function listStudentPortalAttendance(user) {
  const records = await Attendance.find({ studentId: user.student.id })
    .sort({ date: -1, createdAt: -1 })
    .populate('courseId', 'title courseNumber department')
    .lean()

  const history = records.map(serializeAttendance)
  return {
    summary: buildAttendanceSummary(history),
    history,
  }
}

export async function listStudentPortalGrades(user) {
  const records = await Grade.find({ studentId: user.student.id })
    .sort({ createdAt: -1 })
    .populate('courseId', 'title courseNumber department')
    .lean()
  const grades = records.map(serializeGrade)

  return {
    summary: {
      gpa: toGpa(mean(grades.map((grade) => grade.percentage))),
      cgpa: toGpa(mean(grades.map((grade) => grade.percentage))),
      graded: grades.length,
      pending: 0,
      atRisk: grades.filter((grade) => grade.percentage < 60).length,
    },
    grades,
  }
}

export async function listStudentPortalDocuments(user) {
  const records = await StudentDocument.find({ studentId: user.student.id }).sort({ uploadedAt: -1 }).lean()
  const documents = records.map(serializeDocument)

  return {
    documents,
    grouped: documentCategories.map((category) => ({
      category,
      count: documents.filter((document) => document.documentType === category).length,
    })),
    total: documents.length,
  }
}

export async function listStudentPortalNotifications(user, filters = {}) {
  return listNotifications({
    page: filters.page,
    limit: filters.limit,
    search: filters.search,
    isRead: filters.isRead,
    user,
  })
}

export async function markStudentPortalNotificationRead(user, notificationId) {
  return markNotificationRead(notificationId, user)
}

export function getStudentPortalCalendar() {
  const year = new Date().getFullYear()
  return {
    items: [
      { id: 'holiday-1', type: 'Holiday', title: 'Founders Day', date: `${year}-08-15`, description: 'Institution holiday' },
      { id: 'exam-1', type: 'Exam', title: 'Mid Semester Exams', date: `${year}-09-16`, description: 'Tentative exam window' },
      { id: 'event-1', type: 'Event', title: 'Career Readiness Week', date: `${year}-10-07`, description: 'Workshops and placement preparation' },
      { id: 'assignment-1', type: 'Assignment', title: 'Assignment review deadline', date: `${year}-10-21`, description: 'Placeholder for future assignment module' },
    ],
  }
}

export function getStudentPortalSupport() {
  return {
    contacts: [
      { label: 'Academic Office', value: 'academic.office@nexus.local' },
      { label: 'Exam Cell', value: 'exam.cell@nexus.local' },
      { label: 'Emergency Desk', value: '+91 90000 00000' },
    ],
    faqs: [
      { question: 'How do I correct profile data?', answer: 'Update phone/address here. Academic fields require office verification.' },
      { question: 'Why can I not see a course?', answer: 'Only enrolled courses appear. Contact the academic office if an enrollment is missing.' },
      { question: 'Can I edit attendance or grades?', answer: 'No. Attendance and grades are read-only for students.' },
    ],
  }
}

async function loadStudent(studentId) {
  const student = await Student.findById(studentId).lean()
  if (!student) {
    const error = new Error('Student profile not found')
    error.statusCode = 404
    throw error
  }
  return student
}

function serializeStudent(student) {
  return {
    id: student.registerNumber,
    databaseId: student._id.toString(),
    name: student.name,
    email: student.email,
    program: student.program,
    department: student.department,
    year: student.year,
    batch: student.batch ?? '',
    status: student.status,
    attendance: student.attendance,
    gpa: student.gpa,
    advisor: student.advisor,
    phone: student.phone,
    address: student.address,
    guardianName: student.guardianName ?? '',
    guardianPhone: student.guardianPhone ?? '',
    emergencyContact: student.emergencyContact ?? '',
    bloodGroup: student.bloodGroup ?? '',
    profilePhotoUrl: student.profilePhotoUrl ?? '',
    skills: student.skills ?? [],
    achievements: student.achievements ?? [],
    enrolledAt: formatDate(student.enrolledAt),
  }
}

function serializeCourse(course) {
  return {
    id: course.courseNumber,
    databaseId: course._id.toString(),
    title: course.title,
    code: course.code,
    department: course.department,
    program: course.program ?? '',
    faculty: course.faculty,
    credits: course.credits,
    schedule: course.schedule,
    room: course.room,
    semester: course.semester,
    status: course.status,
  }
}

function buildUpcomingExams(grades) {
  return grades
    .filter((grade) => /exam|internal|quiz/i.test(grade.assessmentType))
    .slice(0, 3)
    .map((grade) => ({
      id: grade.id,
      title: grade.assessmentType,
      course: grade.course,
      date: new Date(grade.createdAt).toISOString().slice(0, 10),
      status: 'Published',
    }))
}

function currentDay() {
  return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date().getDay()]
}

function buildNotificationAudienceQuery(user) {
  return {
    $or: [
      { 'recipient.userId': user.id },
      { 'recipient.userId': '', 'recipient.role': user.role },
    ],
  }
}

function serializeAttendance(record) {
  return {
    id: record._id.toString(),
    courseId: record.courseId?._id?.toString() ?? '',
    course: record.courseId?.title ?? 'Unknown Course',
    courseNumber: record.courseId?.courseNumber ?? '',
    department: record.courseId?.department ?? '',
    date: formatDate(record.date),
    status: record.status,
    remarks: record.remarks ?? '',
  }
}

function serializeGrade(record) {
  return {
    id: record._id.toString(),
    courseId: record.courseId?._id?.toString() ?? '',
    course: record.courseId?.title ?? 'Unknown Course',
    courseNumber: record.courseId?.courseNumber ?? '',
    department: record.courseId?.department ?? '',
    assessmentType: record.assessmentType,
    marksObtained: record.marksObtained,
    maxMarks: record.maxMarks,
    percentage: record.percentage,
    gradeLetter: record.gradeLetter,
    semester: record.semester,
    remarks: record.remarks,
    createdAt: record.createdAt,
  }
}

function serializeDocument(document) {
  return {
    _id: document._id.toString(),
    studentId: document.studentId?.toString() ?? '',
    documentType: document.documentType,
    category: document.documentType,
    title: document.title,
    fileName: document.fileName,
    originalName: document.fileName,
    fileUrl: document.fileUrl,
    secureUrl: document.fileUrl,
    mimeType: document.mimeType,
    fileSize: document.fileSize,
    size: document.fileSize,
    uploadedBy: document.uploadedBy,
    uploadedAt: document.uploadedAt,
    createdAt: document.uploadedAt,
    studentName: document.studentName,
    registerNumber: document.registerNumber,
    downloadUrl: document.downloadUrl,
    scanStatus: document.scanStatus,
  }
}

function buildAttendanceSummary(records) {
  const total = records.length
  const present = records.filter((record) => record.status === 'Present').length
  const late = records.filter((record) => record.status === 'Late').length
  const absent = records.filter((record) => record.status === 'Absent').length
  const excused = records.filter((record) => record.status === 'Excused').length
  const average = total > 0 ? Math.round(((present + late * 0.5 + excused) / total) * 1000) / 10 : 0

  return { average, present, absent, late, excused, total }
}

function toGpa(percentage) {
  return Math.round(Math.min(Math.max(percentage / 25, 0), 4) * 100) / 100
}

function mean(values) {
  return values.length ? values.reduce((sum, value) => sum + Number(value || 0), 0) / values.length : 0
}

function formatDate(value) {
  if (!value) return ''
  return new Date(value).toISOString().slice(0, 10)
}

function cleanString(value) {
  return typeof value === 'string' ? value.trim() : ''
}
