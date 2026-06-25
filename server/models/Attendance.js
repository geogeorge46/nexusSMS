import mongoose from 'mongoose'

const attendanceSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      index: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
      index: true,
    },
    date: { type: Date, required: true, index: true },
    status: {
      type: String,
      enum: ['Present', 'Absent', 'Late', 'Excused'],
      required: true,
      index: true,
    },
    remarks: { type: String, trim: true, default: '' },
    markedBy: {
      userId: { type: String, trim: true, default: '' },
      name: { type: String, trim: true, default: 'Unknown User' },
      role: { type: String, trim: true, default: 'Admin' },
    },
  },
  { timestamps: true },
)

attendanceSchema.index({ studentId: 1, courseId: 1, date: 1 }, { unique: true })

export const Attendance = mongoose.model('Attendance', attendanceSchema)
