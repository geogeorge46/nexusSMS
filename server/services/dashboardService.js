import { Attendance } from '../models/Attendance.js'
import { AuditLog } from '../models/AuditLog.js'
import { Course } from '../models/Course.js'
import { Grade } from '../models/Grade.js'
import { Notification } from '../models/Notification.js'
import { Student } from '../models/Student.js'
import { StudentDocument } from '../models/StudentDocument.js'

const cache = new Map()
const cacheTtlMs = 30_000
const departmentColors = ['sky', 'emerald', 'violet', 'amber', 'rose']

export function getDashboardSummary(user) {
  return cached(`summary:${user.id}:${user.role}`, async () => {
    const [studentSummary, courseSummary, attendanceSummary, gradeSummary, documentsUploaded, notifications, latestAttendance] = await Promise.all([
      aggregateStudentSummary(),
      aggregateCourseSummary(),
      aggregateAttendanceSummary(),
      aggregateGradeSummary(),
      StudentDocument.countDocuments(),
      aggregateNotificationSummary(user),
      aggregateLatestAttendance(),
    ])
    const attendancePercentage = percentage(attendanceSummary.present, attendanceSummary.total)
    const averagePercentage = Math.round((gradeSummary.averagePercentage ?? 0) * 10) / 10
    const averageGpa = Math.round(Math.min(averagePercentage / 25, 4) * 100) / 100

    return {
      profile: { name: user.name, role: user.role, campus: 'Nexus Campus', term: getCurrentTerm() },
      stats: [
        stat('Total Students', studentSummary.total, `${studentSummary.active} active`, 'blue', 'students'),
        stat('Total Courses', courseSummary.total, `${courseSummary.enrolled} enrollments`, 'violet', 'courses'),
        stat('Active Courses', courseSummary.active, 'Available in catalog', 'green', 'courses'),
        stat('Attendance', `${attendancePercentage}%`, `${attendanceSummary.total} records`, 'green', 'attendance'),
        stat('Average GPA', averageGpa.toFixed(2), `${averagePercentage}% average grade`, 'amber', 'gpa'),
        stat('Documents Uploaded', documentsUploaded, 'Stored document records', 'blue', 'documents'),
        stat('Notifications', notifications.total, `${notifications.unread} unread`, 'violet', 'notifications'),
      ],
      widgets: {
        todayAttendance: {
          present: latestAttendance.present,
          absent: latestAttendance.absent,
          late: latestAttendance.late,
          excused: latestAttendance.excused,
          rate: `${percentage(latestAttendance.present, latestAttendance.total)}%`,
        },
      },
    }
  })
}

export function getDashboardCharts() {
  return cached('charts', async () => {
    const [departments, attendanceTrend, gradeDistribution, courseEnrollmentTrend, monthlyActivity] = await Promise.all([
      Student.aggregate([
        { $group: { _id: '$department', students: { $sum: 1 } } },
        { $sort: { students: -1, _id: 1 } },
      ]),
      Attendance.aggregate([
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } }, total: { $sum: 1 }, present: { $sum: { $cond: [{ $eq: ['$status', 'Present'] }, 1, 0] } }, late: { $sum: { $cond: [{ $eq: ['$status', 'Late'] }, 1, 0] } }, absent: { $sum: { $cond: [{ $eq: ['$status', 'Absent'] }, 1, 0] } } } },
        { $sort: { _id: -1 } }, { $limit: 14 }, { $sort: { _id: 1 } },
      ]),
      Grade.aggregate([
        { $group: { _id: '$gradeLetter', count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      Course.aggregate([
        { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, enrolled: { $sum: '$enrolled' } } },
        { $sort: { '_id.year': -1, '_id.month': -1 } }, { $limit: 6 }, { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]),
      AuditLog.aggregate([
        { $group: { _id: { year: { $year: '$timestamp' }, month: { $month: '$timestamp' } }, events: { $sum: 1 } } },
        { $sort: { '_id.year': -1, '_id.month': -1 } }, { $limit: 6 }, { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]),
    ])

    return {
      studentsByDepartment: departments.map((row, index) => ({ name: row._id || 'Unassigned', students: row.students, color: departmentColors[index % departmentColors.length] })),
      attendanceTrend: attendanceTrend.map((row) => ({ date: row._id, rate: percentage(row.present, row.total), present: row.present, late: row.late, absent: row.absent })),
      gradeDistribution: gradeDistribution.map((row) => ({ grade: row._id || 'N/A', count: row.count })),
      courseEnrollmentTrend: courseEnrollmentTrend.map((row) => ({ month: monthLabel(row._id.year, row._id.month), students: row.enrolled })),
      monthlyActivity: monthlyActivity.map((row) => ({ month: monthLabel(row._id.year, row._id.month), events: row.events })),
    }
  })
}

export function getDashboardActivity(user) {
  return cached(`activity:${user.id}:${user.role}`, async () => {
    const audience = notificationAudience(user)
    const [students, courses, auditLogs, notifications] = await Promise.all([
      Student.find().sort({ createdAt: -1 }).limit(4).select('name program status gpa createdAt').lean(),
      Course.find().sort({ createdAt: -1 }).limit(4).select('title faculty enrolled capacity status createdAt').lean(),
      AuditLog.find().sort({ timestamp: -1 }).limit(8).select('user role action module description ipAddress timestamp').lean(),
      Notification.find(audience).sort({ createdAt: -1 }).limit(4).select('title message type createdAt').lean(),
    ])

    return {
      recentStudents: students.map((student) => ({ id: student._id.toString(), name: student.name, program: student.program, status: student.status, gpa: Number(student.gpa ?? 0).toFixed(2) })),
      recentCourses: courses.map((course) => ({ id: course._id.toString(), name: course.title, faculty: course.faculty, enrolled: course.enrolled, capacity: course.capacity, trend: course.status })),
      recentActivity: auditLogs.slice(0, 6).map((event) => ({ id: event._id.toString(), title: event.description, time: formatRelativeTime(event.timestamp), type: event.module || event.action })),
      recentAuditLogs: auditLogs.map((event) => ({ id: event._id.toString(), user: event.user, role: event.role, action: event.action, module: event.module, description: event.description, ipAddress: event.ipAddress, time: formatRelativeTime(event.timestamp) })),
      notifications: notifications.map((notification) => ({ id: notification._id.toString(), title: notification.title, message: notification.message, type: normalizeNotificationType(notification.type), time: formatRelativeTime(notification.createdAt) })),
    }
  })
}

async function aggregateStudentSummary() {
  const [result = {}] = await Student.aggregate([{ $group: { _id: null, total: { $sum: 1 }, active: { $sum: { $cond: [{ $eq: ['$status', 'Active'] }, 1, 0] } } } }])
  return { total: result.total ?? 0, active: result.active ?? 0 }
}

async function aggregateCourseSummary() {
  const [result = {}] = await Course.aggregate([{ $group: { _id: null, total: { $sum: 1 }, active: { $sum: { $cond: [{ $eq: ['$status', 'Active'] }, 1, 0] } }, enrolled: { $sum: '$enrolled' } } }])
  return { total: result.total ?? 0, active: result.active ?? 0, enrolled: result.enrolled ?? 0 }
}

async function aggregateAttendanceSummary() {
  const [result = {}] = await Attendance.aggregate([{ $group: { _id: null, total: { $sum: 1 }, present: { $sum: { $cond: [{ $eq: ['$status', 'Present'] }, 1, 0] } } } }])
  return { total: result.total ?? 0, present: result.present ?? 0 }
}

async function aggregateGradeSummary() {
  const [result = {}] = await Grade.aggregate([{ $group: { _id: null, averagePercentage: { $avg: '$percentage' } } }])
  return { averagePercentage: result.averagePercentage ?? 0 }
}

async function aggregateNotificationSummary(user) {
  const audience = notificationAudience(user)
  const [result = {}] = await Notification.aggregate([
    { $match: audience },
    { $group: { _id: null, total: { $sum: 1 }, unread: { $sum: { $cond: [{ $eq: ['$isRead', false] }, 1, 0] } } } },
  ])
  return { total: result.total ?? 0, unread: result.unread ?? 0 }
}

async function aggregateLatestAttendance() {
  const [result = {}] = await Attendance.aggregate([
    { $group: { _id: '$date', total: { $sum: 1 }, present: statusCount('Present'), absent: statusCount('Absent'), late: statusCount('Late'), excused: statusCount('Excused') } },
    { $sort: { _id: -1 } }, { $limit: 1 },
  ])
  return { total: result.total ?? 0, present: result.present ?? 0, absent: result.absent ?? 0, late: result.late ?? 0, excused: result.excused ?? 0 }
}

function statusCount(status) {
  return { $sum: { $cond: [{ $eq: ['$status', status] }, 1, 0] } }
}

function notificationAudience(user) {
  return { $or: [{ 'recipient.userId': user.id }, { 'recipient.userId': '', 'recipient.role': user.role }] }
}

function cached(key, loader) {
  const hit = cache.get(key)
  if (hit && hit.expiresAt > Date.now()) return hit.value
  const value = Promise.resolve().then(loader)
  cache.set(key, { value, expiresAt: Date.now() + cacheTtlMs })
  value.catch(() => cache.delete(key))
  if (cache.size > 50) {
    for (const [cacheKey, entry] of cache) if (entry.expiresAt <= Date.now()) cache.delete(cacheKey)
  }
  return value
}

function stat(label, value, helper, tone, icon) {
  return { label, value: typeof value === 'number' ? value.toLocaleString() : value, helper, trend: 'Live', tone, icon }
}

function percentage(value, total) {
  return total ? Math.round((value / total) * 1000) / 10 : 0
}

function monthLabel(year, month) {
  return new Date(year, month - 1, 1).toLocaleString('en-US', { month: 'short' })
}

function normalizeNotificationType(type) {
  return ['success', 'warning'].includes(type) ? type : 'info'
}

function getCurrentTerm() {
  const now = new Date()
  const season = now.getMonth() < 5 ? 'Spring' : now.getMonth() < 8 ? 'Summer' : 'Fall'
  return `${season} ${now.getFullYear()}`
}

function formatRelativeTime(value) {
  const minutes = Math.max(Math.floor((Date.now() - new Date(value).getTime()) / 60000), 0)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hr ago`
  const days = Math.floor(hours / 24)
  return `${days} day${days === 1 ? '' : 's'} ago`
}
