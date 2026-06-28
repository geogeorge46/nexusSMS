import mongoose from 'mongoose'

const timetableSlotSchema = new mongoose.Schema(
  {
    departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true, index: true },
    programId: { type: mongoose.Schema.Types.ObjectId, ref: 'Program', required: true, index: true },
    semesterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Semester', required: true, index: true },
    academicYearId: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademicYear', required: true, index: true },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    staffId: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff', required: true, index: true },
    roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true, index: true },
    dayOfWeek: {
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      required: true,
      index: true,
    },
    startTime: { type: String, required: true, trim: true },
    endTime: { type: String, required: true, trim: true },
    slotType: {
      type: String,
      enum: ['Lecture', 'Lab', 'Tutorial', 'Seminar', 'Exam', 'Other'],
      default: 'Lecture',
      index: true,
    },
    status: { type: String, enum: ['Active', 'Inactive', 'Cancelled'], default: 'Active', index: true },
    createdBy: {
      userId: { type: String, trim: true, default: '' },
      name: { type: String, trim: true, default: '' },
      role: { type: String, trim: true, default: '' },
    },
  },
  { timestamps: true },
)

timetableSlotSchema.index({ programId: 1, semesterId: 1, academicYearId: 1, dayOfWeek: 1, startTime: 1, endTime: 1 }, { unique: true })
timetableSlotSchema.index({ staffId: 1, dayOfWeek: 1, startTime: 1, endTime: 1 })
timetableSlotSchema.index({ roomId: 1, dayOfWeek: 1, startTime: 1, endTime: 1 })

export const TimetableSlot = mongoose.model('TimetableSlot', timetableSlotSchema)
