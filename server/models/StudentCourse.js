import mongoose from 'mongoose'

const studentCourseSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true, index: true },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    academicYearId: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademicYear', required: true, index: true },
    semesterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Semester', required: true, index: true },
    status: { type: String, enum: ['Enrolled', 'Dropped', 'Completed'], default: 'Enrolled', index: true },
    enrolledAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
)

studentCourseSchema.index(
  { studentId: 1, courseId: 1, academicYearId: 1, semesterId: 1 },
  { unique: true },
)

export const StudentCourse = mongoose.model('StudentCourse', studentCourseSchema)
