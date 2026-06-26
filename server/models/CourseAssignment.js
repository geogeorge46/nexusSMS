import mongoose from 'mongoose'

const courseAssignmentSchema = new mongoose.Schema(
  {
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    staffId: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff', required: true, index: true },
    academicYearId: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademicYear', required: true, index: true },
    semesterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Semester', required: true, index: true },
    role: { type: String, enum: ['Primary', 'Assistant'], default: 'Primary' },
    status: { type: String, enum: ['Active', 'Inactive'], default: 'Active', index: true },
  },
  { timestamps: true },
)

courseAssignmentSchema.index(
  { courseId: 1, staffId: 1, academicYearId: 1, semesterId: 1 },
  { unique: true },
)

export const CourseAssignment = mongoose.model('CourseAssignment', courseAssignmentSchema)
