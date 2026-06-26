import mongoose from 'mongoose'

const courseSchema = new mongoose.Schema(
  {
    courseNumber: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    code: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      index: true,
    },
    department: { type: String, required: true, trim: true, index: true },
    program: { type: String, trim: true, default: '' },
    faculty: { type: String, required: true, trim: true },
    departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', index: true },
    programId: { type: mongoose.Schema.Types.ObjectId, ref: 'Program', index: true },
    semesterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Semester', index: true },
    facultyStaffId: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff', index: true },
    credits: { type: Number, required: true, min: 0, max: 10 },
    status: {
      type: String,
      enum: ['Active', 'Inactive'],
      default: 'Active',
      index: true,
    },
    enrolled: { type: Number, min: 0, default: 0 },
    capacity: { type: Number, required: true, min: 1 },
    schedule: { type: String, required: true, trim: true },
    room: { type: String, required: true, trim: true },
    semester: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
  },
  { timestamps: true },
)

courseSchema.index({ title: 'text', code: 'text', courseNumber: 'text', department: 'text', faculty: 'text' })
courseSchema.index({ departmentId: 1, programId: 1, semesterId: 1, code: 1 }, { unique: true, sparse: true })

export const Course = mongoose.model('Course', courseSchema)
